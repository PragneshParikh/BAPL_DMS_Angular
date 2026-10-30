// src\app\components\dashboard\dashboard-kit.ts
// Shared helpers for all DMS dashboards (Main, Sales, Stock, Dealer, Workshop):
// period ranges (Indian FY), Indian number formats, AutoDash palette and
// ApexCharts option builders. Every chart element is clickable.
import { Directive, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import ApexCharts from 'apexcharts';

export type PeriodKey = 'mtd' | 'qtd' | 'fytd' | 'lfy';

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'mtd', label: 'This Month' },
  { key: 'qtd', label: 'This Quarter' },
  { key: 'fytd', label: 'This FY' },
  { key: 'lfy', label: 'Last FY' }
];

/** Existing report routes each dashboard drills into. */
export const REPORT_LINKS = {
  totalSale: '/total-sale-dealer-wise',
  vehicleSale: '/vehicle-sale-report',
  modelSale: '/model-wise-sale-report',
  modelStock: '/model-wise-current-stock',
  variantStock: '/model-wise-variant-stock',
  jobCards: '/job-card-report'
} as const;

export const COLORS = {
  blue: '#5b8def', green: '#34d399', amber: '#fbbf24', purple: '#a78bfa', pink: '#f472b6',
  teal: '#2dd4bf', orange: '#fb923c', red: '#f87171', sky: '#60a5fa', indigo: '#6366f1',
  axis: '#64748b', grid: '#eef2f7', font: 'Inter, sans-serif'
};
export const PALETTE = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.amber, COLORS.red, COLORS.teal,
                        COLORS.pink, COLORS.orange, COLORS.sky, COLORS.indigo];

// ------------------------------------------------------------------ dates
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Indian FY periods: FY = 1 Apr - 31 Mar, quarters Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar. */
export function periodRange(key: PeriodKey, today = new Date()): { from: string; to: string } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const fyStartYear = m >= 3 ? y : y - 1;
  let from: Date;
  let to: Date = today;
  switch (key) {
    case 'mtd': from = new Date(y, m, 1); break;
    case 'qtd': from = m < 3 ? new Date(y, 0, 1) : new Date(y, m - ((m - 3) % 3), 1); break;
    case 'fytd': from = new Date(fyStartYear, 3, 1); break;
    case 'lfy': from = new Date(fyStartYear - 1, 3, 1); to = new Date(fyStartYear, 2, 31); break;
  }
  return { from: isoDate(from), to: isoDate(to) };
}

export function fmtRange(from: string, to: string): string {
  const f = (s: string) => s.split('-').reverse().join('.');   // DD.MM.YYYY
  return `${f(from)} – ${f(to)}`;
}

/** Bucket key + label for trend charts: daily for ranges up to ~2 months, else monthly. */
export function buildBuckets(from: string, to: string): { keys: string[]; labels: string[]; monthly: boolean } {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const keys: string[] = [];
  const labels: string[] = [];
  if (days <= 62) {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      keys.push(isoDate(d));
      labels.push(`${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`);
    }
    return { keys, labels, monthly: false };
  }
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    labels.push(`${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
  }
  return { keys, labels, monthly: true };
}

/** Normalises API dates (ISO string / Date / 'dd-MM-yyyy') to 'yyyy-MM-dd'. */
export function toIsoDay(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : isoDate(v);
  const s = String(v);
  const dmy = /^(\d{2})[-/.](\d{2})[-/.](\d{4})/.exec(s);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : isoDate(d);
}

// ------------------------------------------------------------------ format
export function num(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v);
}

export function inr(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${num(v)}`;
}

export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Groups items and sums a value; returns sorted desc, optional top-N with "Others". */
export function groupSum<T>(items: T[], key: (t: T) => string | null | undefined, value: (t: T) => number = () => 1,
                            top = 0): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = (key(it) ?? '').toString().trim() || 'Not specified';
    map.set(k, (map.get(k) ?? 0) + (Number(value(it)) || 0));
  }
  let rows = Array.from(map, ([label, v]) => ({ label, value: v })).sort((a, b) => b.value - a.value);
  if (top > 0 && rows.length > top) {
    const others = rows.slice(top).reduce((s, r) => s + r.value, 0);
    rows = [...rows.slice(0, top), { label: 'Others', value: others }];
  }
  return rows;
}

