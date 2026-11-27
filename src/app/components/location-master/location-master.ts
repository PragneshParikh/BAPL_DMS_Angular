//src\app\components\location-master\location-master.ts
import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ErpSyncDialog } from '../../shared/erp-sync/erp-sync-dialog';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { locationAreaMaster } from '../../constant';
import { DealerService } from '../../core/services/dealer-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { ElementRef, ViewChild } from '@angular/core';
import { filterRows } from '../../shared/search/table-search';
import { SearchSelect, SearchSelectOption } from '../../shared/search-select/search-select';

declare var bootstrap: any;

@Component({
  selector: 'app-location-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule, SearchSelect],
  templateUrl: './location-master.html'
})

export class LocationMasterComponent implements OnInit {

  locationList: any[] = [];
  originalLocationList: any[] = [];
  dealerList: any[] = [];
  isDealer: boolean = false;
  locationArea: string = '';
  locationName: string = '';
  /** 26.11.2026 Status filter: '' = all, 'Y' = active, 'N' = inactive */
  statusFilter: string = '';
  dealerOptions: SearchSelectOption[] = [];
  selectedLocation: any = {};
  pagedLocationList: any[] = [];
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  startIndex = 0;
  endIndex = 0;
  sortColumn = 'rrglocationidno';
  sortDirection = 'desc';

  readonly SUBMENU_ID = 3;
  canDownload = false;
  canEdit = false;

