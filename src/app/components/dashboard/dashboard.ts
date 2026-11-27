// src\app\components\dashboard\dashboard.ts
// Landing page after login (route '').
// Every figure comes from existing Report APIs - nothing is hard-coded.
// Dealer users automatically see only their own data (enforced server-side).
// Every KPI card, chart and chart bar is clickable and opens the source report.
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import ApexCharts from 'apexcharts';
import { ReportService } from '../../core/services/report.service';
import { StorageService } from '../../core/services/storage';
import { TotalSaleReportDealerWiseResponse, TotalSaleReportDealerWiseRow } from '../../ViewModels/models/total-sale-reportModel';
import { ModelWiseSalePivotResponse } from '../../ViewModels/models/model-wise-sale-countModel';
import { ModelWiseStockPivotResponse } from '../../ViewModels/models/Model wise stock count.model';
import { JobReportSummaryStats } from '../../ViewModels/models/job-report.model';
import { ComparisonReportPagedResponse } from '../../ViewModels/models/Comaprision-reportModel';
import { DashboardFilter } from './dashboard-filter';
import { DateRange, defaultRange, fmtRange } from './dashboard-kit';

/** Report pages each dashboard element drills into (existing routes). */
export const DASHBOARD_LINKS = {
  totalSale: '/total-sale-dealer-wise',
  modelSale: '/model-wise-sale-report',
  modelStock: '/model-wise-current-stock',
  jobCards: '/job-card-report',
  proforma: '/comparison-report'
} as const;