// ------------------------------------------------------------------ charts
type ClickFn = (seriesIndex: number, dataPointIndex: number) => void;

function chartBase(type: string, height: number, onClick?: ClickFn): any {
  return {
    type, height, fontFamily: COLORS.font, parentHeightOffset: 0,
    toolbar: { show: false }, zoom: { enabled: false },
    animations: { enabled: true, speed: 400 },
    events: onClick ? {
      dataPointSelection: (_e: any, _c: any, cfg: any) => onClick(cfg.seriesIndex, cfg.dataPointIndex),
      markerClick: (_e: any, _c: any, cfg: any) => onClick(cfg.seriesIndex, cfg.dataPointIndex)
    } : {}
  };
}

const axisLabel = { style: { colors: COLORS.axis, fontSize: '12px' } };
const grid = { borderColor: COLORS.grid, strokeDashArray: 4, padding: { left: 8, right: 8 } };
const legend = { position: 'top', horizontalAlign: 'center', fontSize: '13px', markers: { size: 7, shape: 'circle' },
                 itemMargin: { horizontal: 12 } };

/** Vertical bars; `distributed` colours each bar (AutoDash "Sales by Vehicle Category"). */
export function barChart(labels: string[], series: { name: string; data: number[] }[], opts: {
  height?: number; colors?: string[]; distributed?: boolean; unit?: string; money?: boolean; onClick?: ClickFn; rotate?: boolean;
} = {}): any {
  const f = opts.money ? inr : num;
  return {
    chart: chartBase('bar', opts.height ?? 300, opts.onClick),
    series,
    colors: opts.colors ?? (opts.distributed ? PALETTE : [COLORS.blue, COLORS.green, COLORS.amber]),
    plotOptions: { bar: { columnWidth: labels.length > 6 ? '55%' : '38%', borderRadius: 6, borderRadiusApplication: 'end',
                          distributed: !!opts.distributed } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ['transparent'] },
    xaxis: { categories: labels, labels: { ...axisLabel, rotate: opts.rotate === false ? 0 : -30, trim: true, hideOverlappingLabels: false },
             axisBorder: { color: COLORS.grid }, axisTicks: { show: false } },
    yaxis: { labels: { ...axisLabel, formatter: (v: number) => f(v) }, min: 0, forceNiceScale: true },
    grid, legend: { ...legend, show: series.length > 1 && !opts.distributed },
    tooltip: { shared: series.length > 1, intersect: false, y: { formatter: (v: number) => opts.money ? inr(v) : `${num(v)}${opts.unit ? ' ' + opts.unit : ''}` } },
    states: { hover: { filter: { type: 'darken', value: 0.9 } } }
  };
}

/** Horizontal bars (AutoDash "Sales by Region"). */
export function hBarChart(labels: string[], data: number[], opts: {
  height?: number; color?: string; distributed?: boolean; name?: string; unit?: string; money?: boolean; onClick?: ClickFn;
} = {}): any {
  const f = opts.money ? inr : num;
  return {
    chart: chartBase('bar', opts.height ?? 300, opts.onClick),
    series: [{ name: opts.name ?? 'Value', data }],
    colors: opts.distributed ? PALETTE : [opts.color ?? COLORS.blue],
    plotOptions: { bar: { horizontal: true, distributed: !!opts.distributed, barHeight: '62%', borderRadius: 5, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    xaxis: { categories: labels, labels: { ...axisLabel, formatter: (v: string) => f(Number(v)) }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { ...axisLabel, maxWidth: 140 } },
    grid: { ...grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => opts.money ? inr(v) : `${num(v)}${opts.unit ? ' ' + opts.unit : ''}` } }
  };
}

/** Area/line trend with optional second axis (e.g. units + revenue). */
export function trendChart(labels: string[], primary: { name: string; data: number[] }, secondary?: { name: string; data: number[]; money?: boolean },
                           opts: { height?: number; onClick?: ClickFn } = {}): any {
  const series: any[] = [{ ...primary, type: 'column' }];
  if (secondary) series.push({ name: secondary.name, data: secondary.data, type: 'area' });
  return {
    chart: { ...chartBase('line', opts.height ?? 320, opts.onClick), stacked: false },
    series,
    colors: [COLORS.blue, COLORS.green],
    stroke: { width: [0, 3], curve: 'smooth' },
    fill: { type: ['solid', 'gradient'], gradient: { shadeIntensity: 1, opacityFrom: .35, opacityTo: .02, stops: [0, 90, 100] } },
    plotOptions: { bar: { columnWidth: labels.length > 20 ? '70%' : '45%', borderRadius: 4, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: { categories: labels, labels: { ...axisLabel, rotate: -30, hideOverlappingLabels: true }, axisBorder: { color: COLORS.grid }, axisTicks: { show: false },
             tickAmount: labels.length > 16 ? 12 : undefined },
    yaxis: secondary ? [
      { seriesName: primary.name, min: 0, forceNiceScale: true, labels: { ...axisLabel, formatter: (v: number) => num(v) }, title: { text: primary.name, style: { color: COLORS.axis, fontWeight: 500 } } },
      { seriesName: secondary.name, opposite: true, min: 0, forceNiceScale: true, labels: { ...axisLabel, formatter: (v: number) => secondary.money ? inr(v) : num(v) },
        title: { text: secondary.name, style: { color: COLORS.axis, fontWeight: 500 } } }
    ] : { min: 0, forceNiceScale: true, labels: { ...axisLabel, formatter: (v: number) => num(v) } },
    grid, legend,
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number, o: any) => (o?.seriesIndex === 1 && secondary?.money) ? inr(v) : num(v) } }
  };
}

