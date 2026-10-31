// src\app\components\dashboard\workshop-analytics\workshop-analytics.ts
// Workshop Analytics - job cards from GET Report/job-card/dealer-wise + Report/job-card summary stats.
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerWiseJobReportSummary, JobReportSummaryStats, JobReportViewModel } from '../../../ViewModels/models/job-report.model';
import {
  DashboardBase, PeriodKey, periodRange, fmtRange, buildBuckets, toIsoDay, groupSum, pct,
  hBarChart, trendChart, donutChart, radialChart, COLORS
} from '../dashboard-kit';
import { DashboardFilter } from '../dashboard-filter';

@Component({
  selector: 'app-workshop-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardFilter],
  templateUrl: './workshop-analytics.html',
  styleUrl: './workshop-analytics.scss'
})
export class WorkshopAnalytics extends DashboardBase implements OnInit, AfterViewInit {
  @ViewChild('trend') trendEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byService') serviceEl?: ElementRef<HTMLDivElement>;
  @ViewChild('status') statusEl?: ElementRef<HTMLDivElement>;
  @ViewChild('closure') closureEl?: ElementRef<HTMLDivElement>;
  @ViewChild('byMechanic') mechanicEl?: ElementRef<HTMLDivElement>;

  loading = false;
  failed = false;
  dealers: DealerWiseJobReportSummary[] = [];
  jobs: JobReportViewModel[] = [];
  stats: JobReportSummaryStats | null = null;
  search = '';
  hasData = false;
  private viewReady = false;

  constructor(private report: ReportService, private storage: StorageService, zone: NgZone, router: Router) {
    super(zone, router);
  }

  ngOnInit(): void { this.load(); }
  ngAfterViewInit(): void { this.viewReady = true; this.render(); }

  load(): void {
    this.loading = true;
    this.failed = false;
    const dealerCode = this.storage.getDealerCode() || '';
    const from = new Date(this.from);
    const to = new Date(this.to + 'T23:59:59');
    forkJoin({
      dealers: this.report.getDealerWiseJobReport(dealerCode || undefined, from, to).pipe(catchError(() => { this.failed = true; return of([] as DealerWiseJobReportSummary[]); })),
      stats: this.report.getJobReportSummaryStats(dealerCode, from, to).pipe(catchError(() => of(null as JobReportSummaryStats | null)))
    }).subscribe(res => {
      this.dealers = res.dealers ?? [];
      this.jobs = this.dealers.flatMap(d => d.jobDetails ?? []);
      this.stats = res.stats;
      this.loading = false;
      setTimeout(() => this.render());
    });
  }

  // ---------------------------------------------------------------- KPIs
  private isClosed(j: JobReportViewModel): boolean {
    const s = (j.jobStatus ?? '').toLowerCase();
    return !!j.closedDate || s.includes('close') || s.includes('complete') || s.includes('deliver');
  }
  get totalJobs(): number { return this.stats?.totalJobs ?? this.jobs.length; }
  get completed(): number { return this.stats?.completedJobs ?? this.jobs.filter(j => this.isClosed(j)).length; }
  get pending(): number { return this.stats?.pendingJobs ?? (this.jobs.length - this.jobs.filter(j => this.isClosed(j)).length); }
  get closurePct(): number { return pct(this.completed, this.totalJobs); }
  get revenue(): number | null { return this.stats?.totalRevenue ?? null; }
  get avgJobValue(): number | null { return this.stats?.averageJobValue ?? null; }
  get activeDealers(): number { return this.dealers.filter(d => (d.totalJobs ?? 0) > 0).length; }

  // ---------------------------------------------------------------- table
  get recentJobs(): JobReportViewModel[] {
    const q = this.search.trim().toLowerCase();
    return this.jobs
      .filter(j => !q || [j.jobNo, j.regNo, j.dealerName, j.serviceType, j.jobType, j.mechanicName, j.jobStatus]
        .some(v => (v ?? '').toString().toLowerCase().includes(q)))
      .sort((a, b) => (toIsoDay(b.jobInDate) ?? '').localeCompare(toIsoDay(a.jobInDate) ?? ''))
      .slice(0, 12);
  }
  jobDate(j: JobReportViewModel): string {
    const d = toIsoDay(j.jobInDate);
    return d ? d.split('-').reverse().join('.') : '—';
  }
  statusClass(j: JobReportViewModel): string {
    return this.isClosed(j) ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
  }
  open(): void { this.go(this.links.jobCards); }

  // ---------------------------------------------------------------- charts
  private render(): void {
    if (!this.viewReady) return;
    this.resetCharts();
    this.hasData = this.jobs.length > 0 || this.totalJobs > 0;
    if (!this.hasData) return;
    const click = () => this.open();

    if (this.jobs.length) {
      const b = buildBuckets(this.from, this.to);
      const idx = new Map(b.keys.map((k, i) => [k, i]));
      const opened = new Array(b.keys.length).fill(0);
      const closed = new Array(b.keys.length).fill(0);
      for (const j of this.jobs) {
        const d = toIsoDay(j.jobInDate);
        if (!d) continue;
        const i = idx.get(b.monthly ? d.slice(0, 7) : d);
        if (i === undefined) continue;
        opened[i] += 1;
        if (this.isClosed(j)) closed[i] += 1;
      }
      this.draw(this.trendEl?.nativeElement, trendChart(b.labels,
        { name: 'Jobs Opened', data: opened }, { name: 'Jobs Closed', data: closed }, { height: 300, onClick: click }));

      const svc = groupSum(this.jobs, j => j.serviceType || j.jobType, () => 1, 6);
      this.draw(this.serviceEl?.nativeElement, donutChart(svc.map(s => s.label), svc.map(s => s.value),
        { centreLabel: 'Jobs', height: 280, onClick: click }));

      const st = groupSum(this.jobs, j => j.jobStatus || 'Unknown', () => 1, 6);
      this.draw(this.statusEl?.nativeElement, hBarChart(st.map(s => s.label), st.map(s => s.value),
        { name: 'Jobs', unit: 'jobs', height: 280, color: COLORS.amber, onClick: click }));

      const mech = groupSum(this.jobs.filter(j => (j.mechanicName ?? '').trim()), j => j.mechanicName, () => 1, 8);
      this.draw(this.mechanicEl?.nativeElement, hBarChart(mech.map(m => m.label), mech.map(m => m.value),
        { name: 'Jobs', unit: 'jobs', height: 300, color: COLORS.indigo, onClick: click }), mech.length > 0);
    }

    this.draw(this.closureEl?.nativeElement, radialChart(this.closurePct, 'Closed', { height: 280, color: COLORS.green, onClick: click }));
  }
}
