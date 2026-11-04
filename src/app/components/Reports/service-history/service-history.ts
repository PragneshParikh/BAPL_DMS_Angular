// src\app\components\Reports\service-history\service-history.ts
// Reports > Service History: one search box (Chassis No or Registration No) over the imported
// service history (BAPLDMSvad.dbo.JobCardServiceHistory). Server-side search + paging; Excel export of all matches.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, catchError, debounceTime, distinctUntilChanged, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { JcshReportPage, JcshSuggestion, JobcardServicehistoryReportService } from '../../../core/services/jobcard-servicehistory-report.service';
import { StorageService } from '../../../core/services/storage';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-service-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbTypeaheadModule],
  templateUrl: './service-history.html',
  styleUrl: './service-history.scss'
})
export class ServiceHistory implements OnInit {
  isAdmin = false;
  search = '';
  /** the search the table is showing (paging / export use this, not the box while typing) */
  searched = '';
  /** true when the table shows a value picked from the suggestions (exact match on the stored value) */
  searchedExact = false;
  /** the last value picked from the suggestions - Search on that same text stays an exact match */
  private picked: string | null = null;
  /** type-ahead state for the spinner / "no match" hint */
  suggesting = false;
  noSuggestions = false;

  /** type-ahead: after 2 letters/digits, 200 ms after the last keystroke, ask the API (latest request wins) */
  suggestFn: OperatorFunction<string, readonly JcshSuggestion[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        const t = (term || '').replace(/[^a-z0-9]/gi, '');
        this.noSuggestions = false;
        if (t.length < 2) return of([] as JcshSuggestion[]);
        this.suggesting = true;
        return this.api.suggest(term).pipe(
          catchError(() => of([] as JcshSuggestion[])),
          tap(list => { this.suggesting = false; this.noSuggestions = list.length === 0; })
        );
      })
    );

  /** keep the box showing plain text (the model stays a string) */
  formatInput = (x: JcshSuggestion | string) => typeof x === 'string' ? x : x.value;

  /** a suggestion was picked: put its value in the box and show its service history straight away */
  onPick(ev: NgbTypeaheadSelectItemEvent<JcshSuggestion>): void {
    ev.preventDefault();          // keep the model a string, not the suggestion object
    this.search = ev.item.value;
    this.picked = ev.item.value;
    this.noSuggestions = false;
    this.searched = ev.item.value;
    this.searchedExact = true;
    this.page = 1;
    this.load();
  }
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
  }

  get cleaned(): string { return (this.search || '').replace(/[^a-z0-9]/gi, '').toUpperCase(); }
  get isPicked(): boolean { return !!this.picked && this.search === this.picked; }
  get canSearch(): boolean { return (this.isPicked || this.cleaned.length >= 3) && !this.loading; }
  get totalPages(): number { return this.data ? Math.max(1, Math.ceil(this.data.total / this.pageSize)) : 1; }

  /** Search button / Enter: exact match if the box still holds a picked suggestion, otherwise "starts with" */
  find(): void {
    if (!this.canSearch) return;
    this.searchedExact = this.isPicked;
    this.searched = this.searchedExact ? this.search : this.cleaned;
    this.page = 1;
    this.load();
  }

  clear(): void {
    this.search = ''; this.searched = ''; this.searchedExact = false; this.picked = null;
    this.data = null; this.error = null; this.noSuggestions = false;
  }

  goTo(p: number): void {
    if (!this.searched || p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.load();
  }

  onPageSizeChange(): void { if (this.searched) { this.page = 1; this.load(); } }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.data = await firstValueFrom(this.api.serviceHistory(this.searched, this.page, this.pageSize, this.searchedExact));
    } catch (e: any) {
      this.error = await this.api.errorText(e);
      this.data = null;
    } finally {
      this.loading = false;
    }
  }

  async exportExcel(): Promise<void> {
    if (!this.searched || !this.data?.total || this.exporting) return;
    this.exporting = true;
    try {
      const res = await firstValueFrom(this.api.exportServiceHistory(this.searched, this.searchedExact));
      this.api.save(res, `Service_History_${this.searched}.xlsx`);
      this.toast(`${this.num(Number(res.headers.get('X-Row-Count') ?? this.data.total))} records exported.`, 'success');
    } catch (e: any) {
      this.toast(await this.api.errorText(e), 'danger');
    } finally {
      this.exporting = false;
    }
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
