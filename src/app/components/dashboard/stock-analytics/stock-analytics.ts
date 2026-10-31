// src\app\components\dashboard\stock-analytics\stock-analytics.ts
// Stock Analytics - unsold vehicle stock from GET Report/model-wise-stock-count (dealer x model pivot),
// for vehicles inwarded (invoice date) in the selected range. Default 01.01.2020 - today = all stock.
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { ModelWiseStockPivotResponse, ModelWiseStockPivotRow } from '../../../ViewModels/models/Model wise stock count.model';
import { DashboardBase, barChart, hBarChart, donutChart, COLORS, pct } from '../dashboard-kit';
import { DashboardFilter } from '../dashboard-filter';

@Component({
  selector: 'app-stock-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardFilter],
  templateUrl: './stock-analytics.html',
  styleUrl: './stock-analytics.scss'   // ADDED
})
export class StockAnalytics extends DashboardBase implements OnInit, AfterViewInit {
  @ViewChild('byModel') modelEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byDealer') dealerEl?: ElementRef<HTMLDivElement>;
  @ViewChild('share') shareEl?: ElementRef<HTMLDivElement>;

  loading = false;
  failed = false;
  data: ModelWiseStockPivotResponse | null = null;
  search = '';
  hasData = false;
  lastUpdated: Date | null = null;
  private viewReady = false;

  constructor(private report: ReportService, zone: NgZone, router: Router) {
    super(zone, router);
  }

  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.viewReady = true; this.render(); }

  load(): void {
    this.loading = true;
    this.failed = false;
    this.report.getModelWiseStockCountReport({ fromDate: this.from, toDate: this.to } as any).subscribe({
      next: d => { this.data = d; this.loading = false; this.lastUpdated = new Date(); setTimeout(() => this.render()); },
      error: () => { this.data = null; this.failed = true; this.loading = false; setTimeout(() => this.render()); }
    });
  }

  // ---------------------------------------------------------------- KPIs
  get totalStock(): number { return this.data?.grandTotal ?? 0; }
  get modelCount(): number { return Object.values(this.data?.columnTotals ?? {}).filter(v => Number(v) > 0).length; }
  private get stockedDealers(): ModelWiseStockPivotRow[] { return (this.data?.rows ?? []).filter(r => (r.total ?? 0) > 0); }
  get dealerCount(): number { return this.stockedDealers.length; }
  get avgPerDealer(): number | null { return this.dealerCount ? Math.round(this.totalStock / this.dealerCount) : null; }
  get topModel(): { label: string; value: number } | null {
    const e = Object.entries(this.data?.columnTotals ?? {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return e ? { label: e[0], value: Number(e[1]) } : null;
  }
  get topModelPct(): number { return pct(this.topModel?.value ?? 0, this.totalStock); }

  // ---------------------------------------------------------------- table
  get dealerRows(): ModelWiseStockPivotRow[] {
    const q = this.search.trim().toLowerCase();
    return this.stockedDealers
      .filter(r => !q || `${r.dealerName} ${r.dealerCode}`.toLowerCase().includes(q))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 12);
  }
  topModelsOf(r: ModelWiseStockPivotRow): string {
    return Object.entries(r.modelCounts ?? {})
      .filter(([, v]) => Number(v) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([m, v]) => `${m} (${v})`)
      .join(', ') || '—';
  }
  sharePct(r: ModelWiseStockPivotRow): number { return pct(r.total ?? 0, this.totalStock); }
  open(): void { this.go(this.links.modelStock); }

  // ---------------------------------------------------------------- charts
  private render(): void {
    if (!this.viewReady) return;
    this.resetCharts();
    const models = Object.entries(this.data?.columnTotals ?? {})
      .map(([label, v]) => ({ label, value: Number(v) || 0 }))
      .filter(m => m.value > 0)
      .sort((a, b) => b.value - a.value);
    this.hasData = models.length > 0;
    if (!this.hasData) return;

    const top = models.slice(0, 8);
    this.draw(this.modelEl?.nativeElement, barChart(top.map(m => m.label), [{ name: 'In Stock', data: top.map(m => m.value) }],
      { distributed: true, unit: 'units', height: 320, onClick: () => this.open() }));

    const dealers = this.stockedDealers.sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 8);
    this.draw(this.dealerEl?.nativeElement, hBarChart(dealers.map(d => d.dealerName || d.dealerCode), dealers.map(d => d.total ?? 0),
      { name: 'In Stock', unit: 'units', height: 320, color: COLORS.indigo, onClick: () => this.open() }));

    const share = models.slice(0, 5);
    const others = models.slice(5).reduce((s, m) => s + m.value, 0);
    if (others > 0) share.push({ label: 'Others', value: others });
    this.draw(this.shareEl?.nativeElement, donutChart(share.map(s => s.label), share.map(s => s.value),
      { centreLabel: 'Units', height: 300, onClick: () => this.open() }));
  }
}