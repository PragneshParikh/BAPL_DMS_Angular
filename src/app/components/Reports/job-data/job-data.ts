// src\app\components\Reports\job-data\job-data.ts
// Reports > Job Data: dealer (or All Dealers) + Start / End Date over the imported service history
// (BAPLDMSvad.dbo.JobCardServiceHistory). Dealer-wise totals + job records; server-side filtering and paging;
// Excel export of all filtered records.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  JcshDealerOption, JcshReportPage, JobcardServicehistoryReportService
} from '../../../core/services/jobcard-servicehistory-report.service';
import { StorageService } from '../../../core/services/storage';
import { ToastService } from '../../../shared/toaster/toast-service';

interface JobDataFilter { dealerCode: string; fromDate: string; toDate: string; }

@Component({
  selector: 'app-job-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-data.html',
  styleUrl: '../service-history/service-history.scss'
})
export class JobData implements OnInit {
  isAdmin = false;

  dealers: JcshDealerOption[] = [];
  /** '' = All Dealers */
  dealerCode = '';
  fromDate = '';
  toDate = '';
  /** the filter the table is showing (paging / export use this) */
  applied: JobDataFilter | null = null;

  page = 1;
  pageSize = 50;
  readonly pageSizes = [25, 50, 100, 200];

  data: JcshReportPage | null = null;
  loading = false;
  exporting = false;
  error: string | null = null;

  constructor(private api: JobcardServicehistoryReportService, private storage: StorageService, private toaster: ToastService) { }

  ngOnInit(): void {
    const role = (this.storage.getRole() || '').toLowerCase().trim();
    this.isAdmin = role === 'superadmin' || role === 'admin';
    if (!this.isAdmin) return;
    // default: current month up to today
    const t = new Date();
    this.fromDate = this.iso(new Date(t.getFullYear(), t.getMonth(), 1));
    this.toDate = this.iso(t);
    this.api.dealers().subscribe({
      next: d => this.dealers = d ?? [],
      error: async e => this.error = 'Dealer list: ' + await this.api.errorText(e)
    });
  }

  get dateError(): string | null {
    if (!this.fromDate || !this.toDate) return 'Choose a Start Date and an End Date.';
    if (this.toDate < this.fromDate) return 'End Date is before Start Date.';
    return null;
  }
  get totalPages(): number { return this.data ? Math.max(1, Math.ceil(this.data.total / this.pageSize)) : 1; }
  dealerName(code: string): string { return this.dealers.find(d => d.dealerCode === code)?.dealerName ?? ''; }

  apply(): void {
    if (this.dateError || this.loading) return;
    this.applied = { dealerCode: this.dealerCode, fromDate: this.fromDate, toDate: this.toDate };
    this.page = 1;
    this.load();
  }

  /** dealer-wise table: click a dealer to see only its jobs */
  pickDealer(code: string): void {
    if (this.loading) return;
    this.dealerCode = code;
    this.apply();
  }

  goTo(p: number): void {
    if (!this.applied || p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.load();
  }

  onPageSizeChange(): void { if (this.applied) { this.page = 1; this.load(); } }

  async load(): Promise<void> {
    const f = this.applied!;
    this.loading = true;
    this.error = null;
    try {
      this.data = await firstValueFrom(this.api.jobData(f.dealerCode || null, f.fromDate, f.toDate, this.page, this.pageSize));
    } catch (e: any) {
      this.error = await this.api.errorText(e);
      this.data = null;
    } finally {
      this.loading = false;
    }
  }

  async exportExcel(): Promise<void> {
    const f = this.applied;
    if (!f || !this.data?.total || this.exporting) return;
    this.exporting = true;
    try {
      const res = await firstValueFrom(this.api.exportJobData(f.dealerCode || null, f.fromDate, f.toDate));
      this.api.save(res, `Job_Data_${f.dealerCode || 'AllDealers'}_${f.fromDate}_${f.toDate}.xlsx`);
      this.toast(`${this.num(Number(res.headers.get('X-Row-Count') ?? this.data.total))} records exported.`, 'success');
    } catch (e: any) {
      this.toast(await this.api.errorText(e), 'danger');
    } finally {
      this.exporting = false;
    }
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  num(v: number | null | undefined): string { return v == null ? '0' : new Intl.NumberFormat('en-IN').format(v); }
  amt(v: number | null | undefined): string { return v == null ? '—' : new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v); }
  inr(v: number | null | undefined): string {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  }
  date(v?: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }
  first(): number { return this.data && this.data.total ? (this.page - 1) * this.pageSize + 1 : 0; }
  last(): number { return this.data ? (this.page - 1) * this.pageSize + this.data.rows.length : 0; }

  private toast(msg: string, kind: 'success' | 'warning' | 'danger'): void {
    this.toaster.show(msg, { classname: `bg-${kind} text-${kind === 'warning' ? 'dark' : 'white'}`, delay: 6000 });
  }
}
