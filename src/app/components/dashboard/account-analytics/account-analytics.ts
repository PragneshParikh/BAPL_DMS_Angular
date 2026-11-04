// src\app\components\dashboard\account-analytics\account-analytics.ts
// Account Dashboard - receipts from GET ReceiptEntry/getReceiptEntryList and billed value from
// GET Report/vehicle-sale (one row per vehicle billed), for the selected date range.
// Nothing is hard-coded; dealer users see only their own dealer (same rule as Receipt Entry).
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReceiptEntryService } from '../../../core/services/receipt-entry-service';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { ReceiptEntryModel } from '../../../ViewModels/ReceiptEntryModel';
import { UnifiedSaleReportViewModel } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import { DashboardBase, buildBuckets, toIsoDay, groupSum, pct, hBarChart, trendChart, donutChart, COLORS } from '../dashboard-kit';
import { DashboardFilter } from '../dashboard-filter';

const ACCOUNT_LINKS = {
  receipts: '/receipt-entry',
  ledger: '/customer-ledger',
  vehicleSale: '/vehicle-sale-report'
} as const;

@Component({
  selector: 'app-account-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardFilter],
  templateUrl: './account-analytics.html',
  styleUrl: './account-analytics.scss'
})
export class AccountAnalytics extends DashboardBase implements OnInit, AfterViewInit {
  @ViewChild('trend') trendEl?: ElementRef<HTMLDivElement>;
  @ViewChild('bySaleType') saleTypeEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byFinancier') financierEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byLocation') locationEl?: ElementRef<HTMLDivElement>;

  readonly acc = ACCOUNT_LINKS;
  loading = false;
  failed = { receipts: false, sales: false };
  receipts: ReceiptEntryModel[] = [];
  sales: UnifiedSaleReportViewModel[] = [];
  search = '';
  hasReceipts = false;
  private viewReady = false;

  constructor(private receiptService: ReceiptEntryService, private report: ReportService,
              private storage: StorageService, zone: NgZone, router: Router) {
    super(zone, router);
  }

  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.viewReady = true; this.render(); }

  private get dealerFilter(): string | undefined {
    const role = (this.storage.getRole() ?? '').toString().toLowerCase();
    return role === 'superadmin' ? undefined : (this.storage.getDealerCode() || undefined);
  }

  load(): void {
    this.loading = true;
    this.failed = { receipts: false, sales: false };
    const dealerCode = this.dealerFilter;
    forkJoin({
      receipts: this.receiptService.getReceiptEntryList({ fromDate: this.from, toDate: this.to, dealerCode })
        .pipe(catchError(() => { this.failed.receipts = true; return of([] as ReceiptEntryModel[]); })),
      sales: this.report.getVehicleSaleReport({ fromDate: this.from, toDate: this.to } as any)
        .pipe(catchError(() => { this.failed.sales = true; return of([] as UnifiedSaleReportViewModel[]); }))
    }).subscribe(res => {
      this.receipts = res.receipts ?? [];
      this.sales = res.sales ?? [];
      this.loading = false;
      setTimeout(() => this.render());
    });
  }

  get anyFailed(): boolean { return this.failed.receipts || this.failed.sales; }

  // ---------------------------------------------------------------- KPIs
  private amt(r: ReceiptEntryModel): number { return Number(r.totalAmount ?? 0) || 0; }
  private billed(r: UnifiedSaleReportViewModel): number { return Number(r.finalAmount ?? r.totalAmount ?? 0) || 0; }
  get receiptValue(): number { return this.receipts.reduce((s, r) => s + this.amt(r), 0); }
  get receiptCount(): number { return this.receipts.length; }
  get partyCount(): number { return new Set(this.receipts.map(r => (r.partyName ?? '').trim().toLowerCase()).filter(Boolean)).size; }
  get avgReceipt(): number | null { return this.receiptCount ? this.receiptValue / this.receiptCount : null; }
  get billedValue(): number { return this.sales.reduce((s, r) => s + this.billed(r), 0); }
  get billedUnits(): number { return this.sales.length; }
  get receiptToBilledPct(): number { return pct(this.receiptValue, this.billedValue); }
  get financedReceipts(): number { return this.receipts.filter(r => (r.financier ?? '').trim()).length; }

  // ---------------------------------------------------------------- table
  get recentReceipts(): ReceiptEntryModel[] {
    const q = this.search.trim().toLowerCase();
    return this.receipts
      .filter(r => !q || [r.receiptNo, r.partyName, r.mobileNo, r.bookingId, r.saleType, r.financier, r.location, r.dealerCode]
        .some(v => (v ?? '').toString().toLowerCase().includes(q)))
      .sort((a, b) => (toIsoDay(b.receiptDate) ?? '').localeCompare(toIsoDay(a.receiptDate) ?? ''))
      .slice(0, 12);
  }
  receiptDate(r: ReceiptEntryModel): string {
    const d = toIsoDay(r.receiptDate);
    return d ? d.split('-').reverse().join('.') : '—';
  }
  amountOf(r: ReceiptEntryModel): number { return this.amt(r); }
  open(url: string = this.acc.receipts): void { this.go(url); }

  // ---------------------------------------------------------------- charts
  private render(): void {
    if (!this.viewReady) return;
    this.resetCharts();
    this.hasReceipts = this.receipts.length > 0;
    const click = () => this.open();

    // Receipts vs billed value per day / month
    if (this.hasReceipts || this.sales.length) {
      const b = buildBuckets(this.from, this.to);
      const idx = new Map(b.keys.map((k, i) => [k, i]));
      const rec = new Array(b.keys.length).fill(0);
      const bil = new Array(b.keys.length).fill(0);
      const slot = (d: string | null) => d ? idx.get(b.monthly ? d.slice(0, 7) : d) : undefined;
      for (const r of this.receipts) { const i = slot(toIsoDay(r.receiptDate)); if (i !== undefined) rec[i] += this.amt(r); }
      for (const s of this.sales) { const i = slot(toIsoDay(s.saleDate ?? s.billDate)); if (i !== undefined) bil[i] += this.billed(s); }
      this.draw(this.trendEl?.nativeElement, trendChart(b.labels,
        { name: 'Receipts', data: rec.map(v => Math.round(v)), money: true },
        { name: 'Billed Value', data: bil.map(v => Math.round(v)), money: true },
        { height: 320, onClick: click }));
    }
    if (!this.hasReceipts) return;

    const st = groupSum(this.receipts, r => r.saleType, r => this.amt(r), 5);
    this.draw(this.saleTypeEl?.nativeElement, donutChart(st.map(s => s.label), st.map(s => Math.round(s.value)),
      { centreLabel: 'Receipts', money: true, height: 290, onClick: click }));

    const fin = groupSum(this.receipts.filter(r => (r.financier ?? '').trim()), r => r.financier, r => this.amt(r), 8);
    this.draw(this.financierEl?.nativeElement, hBarChart(fin.map(f => f.label), fin.map(f => Math.round(f.value)),
      { name: 'Receipts', money: true, height: 300, color: COLORS.indigo, onClick: click }), fin.length > 0);

    const loc = groupSum(this.receipts, r => r.location || r.dealerCode, r => this.amt(r), 8);
    this.draw(this.locationEl?.nativeElement, hBarChart(loc.map(l => l.label), loc.map(l => Math.round(l.value)),
      { name: 'Receipts', money: true, height: 300, color: COLORS.teal, onClick: click }));
  }

  get hasFinancier(): boolean { return this.receipts.some(r => (r.financier ?? '').trim()); }
}
