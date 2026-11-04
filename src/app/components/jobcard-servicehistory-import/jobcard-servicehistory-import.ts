// src\app\components\jobcard-servicehistory-import\jobcard-servicehistory-import.ts
// Import "Jobcard servicehistory.xlsx" (DMS_ServiceHistory export, 63 columns, lakhs of rows) into
// BAPLDMSvad.dbo.JobCardServiceHistory.  Flow: Upload -> Map columns -> Validate (dry run) -> Import.
// Same UI as Vehicle Sale Import; validate / import run as background jobs on the API (batched) and this
// page polls their progress. Existing rows (same UniqueKey) are never overwritten. Admin / SuperAdmin only.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  JcshField, JcshIssue, JcshJob, JcshRunOptions, JcshUpload, JobcardServicehistoryImportService
} from '../../core/services/jobcard-servicehistory-import.service';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';

type FileState = 'Waiting' | 'Uploading' | 'Ready' | 'Validating' | 'Validated' | 'Importing' | 'Imported' | 'Failed';

interface QueueItem {
  file: File;
  state: FileState;
  upload?: JcshUpload;
  job?: JcshJob;
  error?: string;
}

const POLL_MS = 2000;

@Component({
  selector: 'app-jobcard-servicehistory-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './jobcard-servicehistory-import.html',
  styleUrl: './jobcard-servicehistory-import.scss'
})
export class JobcardServicehistoryImport implements OnInit, OnDestroy {
  isAdmin = false;
  dragOver = false;

  queue: QueueItem[] = [];
  active: QueueItem | null = null;

  fields: JcshField[] = [];
  mapping: { [key: string]: string } = {};
  batchSize = 5000;
  fromRow: number | null = null;
  toRow: number | null = null;

  issueFilter: '' | 'Error' | 'Skipped' | 'Warning' | 'Info' = '';
  successMessage: string | null = null;
  busy = false;
  private destroyed = false;

  constructor(
    private api: JobcardServicehistoryImportService,
    private storage: StorageService,
    private toaster: ToastService
  ) { }

  ngOnInit(): void {
    const role = (this.storage.getRole() || '').toLowerCase().trim();
    this.isAdmin = role === 'superadmin' || role === 'admin';
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    // free the API's temp copies of files that were never imported
    this.queue.filter(q => q.upload && !this.isRunning(q)).forEach(q => this.api.discard(q.upload!.uploadId).subscribe({ error: () => { } }));
  }

