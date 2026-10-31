// src\app\components\dashboard\dashboard-filter.ts
// Date range bar used by every dashboard: Financial Year dropdown (FY 2020-21 ... current FY)
// + From / To dates. Default = 01.01.2020 - today. Picking a FY fills the dates; editing a date
// selects the matching FY, or "Custom range".
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRange, FyOption, defaultRange, fmtRange, fyOptions, isoDate } from './dashboard-kit';

@Component({
  selector: 'app-db-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dbf">
      <div class="dbf-field dbf-fy">
        <label for="dbf-fy">Financial Year</label>
        <select id="dbf-fy" class="form-select" [ngModel]="fy" (ngModelChange)="pickFy($event)" [disabled]="loading">
          <option value="all">All years (from 01.01.2020)</option>
          @for (f of fys; track f.key) { <option [value]="f.key">{{ f.label }}</option> }
          <option value="custom" disabled>Custom range</option>
        </select>
      </div>
      <div class="dbf-field">
        <label for="dbf-from">From</label>
        <input id="dbf-from" type="date" class="form-control" [ngModel]="from" (change)="pickDate('from', $any($event.target).value)"
               [max]="to || today" [disabled]="loading">
      </div>
      <div class="dbf-field">
        <label for="dbf-to">To</label>
        <input id="dbf-to" type="date" class="form-control" [ngModel]="to" (change)="pickDate('to', $any($event.target).value)"
               [min]="from" [max]="today" [disabled]="loading">
      </div>
      <div class="dbf-range" [title]="label"><i class="ri-calendar-line"></i><span>{{ label }}</span></div>
    </div>
  `,
  styles: [`
    :host { display: block; margin: .75rem 0 1.5rem; }
    .dbf {
      display: flex; flex-wrap: wrap; align-items: flex-end; gap: .75rem 1rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: .85rem 1rem;
      box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
    }
    .dbf-field { display: flex; flex-direction: column; gap: .3rem; flex: 0 1 170px; min-width: 150px; }
    .dbf-fy { flex-basis: 230px; }
    .dbf-field label { font-size: .75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .03em; margin: 0; }
    .dbf-field .form-select, .dbf-field .form-control { height: 38px; font-size: .875rem; border-radius: 8px; }
    .dbf-range {
      margin-left: auto; display: inline-flex; align-items: center; gap: .4rem; min-width: 0; max-width: 100%;
      height: 38px; padding: 0 .85rem; border-radius: 8px; background: #eef2ff; color: #4f46e5;
      font-size: .8125rem; font-weight: 600; white-space: nowrap;
    }
    .dbf-range span { overflow: hidden; text-overflow: ellipsis; }
    :host-context([data-bs-theme="dark"]) .dbf { background: #111827; border-color: #1f2937; }
    :host-context([data-bs-theme="dark"]) .dbf-range { background: rgba(99, 102, 241, .15); color: #a5b4fc; }
    @media (max-width: 767.98px) {
      .dbf-field, .dbf-fy { flex: 1 1 calc(50% - .5rem); min-width: 0; }
      .dbf-range { margin-left: 0; flex: 1 1 100%; justify-content: center; }
    }
  `]
})
export class DashboardFilter implements OnChanges {
  @Input() from = defaultRange().from;
  @Input() to = defaultRange().to;
  @Input() loading = false;
  @Output() rangeChange = new EventEmitter<DateRange>();

  readonly fys: FyOption[] = fyOptions();
  readonly today = isoDate(new Date());
  fy = 'all';

  get label(): string { return this.from && this.to ? fmtRange(this.from, this.to) : ''; }

  ngOnChanges(): void { this.fy = this.matchFy(this.from, this.to); }

  pickFy(key: string): void {
    this.fy = key;
    const r = key === 'all' ? defaultRange() : this.fys.find(f => f.key === key);
    if (r) this.emit(r.from, r.to);
  }

  pickDate(which: 'from' | 'to', value: string): void {
    if (!value) return;
    let from = which === 'from' ? value : this.from;
    let to = which === 'to' ? value : this.to;
    if (to > this.today) to = this.today;
    if (from > to) { if (which === 'from') to = from; else from = to; }
    this.emit(from, to);
  }

  private emit(from: string, to: string): void {
    this.from = from;
    this.to = to;
    this.fy = this.matchFy(from, to);
    this.rangeChange.emit({ from, to });
  }

  private matchFy(from: string, to: string): string {
    const d = defaultRange();
    if (from === d.from && to === d.to) return 'all';
    return this.fys.find(f => f.from === from && f.to === to)?.key ?? 'custom';
  }
}
