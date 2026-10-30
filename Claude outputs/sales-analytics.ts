// src\app\components\dashboard\sales-analytics\sales-analytics.ts
// Sales Analytics - built from GET Report/vehicle-sale rows (one row per vehicle billed).
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { UnifiedSaleReportViewModel } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import {
  DashboardBase, PeriodKey, periodRange, fmtRange, buildBuckets, toIsoDay, groupSum, pct,
  barChart, hBarChart, trendChart, donutChart, COLORS
} from '../dashboard-kit';

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sales-analytics.html'
})
export class SalesAnalytics extends DashboardBase implements OnInit, AfterViewInit {
  @ViewChild('trend') trendEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byModel') modelEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byState') stateEl?: ElementRef<HTMLDivElement>;
  @ViewChild('finance') financeEl?: ElementRef<HTMLDivElement>;

  period: PeriodKey = 'fytd';
  from = '';
  to = '';
  loading = false;
  failed = false;
  rows: UnifiedSaleReportViewModel[] = [];
  search = '';
  private viewReady = false;

  constructor(private report: ReportService, zone: NgZone, router: Router) {
    super(zone, router);
  }

  ngOnInit(): void { this.setPeriod(this.period); }
  ngAfterViewInit(): void { this.viewReady = true; this.render(); }

  get periodLabel(): string { return fmtRange(this.from, this.to); }

  setPeriod(key: PeriodKey): void {
    this.period = key;
    const r = periodRange(key);
    this.from = r.from;
    this.to = r.to;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.failed = false;
    this.report.getVehicleSaleReport({ fromDate: this.from, toDate: this.to } as any).subscribe({
      next: rows => { this.rows = rows ?? []; this.loading = false; setTimeout(() => this.render()); },
      error: () => { this.rows = []; this.failed = true; this.loading = false; setTimeout(() => this.render()); }
    });
  }

  // ---------------------------------------------------------------- KPIs
  private amount(r: UnifiedSaleReportViewModel): number { return Number(r.finalAmount ?? r.totalAmount ?? 0) || 0; }
  private financed(r: UnifiedSaleReportViewModel): boolean {
    return !!((r.financier ?? r.financeBy ?? '').toString().trim());
  }
  get units(): number { return this.rows.length; }
  get revenue(): number { return this.rows.reduce((s, r) => s + this.amount(r), 0); }
  get avgTicket(): number | null { return this.units ? this.revenue / this.units : null; }
  get financedCount(): number { return this.rows.filter(r => this.financed(r)).length; }
  get financedPct(): number { return pct(this.financedCount, this.units); }
  get modelsSold(): number { return new Set(this.rows.map(r => r.modelName ?? r.oemModelName)).size; }
  get dealersBilling(): number { return new Set(this.rows.map(r => r.dealerCode)).size; }

  // ---------------------------------------------------------------- table
  get topSales(): UnifiedSaleReportViewModel[] {
    const q = this.search.trim().toLowerCase();
    return [...this.rows]
      .filter(r => !q || [r.invoiceNo, r.saleBillNo, r.dealerName, r.dealerCode, r.modelName, r.colour, r.dealerCity]
        .some(v => (v ?? '').toString().toLowerCase().includes(q)))
      .sort((a, b) => this.amount(b) - this.amount(a))
      .slice(0, 10);
  }
  saleDate(r: UnifiedSaleReportViewModel): string {
    const d = toIsoDay(r.saleDate ?? r.billDate);
    return d ? d.split('-').reverse().join('.') : '—';
  }
  amountOf(r: UnifiedSaleReportViewModel): number { return this.amount(r); }
  openReport(): void { this.go(this.links.vehicleSale); }

  // ---------------------------------------------------------------- charts
  hasData = false;

  private render(): void {
    if (!this.viewReady) return;
    this.resetCharts();
    this.hasData = this.rows.length > 0;
    if (!this.hasData) return;

    // Trend: units + revenue per day/month
    const b = buildBuckets(this.from, this.to);
    const idx = new Map(b.keys.map((k, i) => [k, i]));
    const units = new Array(b.keys.length).fill(0);
    const value = new Array(b.keys.length).fill(0);
    for (const r of this.rows) {
      const d = toIsoDay(r.saleDate ?? r.billDate);
      if (!d) continue;
      const i = idx.get(b.monthly ? d.slice(0, 7) : d);
      if (i === undefined) continue;
      units[i] += 1;
      value[i] += this.amount(r);
    }
    this.draw(this.trendEl?.nativeElement, trendChart(b.labels,
      { name: 'Units', data: units }, { name: 'Sales Value', data: value.map(v => Math.round(v)), money: true },
      { height: 320, onClick: () => this.go(this.links.vehicleSale) }));

    // By model - distributed colours
    const models = groupSum(this.rows, r => r.modelName ?? r.oemModelName, () => 1, 7);
    this.draw(this.modelEl?.nativeElement, barChart(models.map(m => m.label), [{ name: 'Units', data: models.map(m => m.value) }],
      { distributed: true, unit: 'units', height: 300, onClick: () => this.go(this.links.modelSale) }));

    // By state (region)
    const states = groupSum(this.rows, r => r.dealerState ?? r.customerState, () => 1, 8);
    this.draw(this.stateEl?.nativeElement, hBarChart(states.map(s => s.label), states.map(s => s.value),
      { name: 'Units', unit: 'units', height: 300, color: COLORS.indigo, onClick: () => this.go(this.links.totalSale) }));

    // Finance mix - cash vs each financier (top 4)
    const fin = groupSum(this.rows, r => this.financed(r) ? (r.financier ?? r.financeBy ?? '').toString() : 'Cash', () => 1, 4);
    this.draw(this.financeEl?.nativeElement, donutChart(fin.map(f => f.label), fin.map(f => f.value),
      { centreLabel: 'Units', height: 290, onClick: () => this.go(this.links.vehicleSale) }));
  }
}
