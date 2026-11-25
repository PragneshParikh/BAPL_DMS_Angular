import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ZeroHoursJobDataService,ZeroHoursJobDataRow} from '../../../core/services/zero-hours-job-data';

@Component({
  selector: 'app-zero-hours-job-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zero-hours-job-data.html',
  styleUrl: './zero-hours-job-data.scss'
})
export class ZeroHoursJobDataComponent implements OnInit {
  private http = inject(HttpClient);
  private service = inject(ZeroHoursJobDataService);
  private cdr = inject(ChangeDetectorRef);

  rows: ZeroHoursJobDataRow[] = [];
  totalRecords = 0;
  loading = false;
  importing = false;

  dealerCode = '';
  fromDate = '2026-04-01';
  toDate = new Date().toISOString().split('T')[0];
  searchText = '';
  pageIndex = 1;
  pageSize = 25;

  dealers: { dealerCode: string; dealerName: string }[] = [];
  isAdmin = false;

  ngOnInit(): void {
    this.detectRole();
    if (this.isAdmin) {
      this.loadDealers();
    }
    this.search();
  }

  private detectRole(): void {
    const raw = [
      localStorage.getItem('role'),
      localStorage.getItem('Role'),
      localStorage.getItem('roleName'),
      localStorage.getItem('userRole')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    this.isAdmin = raw.includes('admin');
  }

 private loadDealers(): void {
  this.http.get<any>(`${environment.apiUrl}/DealerMaster/getDealerDropdown`).subscribe({
    next: (res) => {
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      this.dealers = list
        .map((d: any) => ({
          dealerCode: String(d.dealerCode ?? d.DealerCode ?? d.code ?? d.value ?? '').trim(),
          dealerName: String(d.dealerName ?? d.DealerName ?? d.name ?? d.text ?? d.label ?? '').trim()
        }))
        .filter((d: any) => d.dealerCode);
      this.cdr.detectChanges();
    },
    error: () => {
      this.dealers = [];
      this.cdr.detectChanges();
    }
  });
}
  search(resetPage = false): void {
    if (resetPage) this.pageIndex = 1;
    this.loading = true;

    this.service
      .getList({
        dealerCode: this.dealerCode,
        fromDate: this.fromDate,
        toDate: this.toDate,
        search: this.searchText,
        pageIndex: this.pageIndex,
        pageSize: this.pageSize
      })
      .subscribe({
        next: (res) => {
          this.rows = res?.data || [];
          this.totalRecords = res?.totalRecords || 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.cdr.detectChanges();
          alert(err?.error?.message || 'Failed to load Zero Hours Job Data.');
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.importing = true;
    this.service.importFile(file).subscribe({
      next: (res) => {
        this.importing = false;
        this.cdr.detectChanges();
        input.value = '';
        alert(res?.message || 'Imported successfully.');
        this.search(true);
      },
      // error: (err) => {
      //   this.importing = false;
      //   this.cdr.detectChanges();
      //   input.value = '';
      //   alert(err?.error?.message || 'Import failed.');
      // }
      error: (err) => {
  this.importing = false;
  this.cdr.detectChanges();
  input.value = '';
  const msg =
    err?.error?.message ||
    (typeof err?.error === 'string' ? err.error : null) ||
    `Import failed (Status: ${err?.status || 'Unknown'}).`;
  alert(msg);
}
    });
  }

  exportExcel(): void {
    this.service
      .exportExcel({
        dealerCode: this.dealerCode,
        fromDate: this.fromDate,
        toDate: this.toDate,
        search: this.searchText
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ZeroHoursJobData_${new Date().toISOString().slice(0, 10)}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => alert('Failed to export Excel.')
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.search();
  }
}