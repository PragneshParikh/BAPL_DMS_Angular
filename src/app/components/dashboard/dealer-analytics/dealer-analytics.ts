// src\app\components\dashboard\dealer-analytics\dealer-analytics.ts
// Dealer Analytics - from GET Report/total-sale-dealer-wise (one row per dealer, full rollup).
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { TotalSaleReportDealerWiseRow } from '../../../ViewModels/models/total-sale-reportModel';
import { DashboardBase, PeriodKey, periodRange, fmtRange, groupSum, pct, barChart, hBarChart, donutChart, COLORS } from '../dashboard-kit';
import { DashboardFilter } from '../dashboard-filter';

type SortKey = 'units' | 'value';

@Component({
  selector: 'app-dealer-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardFilter],
  templateUrl: './dealer-analytics.html',
  styleUrl: './dealer-analytics.scss'
})
export class DealerAnalytics extends DashboardBase implements OnInit, AfterViewInit {
  @ViewChild('topDealers') topEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byState') stateEl?: ElementRef<HTMLDivElement>;
  @ViewChild('payment') paymentEl?: ElementRef<HTMLDivElement>;

  loading = false;
  failed = false;
  rows: TotalSaleReportDealerWiseRow[] = [];
  grand: TotalSaleReportDealerWiseRow | null = null;
  search = '';
  sortBy: SortKey = 'units';
  hasData = false;
  private viewReady = false;

  constructor(private report: ReportService, zone: NgZone, router: Router) {
    super(zone, router);
  }

  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.viewReady = true; this.render(); }

  load(): void {
    this.loading = true;
    this.failed = false;
    this.report.getTotalSaleReportDealerWise({ fromDate: this.from, toDate: this.to }).subscribe({
      next: res => { this.rows = res?.rows ?? []; this.grand = res?.grandTotal ?? null; this.loading = false; setTimeout(() => this.render()); },
      error: () => { this.rows = []; this.grand = null; this.failed = true; this.loading = false; setTimeout(() => this.render()); }
    });
  }

  // ---------------------------------------------------------------- KPIs
  get activeDealers(): number { return this.rows.filter(r => (r.totalUnitsSold ?? 0) > 0).length; }
  get units(): number { return this.grand?.totalUnitsSold ?? this.rows.reduce((s, r) => s + (r.totalUnitsSold ?? 0), 0); }
  get value(): number { return this.grand?.totalFinalAmount ?? this.rows.reduce((s, r) => s + (r.totalFinalAmount ?? 0), 0); }
  get avgUnits(): number | null { return this.activeDealers ? Math.round(this.units / this.activeDealers) : null; }
  get cash(): number { return this.grand?.cashCount ?? 0; }
  get credit(): number { return this.grand?.creditCount ?? 0; }
  get top3SharePct(): number {
    const top = [...this.rows].sort((a, b) => (b.totalUnitsSold ?? 0) - (a.totalUnitsSold ?? 0)).slice(0, 3)
      .reduce((s, r) => s + (r.totalUnitsSold ?? 0), 0);
    return pct(top, this.units);
  }

  // ---------------------------------------------------------------- table
  get tableRows(): TotalSaleReportDealerWiseRow[] {
    const q = this.search.trim().toLowerCase();
    return this.rows
      .filter(r => !q || [r.dealerName, r.dealerCode, r.dealerCity, r.dealerState].some(v => (v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => this.sortBy === 'units'
        ? (b.totalUnitsSold ?? 0) - (a.totalUnitsSold ?? 0)
        : (b.totalFinalAmount ?? 0) - (a.totalFinalAmount ?? 0))
      .slice(0, 15);
  }
  share(r: TotalSaleReportDealerWiseRow): number { return pct(r.totalUnitsSold ?? 0, this.units); }
  open(r?: TotalSaleReportDealerWiseRow): void {
    this.go(this.links.totalSale, r ? { dealerCode: r.dealerCode } : undefined);
  }

  // ---------------------------------------------------------------- charts
  private render(): void {
    if (!this.viewReady) return;
    this.resetCharts();
    const active = this.rows.filter(r => (r.totalUnitsSold ?? 0) > 0);
    this.hasData = active.length > 0;
    if (!this.hasData) return;

    const top = [...active].sort((a, b) => (b.totalUnitsSold ?? 0) - (a.totalUnitsSold ?? 0)).slice(0, 10);
    this.draw(this.topEl?.nativeElement, barChart(top.map(r => r.dealerName || r.dealerCode),
      [{ name: 'Units Sold', data: top.map(r => r.totalUnitsSold ?? 0) }],
      { distributed: true, unit: 'units', height: 330, onClick: (_s, i) => this.open(top[i]) }));

    const states = groupSum(active, r => r.dealerState, r => r.totalUnitsSold ?? 0, 8);
    this.draw(this.stateEl?.nativeElement, hBarChart(states.map(s => s.label), states.map(s => s.value),
      { name: 'Units Sold', unit: 'units', height: 330, color: COLORS.indigo, onClick: () => this.open() }));

    if (this.cash + this.credit > 0) {
      this.draw(this.paymentEl?.nativeElement, donutChart(['Cash', 'Credit'], [this.cash, this.credit],
        { colors: [COLORS.blue, COLORS.amber], centreLabel: 'Units', height: 290, onClick: () => this.open() }));
    }
  }
}