/** Donut with centre total (AutoDash "Payment Methods"). */
export function donutChart(labels: string[], data: number[], opts: { height?: number; colors?: string[]; centreLabel?: string; money?: boolean; onClick?: ClickFn } = {}): any {
  const total = data.reduce((s, v) => s + v, 0);
  const f = opts.money ? inr : num;
  return {
    chart: chartBase('donut', opts.height ?? 280, opts.onClick),
    series: data, labels,
    colors: opts.colors ?? PALETTE,
    stroke: { width: 3, colors: ['#fff'] },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '13px', markers: { size: 7, shape: 'circle' }, itemMargin: { horizontal: 8, vertical: 3 } },
    plotOptions: { pie: { donut: { size: '70%', labels: {
      show: true,
      value: { fontSize: '20px', fontWeight: 700, color: '#0f172a', formatter: (v: string) => f(Number(v)) },
      total: { show: true, label: opts.centreLabel ?? 'Total', color: COLORS.axis, formatter: () => f(total) }
    } } } },
    tooltip: { y: { formatter: (v: number) => `${f(v)} (${pct(v, total)}%)` } }
  };
}

/** Single radial gauge, value in %. */
export function radialChart(value: number, label: string, opts: { height?: number; color?: string; onClick?: ClickFn } = {}): any {
  return {
    chart: chartBase('radialBar', opts.height ?? 250, opts.onClick),
    series: [value], labels: [label], colors: [opts.color ?? COLORS.green],
    plotOptions: { radialBar: { hollow: { size: '62%' }, track: { background: '#f1f5f9' },
      dataLabels: { name: { offsetY: 22, color: COLORS.axis, fontSize: '13px' },
                    value: { offsetY: -12, fontSize: '24px', fontWeight: 700, color: '#0f172a', formatter: (v: number) => `${Math.round(v)}%` } } } },
    stroke: { lineCap: 'round' }
  };
}

// ------------------------------------------------------------------ base class
/** Owns ApexCharts instances; renders outside Angular, navigates inside it. */
@Directive()
export abstract class DashboardBase implements OnDestroy {
  readonly periods = PERIODS;
  readonly links = REPORT_LINKS;
  readonly num = num;
  readonly inr = inr;
  private charts: ApexCharts[] = [];

  protected constructor(protected zone: NgZone, protected router: Router) {}

  protected go(url: string, queryParams?: Record<string, string>): void {
    this.zone.run(() => this.router.navigate([url], queryParams ? { queryParams } : {}));
  }

  protected resetCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  protected draw(el: HTMLElement | undefined, options: any, when = true): void {
    if (!el || !when) return;
    this.zone.runOutsideAngular(() => {
      const chart = new ApexCharts(el, options);
      chart.render();
      this.charts.push(chart);
    });
  }

  ngOnDestroy(): void {
    this.resetCharts();
  }
}