const C = {
  // 26.11.2026 - DMS theme colours
  blue: '#405189', green: '#0ab39c', amber: '#f7b84b', purple: '#6559cc',
  pink: '#f672a7', teal: '#299cdb', orange: '#f1963b', sky: '#3577f1',
  axis: '#64748b', grid: '#eef2f7', font: 'Inter, sans-serif'
};
const PALETTE = [C.blue, C.green, C.amber, C.purple, C.pink, C.teal, C.orange, C.sky];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardFilter],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart') salesChartEl?: ElementRef<HTMLDivElement>;
  @ViewChild('stockChart') stockChartEl?: ElementRef<HTMLDivElement>;
  @ViewChild('paymentChart') paymentChartEl?: ElementRef<HTMLDivElement>;
  @ViewChild('jobChart') jobChartEl?: ElementRef<HTMLDivElement>;

  readonly links = DASHBOARD_LINKS;
  /** Selected range (yyyy-MM-dd) - default 01.01.2020 - today. */
  from = defaultRange().from;
  to = defaultRange().to;

  loading = false;
  lastUpdated: Date | null = null;

  sale: TotalSaleReportDealerWiseResponse | null = null;
  modelSale: ModelWiseSalePivotResponse | null = null;
  modelStock: ModelWiseStockPivotResponse | null = null;
  jobs: JobReportSummaryStats | null = null;
  /** 26.11.2026 current month (1st - today) sale, independent of the selected range */
  monthSale: TotalSaleReportDealerWiseResponse | null = null;
  /** 26.11.2026 Performa vs Sale Bill comparison (selected range) */
  proforma: ComparisonReportPagedResponse | null = null;
  failed = { sale: false, modelSale: false, stock: false, jobs: false, monthSale: false, proforma: false };

  topDealers: TotalSaleReportDealerWiseRow[] = [];
  hasSalesChart = false;
  hasStockChart = false;
  private salesModels: { m: string; s: number; k: number }[] = [];
  private stockRows: { m: string; v: number }[] = [];

  private charts: ApexCharts[] = [];
  private viewReady = false;

  constructor(
    private report: ReportService,
    private storage: StorageService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // ---------------------------------------------------------------- period
  onRange(r: DateRange): void {
    this.from = r.from;
    this.to = r.to;
    this.load();
  }

  get periodLabel(): string { return fmtRange(this.from, this.to); }

  // ---------------------------------------------------------------- data
  load(): void {
    this.loading = true;
    this.failed = { sale: false, modelSale: false, stock: false, jobs: false, monthSale: false, proforma: false };
    const range = { fromDate: this.from, toDate: this.to };
    const dealerCode = this.storage.getDealerCode() || '';
    const month = this.monthRange;

    // 26.11.2026 - the two new KPI cards load on their own, so a slow call never holds back the charts
    this.monthSale = null;
    this.proforma = null;
    this.report.getTotalSaleReportDealerWise({ fromDate: month.from, toDate: month.to })
      .pipe(catchError(() => { this.failed.monthSale = true; return of(null); }))
      .subscribe(r => this.monthSale = r);
    // only the totals are needed - one row keeps it light
    this.report.getComparisonReport({ fromDate: this.from, toDate: this.to, pageIndex: 1, pageSize: 1 })
      .pipe(catchError(() => { this.failed.proforma = true; return of(null); }))
      .subscribe(r => this.proforma = r);

    forkJoin({
      sale: this.report.getTotalSaleReportDealerWise(range)
        .pipe(catchError(() => { this.failed.sale = true; return of(null); })),
      modelSale: this.report.getModelWiseSaleCountReport(range)
        .pipe(catchError(() => { this.failed.modelSale = true; return of(null); })),
      modelStock: this.report.getModelWiseStockCountReport({})          // current stock
        .pipe(catchError(() => { this.failed.stock = true; return of(null); })),
      jobs: this.report.getJobReportSummaryStats(dealerCode, new Date(this.from), new Date(this.to + 'T23:59:59'))
        .pipe(catchError(() => { this.failed.jobs = true; return of(null); }))
    }).subscribe(res => {
      this.sale = res.sale;
      this.modelSale = res.modelSale;
      this.modelStock = res.modelStock;
      this.jobs = res.jobs;
      this.topDealers = [...(this.sale?.rows ?? [])]
        .sort((a, b) => (b.totalUnitsSold ?? 0) - (a.totalUnitsSold ?? 0))
        .slice(0, 8);
      this.buildChartData();
      this.loading = false;
      this.lastUpdated = new Date();
      // wait one tick so @if blocks render their chart containers
      setTimeout(() => this.renderCharts());
    });
  }

  /** Runs inside Angular's zone so the empty-state flags update the view. */
  private buildChartData(): void {
    const sold = this.modelSale?.columnTotals ?? {};
    const stock = this.modelStock?.columnTotals ?? {};
    this.salesModels = Array.from(new Set([...Object.keys(sold), ...Object.keys(stock)]))
      .map(m => ({ m, s: Number(sold[m]) || 0, k: Number(stock[m]) || 0 }))
      .filter(x => x.s + x.k > 0)
      .sort((a, b) => b.s - a.s || b.k - a.k)
      .slice(0, 10);
    this.stockRows = Object.entries(stock)
      .map(([m, v]) => ({ m, v: Number(v) || 0 }))
      .filter(x => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);
    this.hasSalesChart = this.salesModels.length > 0;
    this.hasStockChart = this.stockRows.length > 0;
  }

  // ---------------------------------------------------------------- KPIs
  get unitsSold(): number | null { return this.sale ? this.sale.grandTotal?.totalUnitsSold ?? 0 : null; }
  get salesValue(): number | null { return this.sale ? this.sale.grandTotal?.totalFinalAmount ?? 0 : null; }
  get cashCount(): number { return this.sale?.grandTotal?.cashCount ?? 0; }
  get creditCount(): number { return this.sale?.grandTotal?.creditCount ?? 0; }
  get stockUnits(): number | null { return this.modelStock ? this.modelStock.grandTotal ?? 0 : null; }
  get modelCount(): number { return this.modelStock?.modelNames?.length ?? 0; }
  get dealerCount(): number { return this.sale?.rows?.length ?? 0; }

  // 26.11.2026 new KPI cards
  /** 1st of this month - today (local dates) */
  get monthRange(): DateRange {
    const t = new Date();
    const f = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { from: f(new Date(t.getFullYear(), t.getMonth(), 1)), to: f(t) };
  }
  get monthLabel(): string {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  get monthUnits(): number | null { return this.monthSale ? this.monthSale.grandTotal?.totalUnitsSold ?? 0 : null; }
  get monthValue(): number | null { return this.monthSale ? this.monthSale.grandTotal?.totalFinalAmount ?? 0 : null; }
  get proformaCount(): number | null { return this.proforma ? this.proforma.totalWithPerforma ?? 0 : null; }
  get proformaBilled(): number { return this.proforma?.totalSaleBillCreated ?? 0; }
  get proformaPending(): number { return Math.max(0, (this.proformaCount ?? 0) - this.proformaBilled); }
  get proformaParams(): Record<string, string> { return { fromDate: this.from, toDate: this.to, performa: 'yes' }; }
  get monthParams(): Record<string, string> { return { fromDate: this.monthRange.from, toDate: this.monthRange.to }; }
  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
  get today(): Date { return new Date(); }
  get jobCompletionPct(): number {
    const t = this.jobs?.totalJobs ?? 0;
    return t > 0 ? Math.round(((this.jobs?.completedJobs ?? 0) / t) * 100) : 0;
  }
  get avgTicket(): number | null {
    const u = this.unitsSold ?? 0;
    return u > 0 && this.salesValue !== null ? this.salesValue / u : null;
  }

  // ---------------------------------------------------------------- charts
  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private go(url: string): void {
    this.zone.run(() => this.router.navigateByUrl(url));
  }

  private base(type: 'bar' | 'donut' | 'radialBar', height: number, onClick: (series: number, index: number) => void): any {
    return {
      type, height,
      fontFamily: C.font,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      events: {
        dataPointSelection: (_e: any, _c: any, cfg: any) => onClick(cfg.seriesIndex, cfg.dataPointIndex),
        legendClick: () => false
      },
      parentHeightOffset: 0
    };
  }

  private renderCharts(): void {
    if (!this.viewReady) return;
    this.destroyCharts();
    this.zone.runOutsideAngular(() => {
      this.renderSalesChart();
      this.renderStockChart();
      this.renderPaymentChart();
      this.renderJobChart();
    });
  }

  /** Grouped bars: units sold (period) vs current stock, per model. */
  private renderSalesChart(): void {
    const models = this.salesModels;
    if (!this.hasSalesChart || !this.salesChartEl) return;

    const chart = new ApexCharts(this.salesChartEl.nativeElement, {
      chart: this.base('bar', 340, s => this.go(s === 0 ? this.links.modelSale : this.links.modelStock)),
      series: [
        { name: 'Units Sold', data: models.map(x => x.s) },
        { name: 'In Stock', data: models.map(x => x.k) }
      ],
      colors: [C.blue, C.green],
      plotOptions: { bar: { columnWidth: models.length > 5 ? '45%' : '30%', borderRadius: 5, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 3, colors: ['transparent'] },
      xaxis: {
        categories: models.map(x => x.m),
        labels: { style: { colors: C.axis, fontSize: '12px' }, trim: true, hideOverlappingLabels: false },
        axisBorder: { color: C.grid }, axisTicks: { show: false }
      },
      yaxis: { labels: { style: { colors: C.axis }, formatter: (v: number) => this.num(v) }, forceNiceScale: true, min: 0 },
      grid: { borderColor: C.grid, strokeDashArray: 4, padding: { left: 8, right: 8 } },
      legend: { position: 'top', horizontalAlign: 'center', fontSize: '13px', markers: { size: 7, shape: 'circle' }, itemMargin: { horizontal: 12 } },
      tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => `${this.num(v)} units` } },
      states: { hover: { filter: { type: 'darken', value: 0.9 } } }
    });
    chart.render();
    this.charts.push(chart);
  }

  /** Horizontal coloured bars - current stock by model (Category Performance style). */
  private renderStockChart(): void {
    const rows = this.stockRows;
    if (!this.hasStockChart || !this.stockChartEl) return;

    const chart = new ApexCharts(this.stockChartEl.nativeElement, {
      chart: this.base('bar', 340, () => this.go(this.links.modelStock)),
      series: [{ name: 'In Stock', data: rows.map(x => x.v) }],
      colors: PALETTE,
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '52%', borderRadius: 5, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: true, textAnchor: 'start', offsetX: 6, style: { fontSize: '12px', fontWeight: 600, colors: ['#334155'] },
                    formatter: (v: number) => this.num(v) },
      xaxis: { categories: rows.map(x => x.m), labels: { style: { colors: C.axis }, formatter: (v: string) => this.num(Number(v)) },
               axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: C.axis, fontSize: '12px' }, maxWidth: 130 } },
      grid: { borderColor: C.grid, strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      legend: { show: false },
      tooltip: { y: { formatter: (v: number) => `${this.num(v)} units` } }
    });
    chart.render();
    this.charts.push(chart);
  }

  /** Donut - cash vs credit units. */
  private renderPaymentChart(): void {
    const total = this.cashCount + this.creditCount;
    if (total <= 0 || !this.paymentChartEl) return;

    const chart = new ApexCharts(this.paymentChartEl.nativeElement, {
      chart: this.base('donut', 260, () => this.go(this.links.totalSale)),
      series: [this.cashCount, this.creditCount],
      labels: ['Cash', 'Credit'],
      colors: [C.blue, C.amber],
      stroke: { width: 3, colors: ['#fff'] },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontSize: '13px', markers: { size: 7, shape: 'circle' } },
      plotOptions: { pie: { donut: { size: '72%', labels: {
        show: true,
        value: { fontSize: '22px', fontWeight: 700, color: '#0f172a', formatter: (v: string) => this.num(Number(v)) },
        total: { show: true, label: 'Units', color: C.axis, formatter: () => this.num(total) }
      } } } },
      tooltip: { y: { formatter: (v: number) => `${this.num(v)} units` } }
    });
    chart.render();
    this.charts.push(chart);
  }

  /** Radial - job card completion %. */
  private renderJobChart(): void {
    if (!this.jobs || !this.jobChartEl) return;

    const chart = new ApexCharts(this.jobChartEl.nativeElement, {
      chart: this.base('radialBar', 260, () => this.go(this.links.jobCards)),
      series: [this.jobCompletionPct],
      labels: ['Completed'],
      colors: [C.green],
      plotOptions: { radialBar: {
        hollow: { size: '62%' },
        track: { background: '#f1f5f9' },
        dataLabels: {
          name: { offsetY: 22, color: C.axis, fontSize: '13px' },
          value: { offsetY: -12, fontSize: '26px', fontWeight: 700, color: '#0f172a', formatter: (v: number) => `${Math.round(v)}%` }
        }
      } },
      stroke: { lineCap: 'round' }
    });
    chart.render();
    this.charts.push(chart);
  }

  // ---------------------------------------------------------------- format
  num(v: number | null | undefined): string {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v);
  }

  inr(v: number | null | undefined): string {
    if (v === null || v === undefined || isNaN(v)) return '—';
    const abs = Math.abs(v);
    if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${this.num(v)}`;
  }

  get anyFailed(): boolean {
    return Object.values(this.failed).some(Boolean);
  }

  openDealer(d: TotalSaleReportDealerWiseRow): void {
    this.router.navigate([this.links.totalSale], { queryParams: { dealerCode: d.dealerCode } });
  }
}
