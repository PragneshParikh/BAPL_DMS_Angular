// src\app\components\vehicle-dispatch-import\vehicle-dispatch-import.ts
// Import the Cogxim vehicle dispatch report (VehicleDispatchReport2021-cogxi ... 2027, one sheet per year)
// into VehicleInward.  Flow: Upload -> Validate (dry run) -> Import.  SuperAdmin only.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  DispatchImportIssue, DispatchImportOptions, DispatchImportResult, DispatchSheetInfo, VehicleDispatchService
} from '../../core/services/vehicle-dispatch.service';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';

type SheetState = 'Waiting' | 'Validating' | 'Validated' | 'Importing' | 'Imported' | 'Failed';

interface QueueItem {
  file: File;
  sheet: DispatchSheetInfo;
  state: SheetState;
  result?: DispatchImportResult;
  error?: string;
}

@Component({
  selector: 'app-vehicle-dispatch-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehicle-dispatch-import.html',
  styleUrl: '../vehicle-sale-import/vehicle-sale-import.scss'
})
export class VehicleDispatchImport implements OnInit {
  isSuperAdmin = false;
  dragOver = false;
  reading = false;

  queue: QueueItem[] = [];
  active: QueueItem | null = null;

  updateExisting = true;
  markAsAccepted = true;

  issueFilter: '' | 'Error' | 'Skipped' | 'Warning' | 'Info' = '';
  successMessage: string | null = null;
  busy = false;

  constructor(
    private api: VehicleDispatchService,
    private storage: StorageService,
    private toaster: ToastService
  ) { }

