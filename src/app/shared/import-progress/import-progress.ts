// src\app\shared\import-progress\import-progress.ts
// Status panel shown while an import / validation is running (step, rows read, saved count, batch n of m).
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportProgressInfo } from './import-progress.service';

@Component({
  selector: 'app-import-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (progress; as p) {
      <div class="ip-box" [class.done]="p.finished && p.success" [class.bad]="p.finished && !p.success">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div class="fw-medium">
            @if (!p.finished) { <i class="ri-loader-4-line db-spin me-1"></i> }
            @else if (p.success) { <i class="ri-checkbox-circle-line text-success me-1"></i> }
            @else { <i class="ri-error-warning-line text-danger me-1"></i> }
            {{ p.dryRun ? 'Validation' : 'Import' }} · Step {{ p.step }} of {{ p.steps }} – {{ p.phase }}
          </div>
          <small class="text-muted">{{ elapsed(p.elapsedSeconds) }}</small>
        </div>
        <div class="ip-bar mb-2"><div class="fill" [style.width.%]="percent(p)"></div></div>
        <div class="ip-facts">
          @if (p.totalRows) { <span>Rows read <b>{{ num(p.rowsRead) }} / {{ num(p.totalRows) }}</b></span> }
          @if (p.total) { <span>{{ cap(p.unit) }} <b>{{ num(p.done) }} / {{ num(p.total) }}</b></span> }
          @if (p.batches) { <span>Batch <b>{{ num(p.batchNo) }} / {{ num(p.batches) }}</b></span> }
          @if (!p.dryRun) {
            <span class="ok">Inserted <b>{{ num(p.inserted) }}</b></span>
            <span class="ok">Updated <b>{{ num(p.updated) }}</b></span>
            @if (p.failed) { <span class="bad">Failed rows <b>{{ num(p.failed) }}</b></span> }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .ip-box { padding: .85rem 1rem; margin-bottom: 1rem; border: 1px solid #c7d2fe; border-radius: .8rem; background: #f8faff; }
    .ip-box.done { border-color: #bbf7d0; background: #ecfdf5; }
    .ip-box.bad { border-color: #fecaca; background: #fef2f2; }
    .ip-bar { height: .55rem; border-radius: 1rem; background: #e0e7ff; overflow: hidden; }
    .ip-bar .fill { height: 100%; background: #6366f1; border-radius: 1rem; transition: width .4s ease; }
    .ip-box.done .ip-bar .fill { background: #10b981; }
    .ip-box.bad .ip-bar .fill { background: #ef4444; }
    .ip-facts { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; font-size: .85rem; color: #64748b; }
    .ip-facts b { color: #0f172a; }
    .ip-facts .ok b { color: #047857; }
    .ip-facts .bad b { color: #b91c1c; }
  `]
})
export class ImportProgressPanel {
  @Input() progress: ImportProgressInfo | null | undefined;

  /** overall %: completed steps + the share done inside the current step */
  percent(p: ImportProgressInfo): number {
    if (p.finished) return 100;
    if (!p.steps) return 0;
    const inStep = p.total ? p.done / p.total : p.totalRows && p.step === 1 ? p.rowsRead / p.totalRows : 0;
    return Math.min(99, Math.round(((Math.max(p.step, 1) - 1) + inStep) * 100 / p.steps));
  }
  num(v: number | null | undefined): string { return v == null ? '0' : new Intl.NumberFormat('en-IN').format(v); }
  cap(s: string): string { return s ? s[0].toUpperCase() + s.slice(1) : 'Done'; }
  elapsed(s: number): string {
    const t = Math.max(0, Math.round(s ?? 0));
    return t >= 60 ? `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, '0')}s` : `${t}s`;
  }
}