  // ------------------------------------------------------------------ files
  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver = false;
    this.addFiles(ev.dataTransfer?.files ?? null);
  }

  onPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  private addFiles(list: FileList | null): void {
    if (!list) return;
    const added: QueueItem[] = [];
    Array.from(list).forEach(f => {
      if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
        this.toast(`${f.name}: only .xlsx files are supported (Save As .xlsx in Excel).`, 'warning');
        return;
      }
      if (this.queue.some(q => q.file.name === f.name && q.file.size === f.size)) return;
      const item: QueueItem = { file: f, state: 'Waiting' };
      this.queue.push(item);
      added.push(item);
    });
    if (!this.active && added.length) this.select(added[0]);
  }

  remove(item: QueueItem, ev?: Event): void {
    ev?.stopPropagation();
    if (this.busy || this.isRunning(item)) return;
    if (item.upload) this.api.discard(item.upload.uploadId).subscribe({ error: () => { } });
    this.queue = this.queue.filter(q => q !== item);
    if (this.active === item) this.active = this.queue[0] ?? null;
  }

  select(item: QueueItem): void {
    this.active = item;
    this.issueFilter = '';
    if (!item.upload && item.state !== 'Uploading') this.uploadFile(item);
  }

  async uploadFile(item: QueueItem): Promise<void> {
    item.state = 'Uploading';
    item.error = undefined;
    this.busy = true;
    try {
      const u = await firstValueFrom(this.api.upload(item.file));
      item.upload = u;
      item.state = 'Ready';
      if (!this.fields.length) this.fields = u.fields;
      const next: { [k: string]: string } = {};
      for (const f of u.fields) {
        const mine = this.mapping[f.key];
        next[f.key] = mine && u.headers.includes(mine) ? mine : (u.suggestedMapping[f.key] ?? '');
      }
      this.mapping = next;
      if (u.missingColumns.length) this.toast(`${item.file.name}: ${u.missingColumns.length} expected column(s) not found - see Map Columns.`, 'warning');
    } catch (e: any) {
      item.state = 'Failed';
      item.error = this.err(e);
    } finally {
      this.busy = false;
    }
  }

  // ------------------------------------------------------------------ mapping helpers
  get groups(): { name: string; list: JcshField[] }[] {
    const names = Array.from(new Set(this.fields.map(f => f.group)));
    return names.map(n => ({ name: n, list: this.fields.filter(f => f.group === n) }));
  }
  get mappedCount(): number { return Object.values(this.mapping).filter(v => !!v).length; }
  get missingRequired(): JcshField[] { return this.fields.filter(f => f.required && !this.mapping[f.key]); }
  get unmappedHeaders(): string[] {
    const used = new Set(Object.values(this.mapping).filter(Boolean));
    return (this.active?.upload?.headers ?? []).filter(h => !used.has(h));
  }
  /** fields not mapped at all - their column would be stored as NULL */
  get unmappedFields(): JcshField[] { return this.fields.filter(f => !this.mapping[f.key]); }
  sample(field: JcshField): string {
    const h = this.mapping[field.key];
    if (!h || !this.active?.upload) return '';
    const v = this.active.upload.sampleRows.map(r => r[h]).find(x => x != null && x !== '');
    return v ?? '';
  }
  isUsedElsewhere(header: string, key: string): boolean {
    return Object.entries(this.mapping).some(([k, v]) => k !== key && v === header);
  }
  autoMap(): void {
    if (!this.active?.upload) return;
    this.mapping = { ...Object.fromEntries(this.fields.map(f => [f.key, ''])), ...this.active.upload.suggestedMapping };
  }
  clearMap(): void { this.mapping = Object.fromEntries(this.fields.map(f => [f.key, ''])); }

  // ------------------------------------------------------------------ run
  private options(dryRun: boolean): JcshRunOptions {
    return {
      dryRun,
      mapping: Object.fromEntries(Object.entries(this.mapping).filter(([, v]) => !!v)),
      batchSize: Math.min(Math.max(Number(this.batchSize) || 5000, 500), 20000),
      fromRow: this.fromRow || null,
      toRow: this.toRow || null
    };
  }

  get canValidate(): boolean {
    return !!this.active?.upload && !this.busy && !this.missingRequired.length;
  }

  async validate(item = this.active): Promise<void> {
    if (!item?.upload || !this.canValidate) return;
    await this.run(item, true);
  }

  get canImport(): boolean {
    const j = this.job;
    const u = this.active?.upload;
    return !!u && !this.busy && !!j && j.dryRun && j.state === 'Completed' && j.rowsReady > 0
      && u.destinationConfigured && u.destinationTableExists;
  }

  async importNow(item = this.active): Promise<void> {
    if (!item?.upload || !this.canImport) return;
    const v = item.job!;
    const ok = window.confirm(
      `${item.file.name}:\n` +
      `Rows ready to insert: ${this.num(v.rowsReady)}\n` +
      `Skipped - duplicate inside file: ${this.num(v.skippedDuplicateInFile)}\n` +
      `Skipped - already in database: ${this.num(v.skippedExisting)}\n` +
      `Rows with errors (not imported): ${this.num(v.rowsWithErrors)}\n\n` +
      `Rows are inserted into BAPLDMSvad.dbo.JobCardServiceHistory in batches of ${this.num(this.options(false).batchSize)}. ` +
      `Existing records are never overwritten. Job Cards are not touched. Continue?`);
    if (!ok) return;
    await this.run(item, false);
    if (item.state === 'Imported' && item.job) {
      const r = item.job;
      this.successMessage = `Imported successfully - ${item.file.name}: ${this.num(r.rowsInserted)} rows inserted, ` +
        `${this.num(r.skippedDuplicateInFile + r.skippedExisting)} skipped (duplicates), ${this.num(r.rowsWithErrors)} failed` +
        (r.batchesFailed ? `, ${r.batchesFailed} batch(es) failed - re-run Import to retry them (inserted rows are skipped).` : '.');
      window.alert(this.successMessage);
    }
  }

  async cancel(): Promise<void> {
    const j = this.active?.job;
    if (!j || (j.state !== 'Running' && j.state !== 'Queued')) return;
    if (!window.confirm(j.dryRun ? 'Stop the validation?' : 'Stop the import? Batches already committed stay in the table; re-running Import skips them.')) return;
    try { await firstValueFrom(this.api.cancel(j.jobId)); } catch (e: any) { this.toast(this.err(e), 'danger'); }
  }

  private async run(item: QueueItem, dryRun: boolean): Promise<void> {
    this.busy = true;
    item.state = dryRun ? 'Validating' : 'Importing';
    item.error = undefined;
    this.issueFilter = '';
    try {
      let job = await firstValueFrom(this.api.start(item.upload!.uploadId, this.options(dryRun)));
      item.job = job;
      while (!this.destroyed && (job.state === 'Queued' || job.state === 'Running')) {
        await new Promise(r => setTimeout(r, POLL_MS));
        job = await firstValueFrom(this.api.job(job.jobId));
        item.job = job;
      }
      if (job.state === 'Completed') {
        item.state = dryRun ? 'Validated' : 'Imported';
        if (!dryRun) this.toast(`${item.file.name}: ${this.num(job.rowsInserted)} rows inserted, ${this.num(job.skippedExisting + job.skippedDuplicateInFile)} skipped, ${this.num(job.rowsWithErrors)} failed.`, 'success');
      } else {
        item.state = 'Failed';
        item.error = job.message ?? `${dryRun ? 'Validation' : 'Import'} ${job.state.toLowerCase()}.`;
        this.toast(`${item.file.name}: ${item.error}`, job.state === 'Cancelled' ? 'warning' : 'danger');
      }
    } catch (e: any) {
      item.state = 'Failed';
      item.error = this.err(e);
      this.toast(`${item.file.name}: ${item.error}`, 'danger');
    } finally {
      this.busy = false;
    }
  }

  isRunning(q: QueueItem): boolean { return q.state === 'Validating' || q.state === 'Importing' || q.state === 'Uploading'; }

  // ------------------------------------------------------------------ result helpers
  get job(): JcshJob | undefined { return this.active?.job; }
  get progress(): number {
    const j = this.job;
    if (!j || !j.totalRows) return 0;
    return Math.min(100, Math.round(j.rowsRead * 100 / j.totalRows));
  }
  get issues(): JcshIssue[] {
    const list = this.job?.issues ?? [];
    return this.issueFilter ? list.filter(i => i.level === this.issueFilter) : list;
  }
  count(level: string): number { return this.job?.issueCounts?.[level] ?? 0; }
  shown(level: string): number { return (this.job?.issues ?? []).filter(i => i.level === level).length; }

  downloadIssues(): void {
    const r = this.job;
    if (!r?.issues?.length) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['Row,Level,UniqueKey,Job No,Chassis No,Message',
      ...r.issues.map(i => [i.rowNo, i.level, i.uniqueKey, i.jobNo, i.chassisNo, i.message].map(esc).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.fileName.replace(/\.[^.]+$/, '')}_${r.dryRun ? 'validation' : 'import'}_issues.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  stateClass(s: FileState): string {
    return ({
      Waiting: 'bg-light text-muted', Uploading: 'bg-info-subtle text-info', Ready: 'bg-primary-subtle text-primary',
      Validating: 'bg-info-subtle text-info', Validated: 'bg-warning-subtle text-warning', Importing: 'bg-info-subtle text-info',
      Imported: 'bg-success-subtle text-success', Failed: 'bg-danger-subtle text-danger'
    } as Record<FileState, string>)[s];
  }
  levelClass(l: string): string {
    return l === 'Error' ? 'bg-danger-subtle text-danger' : l === 'Skipped' ? 'bg-secondary-subtle text-secondary' : l === 'Info' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning';
  }

  num(v: number | null | undefined): string { return v == null ? '0' : new Intl.NumberFormat('en-IN').format(v); }
  inr(v: number | null | undefined): string {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  }
  size(b: number): string { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.ceil(b / 1024) + ' KB'; }
  duration(s: number | null | undefined): string {
    const t = Math.max(0, Math.round(s ?? 0));
    return t >= 60 ? `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, '0')}s` : `${t}s`;
  }
  date(v?: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  private err(e: any): string {
    if (e?.status === 0) return 'API not reachable.';
    if (e?.status === 401) return 'Session expired - log in again.';
    if (e?.status === 403) return e?.error?.message ?? 'Only Admin / SuperAdmin can import.';
    if (e?.status === 404) return e?.error?.message ?? 'API endpoint not found - rebuild and restart the API.';
    if (e?.status === 409) return e?.error?.message ?? 'Another service history import is already running.';
    if (e?.status === 413) return 'File too large for the server (IIS/Kestrel upload limit).';
    return e?.error?.message ?? e?.message ?? 'Unexpected error.';
  }
  private toast(msg: string, kind: 'success' | 'warning' | 'danger'): void {
    this.toaster.show(msg, { classname: `bg-${kind} text-${kind === 'warning' ? 'dark' : 'white'}`, delay: 6000 });
  }
}