  ngOnInit(): void {
    this.isSuperAdmin = (this.storage.getRole() || '').toLowerCase().trim() === 'superadmin';
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

  private async addFiles(list: FileList | null): Promise<void> {
    if (!list) return;
    for (const f of Array.from(list)) {
      if (!/\.(xlsx|xlsm)$/i.test(f.name)) {
        this.toast(`${f.name}: only .xlsx files are supported (Save As .xlsx in Excel).`, 'warning');
        continue;
      }
      if (this.queue.some(q => q.file.name === f.name && q.file.size === f.size)) continue;
      this.reading = true;
      try {
        const res = await firstValueFrom(this.api.readSheets(f));
        const usable = res.sheets.filter(s => s.rows > 0);
        const bad = usable.filter(s => !s.canImport);
        bad.forEach(s => this.toast(`${f.name} › ${s.name}: column(s) missing - ${s.missingColumns.join(', ')}.`, 'warning'));
        const items = usable.filter(s => s.canImport).map(s => ({ file: f, sheet: s, state: 'Waiting' as SheetState }));
        if (!items.length) { this.toast(`${f.name}: no sheet with dispatch data found.`, 'warning'); continue; }
        this.queue.push(...items);
        if (!this.active) this.active = items[0];
        if (items.length > 1) this.toast(`${f.name}: ${items.length} sheets added - each is validated and imported separately.`, 'success');
      } catch (e: any) {
        this.toast(`${f.name}: ${this.err(e)}`, 'danger');
      } finally {
        this.reading = false;
      }
    }
  }

  remove(item: QueueItem, ev?: Event): void {
    ev?.stopPropagation();
    if (this.busy) return;
    this.queue = this.queue.filter(q => q !== item);
    if (this.active === item) this.active = this.queue[0] ?? null;
  }

  select(item: QueueItem): void { this.active = item; this.issueFilter = ''; }

  // ------------------------------------------------------------------ run
  private options(dryRun: boolean, item: QueueItem): DispatchImportOptions {
    return { sheetName: item.sheet.name, dryRun, updateExisting: this.updateExisting, markAsAccepted: this.markAsAccepted };
  }

  async validate(item = this.active): Promise<void> {
    if (!item || this.busy) return;
    await this.run(item, true);
  }

  async importNow(item = this.active): Promise<void> {
    if (!item?.result?.dryRun || this.work(item.result) === 0 || this.busy) return;
    const r = item.result;
    const ok = window.confirm(
      `${this.label(item)}:\nNew chassis: ${this.num(r.vehiclesReady)}\nChassis to refresh (earlier Cogxim import): ${this.num(r.vehiclesToUpdate)}\n\n` +
      `Saved in Vehicle Inward as "Cogxim Import"${this.markAsAccepted ? ', received by dealer' : ''}. ` +
      `Chassis already dispatched in DMS are not changed. Continue?`);
    if (!ok) return;
    await this.run(item, false);
    if (item.state === 'Imported' && item.result) {
      this.successMessage = `Imported successfully - ${this.label(item)}: ${this.num(item.result.vehiclesImported)} chassis added, ` +
        `${this.num(item.result.vehiclesUpdated)} refreshed, ${this.num(item.result.rowsSkipped)} rows skipped, ${this.num(item.result.rowsWithErrors)} rows with errors.`;
      window.alert(this.successMessage);
    }
  }

  /** Validate every sheet, then (after one confirmation) import every sheet that has chassis ready. */
  async importAll(): Promise<void> {
    if (this.busy || !this.queue.length) return;
    for (const q of this.queue) {
      if (q.state === 'Imported') continue;
      this.active = q;
      await this.run(q, true);
    }
    const ready = this.queue.filter(q => q.result?.dryRun && this.work(q.result) > 0);
    if (!ready.length) { this.toast('Nothing to import - check the issues of each sheet.', 'warning'); return; }
    const add = ready.reduce((s, q) => s + q.result!.vehiclesReady, 0);
    const upd = ready.reduce((s, q) => s + q.result!.vehiclesToUpdate, 0);
    if (!window.confirm(`Import ${this.num(add)} new chassis and refresh ${this.num(upd)} already-imported chassis from ${ready.length} sheet(s)?`)) return;
    for (const q of ready) { this.active = q; await this.run(q, false); }
    const done = ready.filter(q => q.state === 'Imported' && q.result);
    if (done.length) {
      const sum = (f: (r: DispatchImportResult) => number) => done.reduce((s, q) => s + f(q.result!), 0);
      const failed = ready.length - done.length;
      this.successMessage = `Imported successfully - ${done.length} sheet(s): ${this.num(sum(r => r.vehiclesImported))} chassis added, ` +
        `${this.num(sum(r => r.vehiclesUpdated))} refreshed, ${this.num(sum(r => r.rowsSkipped))} rows skipped.` +
        (failed ? ` ${failed} sheet(s) failed - see the sheet list.` : '');
      window.alert(this.successMessage);
    }
  }

  private async run(item: QueueItem, dryRun: boolean): Promise<void> {
    this.busy = true;
    item.state = dryRun ? 'Validating' : 'Importing';
    item.error = undefined;
    try {
      item.result = await firstValueFrom(this.api.importSheet(item.file, this.options(dryRun, item)));
      item.state = dryRun ? 'Validated' : 'Imported';
      if (!dryRun) this.toast(`${this.label(item)}: ${this.num(item.result.vehiclesImported)} chassis added, ${this.num(item.result.vehiclesUpdated)} refreshed.`, 'success');
    } catch (e: any) {
      item.state = 'Failed';
      item.error = this.err(e);
      this.toast(`${this.label(item)}: ${item.error}`, 'danger');
    } finally {
      this.busy = false;
    }
  }

  work(r?: DispatchImportResult): number { return r ? (r.vehiclesReady ?? 0) + (r.vehiclesToUpdate ?? 0) : 0; }
  label(q: QueueItem): string { return `${q.file.name} › ${q.sheet.name}`; }

  // ------------------------------------------------------------------ result helpers
  get result(): DispatchImportResult | undefined { return this.active?.result; }
  get issues(): DispatchImportIssue[] {
    const list = this.result?.issues ?? [];
    return this.issueFilter ? list.filter(i => i.level === this.issueFilter) : list;
  }
  count(level: string): number { return (this.result?.issues ?? []).filter(i => i.level === level).length; }

  downloadIssues(): void {
    const r = this.result;
    if (!r?.issues?.length) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['Row,Level,Invoice No,Chassis No,Message',
      ...r.issues.map(i => [i.rowNo, i.level, i.invoiceNo, i.chassisNo, i.message].map(esc).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.sheetName || 'dispatch'}_import_issues.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  stateClass(s: SheetState): string {
    return ({
      Waiting: 'bg-light text-muted', Validating: 'bg-info-subtle text-info', Validated: 'bg-warning-subtle text-warning',
      Importing: 'bg-info-subtle text-info', Imported: 'bg-success-subtle text-success', Failed: 'bg-danger-subtle text-danger'
    } as Record<SheetState, string>)[s];
  }
  levelClass(l: string): string {
    return l === 'Error' ? 'bg-danger-subtle text-danger' : l === 'Skipped' ? 'bg-secondary-subtle text-secondary'
      : l === 'Info' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning';
  }

  num(v: number | null | undefined): string { return v == null ? '0' : new Intl.NumberFormat('en-IN').format(v); }
  size(b: number): string { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.ceil(b / 1024) + ' KB'; }
  date(v?: string): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  private err(e: any): string {
    if (e?.status === 0) return 'API not reachable.';
    if (e?.status === 401) return 'Session expired - log in again.';
    if (e?.status === 403) return e?.error?.message ?? 'Only SuperAdmin can import.';
    if (e?.status === 404) return 'API endpoint not found - rebuild and restart the API.';
    if (e?.status === 413) return 'File too large for the server (IIS/Kestrel upload limit).';
    return e?.error?.message ?? e?.message ?? 'Unexpected error.';
  }
  private toast(msg: string, kind: 'success' | 'warning' | 'danger'): void {
    this.toaster.show(msg, { classname: `bg-${kind} text-${kind === 'warning' ? 'dark' : 'white'}`, delay: 6000 });
  }
}
