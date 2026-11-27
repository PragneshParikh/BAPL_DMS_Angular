import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewZeroHoursService, NewZeroHoursRow } from '../../../core/services/new-zero-hours';
import { SearchSelect, SearchSelectOption } from '../../../shared/search-select/search-select';

@Component({
  selector: 'app-new-zero-hours',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelect],
  templateUrl: './new-zero-hours.html'
})
export class NewZeroHoursComponent implements OnInit {
  private service = inject(NewZeroHoursService);
  private cdr = inject(ChangeDetectorRef);

  dealers: { dealerCode: string; dealerName: string }[] = [];
  locations: { locationCode: string; locationName: string }[] = [];

  // 26.11.2026 searchable dealer filter; list is scoped by the API (admin all, employee mapped, dealer own)
  private _dlSrc: any = null;
  private _dlOpts: SearchSelectOption[] = [];
  get dealerOptions(): SearchSelectOption[] {
    if (this._dlSrc !== this.dealers) {
      this._dlSrc = this.dealers;
      this._dlOpts = (this.dealers || []).map(d => ({ value: d.dealerCode, label: d.dealerName || d.dealerCode, sub: d.dealerCode }));
    }
    return this._dlOpts;
  }

  pickDealer(code: string | null): void {
    this.dealerCode = code || 'ALL';
    this.onDealerChange();
  }

  dealerCode = 'ALL';
  locationCode = 'ALL';
  fromDate = '2026-04-01';
  toDate = new Date().toISOString().substring(0, 10);
  search = '';

  rows: NewZeroHoursRow[] = [];
  totalRecords = 0;
  pageIndex = 1;
  pageSize = 25;
  loading = false;
  syncing = false;
  exporting = false;

  ngOnInit(): void {
    this.loadDealers();
    this.loadLocations();
    this.onSearch();
  }

  private mapRowsWithDealerName(rawList: any[]): NewZeroHoursRow[] {
    const dealerMap = new Map<string, string>();
    for (const d of this.dealers) {
      if (d.dealerCode) {
        dealerMap.set(d.dealerCode.trim().toUpperCase(), d.dealerName.trim());
      }
    }

    return rawList.map((r: any) => {
      const dc = String(r.dealerCode ?? r.DealerCode ?? '').trim().toUpperCase();
      const matchedDealerName = dealerMap.get(dc) || '';
      const resolvedCompName =
        String(r.compName ?? r.CompName ?? r.dealerName ?? r.DealerName ?? '').trim() ||
        matchedDealerName ||
        String(r.locationName ?? r.LocationName ?? '').trim() ||
        '-';

      return {
        ...r,
        dealerName: matchedDealerName || resolvedCompName,
        compName: resolvedCompName,
        dealerType: r.dealerType || r.DealerType || 'B2C',
        accessoryAmount: r.accessoryAmount ?? 0,
        oilAmount: r.oilAmount ?? 0,
        outsideWorkAmount: r.outsideWorkAmount ?? 0,
        zoneName: r.zoneName || r.ZoneName || '-',
        uniqueId: r.uniqueId || r.UniqueId || (r.id ? String(r.id) : '-')
      };
    });
  }

  loadDealers(): void {
    this.service.getDealers().subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.dealers = list
          .map((d: any) => ({
            dealerCode: String(d.dealerCode ?? d.DealerCode ?? d.code ?? '').trim(),
            dealerName: String(d.dealerName ?? d.DealerName ?? d.name ?? '').trim()
          }))
          .filter((d: any) => d.dealerCode);

        if (this.rows.length > 0) {
          this.rows = this.mapRowsWithDealerName(this.rows);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.dealers = [];
        this.cdr.detectChanges();
      }
    });
  }

  onDealerChange(): void {
    this.locationCode = 'ALL';
    this.loadLocations(this.dealerCode !== 'ALL' ? this.dealerCode : undefined);
    this.pageIndex = 1;
    this.onSearch();
  }

  loadLocations(dealerCode?: string): void {
    this.service.getLocations(dealerCode).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.locations = list
          .map((l: any) => ({
            locationCode: String(l.locationCode ?? l.LocationCode ?? '').trim(),
            locationName: String(l.locationName ?? l.LocationName ?? '').trim()
          }))
          .filter((l: any) => l.locationCode);
        this.cdr.detectChanges();
      },
      error: () => {
        this.locations = [];
        this.cdr.detectChanges();
      }
    });
  }

  onSync(): void {
    this.syncing = true;
    this.service.syncFromNewDms({
      dealerCode: this.dealerCode,
      fromDate: this.fromDate,
      toDate: this.toDate
    }).subscribe({
      next: (res) => {
        this.syncing = false;
        alert(res?.message || `Synced ${res?.syncedCount ?? 0} records.`);
        this.pageIndex = 1;
        this.onSearch();
      },
      error: (err) => {
        this.syncing = false;
        alert(err?.error?.message || 'Sync failed.');
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.loading = true;
    this.service.getList({
      dealerCode: this.dealerCode,
      locationCode: this.locationCode,
      fromDate: this.fromDate,
      toDate: this.toDate,
      search: this.search,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    }).subscribe({
      next: (res) => {
        const rawList = res?.data || [];
        this.rows = this.mapRowsWithDealerName(rawList);
        this.totalRecords = res?.totalRecords || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.rows = [];
        this.totalRecords = 0;
        alert(err?.error?.message || 'Failed to load records.');
        this.cdr.detectChanges();
      }
    });
  }

  onExport(): void {
    this.exporting = true;
    this.service.exportExcel({
      dealerCode: this.dealerCode,
      locationCode: this.locationCode,
      fromDate: this.fromDate,
      toDate: this.toDate,
      search: this.search
    }).subscribe({
      next: (blob) => {
        this.exporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'New_Zero_Hours_Report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: () => {
        this.exporting = false;
        alert('Export failed.');
        this.cdr.detectChanges();
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.pageIndex = newPage;
    this.onSearch();
  }
}