  isSuperAdmin: boolean = false;
  dealerCode: string | null = null;

  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private locationService: LocationMasterService,
    private dealerMasterService: DealerService,
    private loader: LoaderService,
    private storageService: StorageService,
    public toastr: ToastService,
    private menuAccess: MenuAccessService,
    private modalService: NgbModal
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);

    // FIXED: a genuinely dealer-scoped login must be locked to its own
    // dealerCode and see only its own locations. Previously isDealer was
    // never set true anywhere in this component and dealerCode was left
    // null for every login, so a dealer user saw every other dealer's
    // locations too. The dropdown's [disabled]="isDealer" binding in the
    // template was already wired for this — it just never activated.
    if (!this.isSuperAdmin) {
      this.isDealer = true;
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  /** 26.11.2026 - SuperAdmin: UAT ERP location list import / ERP C_DMS_DealerConsigneeDetail sync (preview, then Apply) */
  openErpSync(mode: 'import' | 'sync'): void {
    const ref = this.modalService.open(ErpSyncDialog, { size: 'xl', centered: true, backdrop: 'static', scrollable: true });
    ref.componentInstance.kind = 'location';
    ref.componentInstance.mode = mode;
    ref.componentInstance.dealerCode = mode === 'sync' ? this.dealerCode : null;
    ref.result.then(r => { if (r === 'saved') this.loadLocations(); }, () => {});
  }

  ngOnInit(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    this.loadDealerDropdown();
    this.loadLocations();
  }

  loadLocations() {
    this.loader.show();
    this.locationService.getAllLocationMaster().subscribe({
      next: (res: any) => {
        this.loader.hide();
        const data = res?.data || res;
        this.originalLocationList = data;

        // FIXED: a dealer-scoped login (isDealer/dealerCode set in the
        // constructor) must only ever see its own dealer's locations on
        // initial load, not the full unfiltered list. Superadmin logins
        // (dealerCode null) still see everything, same as before.
        // keeps the dealer / area / status / keyword filters after a reload (e.g. after ERP import)
        this.applyFilters();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  /** 26.11.2026 - one place for all filters: dealer, area, status, keyword */
  private applyFilters(): void {
    let filtered = this.originalLocationList || [];

    if (this.dealerCode) {
      filtered = filtered.filter((x: any) => x.dealercode == this.dealerCode);
    }

    if (this.locationArea) {
      filtered = filtered.filter((x: any) =>
        x.locareaidno == this.locationArea
      );
    }

    if (this.statusFilter === 'Y') {
      filtered = filtered.filter((x: any) => (x.active || '').toString().trim().toUpperCase() === 'Y');
    } else if (this.statusFilter === 'N') {
      filtered = filtered.filter((x: any) => (x.active || '').toString().trim().toUpperCase() !== 'Y');
    }

    if (this.locationName?.trim()) {
      filtered = filterRows(filtered, this.locationName, ['loccode', 'locname', 'dealercode', 'formtype', 'rrglocationidno']);
    }

    this.locationList = [...filtered];
    this.sort(this.sortColumn, true);
    this.page = 1;
    this.loadPage();
  }

  searchLocation() {
    this.applyFilters();
  }

  resetSearch() {
    // FIXED: a dealer-scoped login must stay locked to its own dealerCode —
    // only a superadmin login's Reset should clear the dealer filter back to
    // "all dealers". Previously this.dealerCode was cleared unconditionally,
    // so Reset would silently leak every other dealer's locations into a
    // dealer-scoped user's view.
    if (!this.isDealer) {
      this.dealerCode = null;
    }
    this.locationArea = '';
    this.locationName = '';
    this.statusFilter = '';

    this.applyFilters();
  }

  openEditModal(location: any) {
    this.selectedLocation = { ...location };
    const modal = new bootstrap.Modal(
      document.getElementById('editLocationModal') as HTMLElement
    );
    modal.show();
  }

  sort(column: string, isDefault: boolean = false) {
    if (!isDefault) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    }
    this.locationList.sort((a, b) => {
      let valueA = a[column] || '';
      let valueB = b[column] || '';
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.loadPage();
  }

  locationAreaMaster = locationAreaMaster;
  getLocationAreaName(id: number) {
    const area = this.locationAreaMaster.find(x => x.id == id);
    return area ? area.name : '';
  }

  loadPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.totalRecords = this.locationList.length;
    this.pagedLocationList = this.locationList.slice(start, end);
    this.startIndex = this.totalRecords === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.totalRecords);
  }

  getSortClass(column: string) {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc'
      ? 'sort-asc'
      : 'sort-desc';
  }

  checkSearchReset(selectedDealerCode: string | null) {
    // a dealer-scoped login stays locked to its own dealerCode (dropdown is disabled)
    if (!this.isDealer) {
      this.dealerCode = selectedDealerCode;
    }
    // 26.11.2026 - keep area / status / keyword filters when the dealer changes
    this.applyFilters();
  }

  checkIfEmpty() {
    this.applyFilters();
  }

  checkKeywordReset() {
    if (!this.locationName || this.locationName.trim() === '') {
      this.applyFilters();
    }
  }

  loadDealerDropdown() {
    this.loader.show();

    // NOTE: still fetches every dealer (passing null), not just this.dealerCode.
    // This is intentional even for a dealer-scoped login: the dropdown is
    // disabled but its [(ngModel)] still needs to resolve dealerCode to a
    // matching option so it displays the dealer's own name instead of a
    // blank/placeholder value.
    this.dealerMasterService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        this.dealerList = res.data || [];
        // 26.11.2026 searchable dealer dropdown: name + code
        this.dealerOptions = this.dealerList.map((d: any) => ({ value: d.dealerCode, label: d.dealerName, sub: d.dealerCode }));
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error("Dealer Dropdown Error:", err);
      }
    });
  }

  downloadLocationExcel() {
    this.loader.show();
    this.locationService.downloadLocationMasterExcel().subscribe({
      next: (response: Blob) => {
        this.loader.hide();
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'LocationMaster.xlsx';
        a.click();

        window.URL.revokeObjectURL(url);
        this.toastr.show('Excel downloaded successfully', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toastr.show('Excel download failed', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  triggerImportFileInput(): void {
    this.importFileInput.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loader.show();

    this.locationService.importLocationExcel(file).subscribe({
      next: (res: any) => {
        this.loader.hide();
        input.value = '';

        const summary = res?.data;
        const message = this.importMessage(summary, 'Location data imported successfully');

        this.toastr.show(message, {
          classname: summary?.failedCount ? 'bg-warning text-dark' : 'bg-success text-white',
          delay: summary?.failedCount ? 20000 : 5000
        });

        this.loadLocations();
      },
      error: (err) => {
        this.loader.hide();
        input.value = '';
        console.error(err);
        this.toastr.show(this.importError(err, 'Failed to import location data!'), {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // ADDED — turns the import API response / error into a readable message (row errors + server reason)
  private importMessage(summary: any, okText: string): string {
    if (!summary) return okText;
    let msg = `Import complete: ${summary.insertedCount} added, ${summary.updatedCount} updated, ${summary.failedCount} failed.`;
    const errs: any[] = summary.errors ?? [];
    if (errs.length) {
      console.table(errs);
      msg += ' ' + errs.slice(0, 5).map(e => `Row ${e.rowNumber} (${e.dealerCode ?? e.loccode ?? ''}): ${e.message}`).join(' | ');
      if (errs.length > 5) msg += ` | ... ${errs.length - 5} more (see browser console)`;
    }
    return msg;
  }

  private importError(err: any, fallback: string): string {
    const e = err?.error;
    if (typeof e === 'string' && e.trim()) return `${fallback} ${e}`;
    if (e?.message) return `${fallback} ${e.message}`;
    if (e?.title) return `${fallback} ${e.title}`;
    return `${fallback} (HTTP ${err?.status ?? '?'} - see browser console)`;
  }
}