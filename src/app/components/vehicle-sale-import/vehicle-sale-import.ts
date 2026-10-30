// src\app\components\vehicle-sale-import\vehicle-sale-import.ts
// Import Cogxim sale register (tblSaleRegister2021-Cogxim ... 2027) Excel files into
// VehicleSaleBillHeader / VehicleSaleBillDetails.  Flow: Upload -> Map columns -> Validate (dry run) -> Import.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ImportField, ImportIssue, ImportOptions, ImportPreview, ImportResult, VehicleSaleBillService
} from '../../core/services/vehicle-sale-bill-service';
import { DealerService } from '../../core/services/dealer-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';

type FileState = 'Waiting' | 'Reading' | 'Ready' | 'Validating' | 'Validated' | 'Importing' | 'Imported' | 'Failed';

interface QueueItem {
  file: File;
  /** sheet of the workbook this item imports (one item per year sheet of the original Cogxim workbook) */
  sheet?: string;
  state: FileState;
  preview?: ImportPreview;
  result?: ImportResult;
  error?: string;
}

@Component({
  selector: 'app-vehicle-sale-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehicle-sale-import.html',
  styleUrl: './vehicle-sale-import.scss'
})
export class VehicleSaleImport implements OnInit {
  isAdmin = false;
  dragOver = false;

  queue: QueueItem[] = [];
  active: QueueItem | null = null;

  // mapping + options (shared by all files: the yearly Cogxim exports have the same columns)
  fields: ImportField[] = [];
  mapping: { [key: string]: string } = {};
  sheetName: string | null = null;
  headerRow = 1;
  defaultDealerCode = '';
  defaultLocation = '';
  prefixDealerCodeOnBillNo = false;
  createMissingCustomers = true;
  updateExisting = true;
  generateSaleBillNo = true;
  createMissingMasters = true;
  showMasters = false;

  dealers: { dealerCode: string; dealerName: string }[] = [];
  locations: { loccode: string; locname: string }[] = [];

  issueFilter: '' | 'Error' | 'Skipped' | 'Warning' | 'Info' = '';
  /** green banner shown after a real import */
  successMessage: string | null = null;
  busy = false;

  constructor(
    private api: VehicleSaleBillService,
    private dealerService: DealerService,
    private locationService: LocationMasterService,
    private storage: StorageService,
    private toaster: ToastService
  ) { }

  ngOnInit(): void {
    const role = (this.storage.getRole() || '').toLowerCase().trim();
    this.isAdmin = role === 'superadmin' || role === 'admin';
    if (!this.isAdmin) return;
    this.dealerService.getDealerDropdown(null).subscribe({
      next: res => this.dealers = (res?.data ?? res ?? []).map((d: any) => ({ dealerCode: d.dealerCode, dealerName: d.dealerName }))
    });
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
    if (this.busy) return;
    this.queue = this.queue.filter(q => q !== item);
    if (this.active === item) this.active = this.queue[0] ?? null;
  }

  select(item: QueueItem): void {
    this.active = item;
    if (!item.preview) this.loadPreview(item);
  }

  async loadPreview(item: QueueItem, keepMapping = true, sheet: string | null = null): Promise<void> {
    item.state = 'Reading';
    item.error = undefined;
    try {
      const p = await firstValueFrom(this.api.previewCogximImport(item.file, sheet ?? item.sheet ?? null, this.headerRow));
      item.preview = p;
      item.state = 'Ready';
      // original Cogxim workbook: one queue entry per year sheet (tblSaleRegister2021-Cogxim ... 2027)
      if (!item.sheet) {
        item.sheet = p.sheetName;
        const years = p.sheets.filter(s => /cogxim|saleregister/i.test(s.name) && s.rows > 0 && s.name !== p.sheetName);
        if (years.length) {
          const extra: QueueItem[] = years.map(s => ({ file: item.file, sheet: s.name, state: 'Waiting' as FileState }));
          this.queue.splice(this.queue.indexOf(item) + 1, 0, ...extra);
          this.toast(`${item.file.name}: ${years.length + 1} year sheets added - each is validated and imported separately.`, 'success');
        }
      }
      if (!this.fields.length) this.fields = p.fields;
      this.sheetName = p.sheetName;
      // keep the user's mapping if those headers exist in this file, otherwise take the suggestion
      const next: { [k: string]: string } = {};
      for (const f of p.fields) {
        const mine = keepMapping ? this.mapping[f.key] : undefined;
        next[f.key] = mine && p.headers.includes(mine) ? mine : (p.suggestedMapping[f.key] ?? '');
      }
      this.mapping = next;
    } catch (e: any) {
      item.state = 'Failed';
      item.error = this.err(e);
    }
  }

  onSheetChange(): void {
    if (!this.active) return;
    this.active.sheet = this.sheetName ?? undefined;
    this.active.result = undefined;
    this.loadPreview(this.active, true, this.sheetName);
  }

  onHeaderRowChange(): void {
    if (this.active) this.loadPreview(this.active, false, this.sheetName);
  }

  onDealerChange(): void {
    this.defaultLocation = '';
    this.locations = [];
    if (!this.defaultDealerCode) return;
    this.locationService.getLocationDropdownByDealerCode(this.defaultDealerCode).subscribe({
      next: (res: any[]) => this.locations = (res ?? []).map(l => ({ loccode: l.loccode ?? l.locCode, locname: l.locname ?? l.locName }))
    });
  }

  // ------------------------------------------------------------------ mapping helpers
  get headerFields(): ImportField[] { return this.fields.filter(f => f.group === 'Header'); }
  get detailFields(): ImportField[] { return this.fields.filter(f => f.group === 'Detail'); }
  get mappedCount(): number { return Object.values(this.mapping).filter(v => !!v).length; }
  get missingRequired(): ImportField[] {
    const list = this.fields.filter(f => f.required && !this.mapping[f.key]);
    if (!this.mapping['dealerCode'] && !this.defaultDealerCode) list.unshift({ key: 'dealerCode', label: 'Dealer Code (or a default dealer)' } as ImportField);
    return list;
  }
  get unmappedHeaders(): string[] {
    const used = new Set(Object.values(this.mapping).filter(Boolean));
    return (this.active?.preview?.headers ?? []).filter(h => !used.has(h));
  }
  sample(field: ImportField): string {
    const h = this.mapping[field.key];
    if (!h || !this.active?.preview) return '';
    const v = this.active.preview.sampleRows.map(r => r[h]).find(x => x != null && x !== '');
    return v ?? '';
  }
  isUsedElsewhere(header: string, key: string): boolean {
    return Object.entries(this.mapping).some(([k, v]) => k !== key && v === header);
  }
  autoMap(): void {
    if (!this.active?.preview) return;
    this.mapping = { ...Object.fromEntries(this.fields.map(f => [f.key, ''])), ...this.active.preview.suggestedMapping };
  }
  clearMap(): void { this.mapping = Object.fromEntries(this.fields.map(f => [f.key, ''])); }

  // ------------------------------------------------------------------ run
  private options(dryRun: boolean, item: QueueItem): ImportOptions {
    return {
      sheetName: item.sheet ?? item.preview?.sheetName ?? this.sheetName,
      headerRow: this.headerRow,
      mapping: Object.fromEntries(Object.entries(this.mapping).filter(([, v]) => !!v)),
      defaultDealerCode: this.defaultDealerCode || null,
      defaultLocation: this.defaultLocation || null,
      prefixDealerCodeOnBillNo: this.prefixDealerCodeOnBillNo,
      createMissingCustomers: this.createMissingCustomers,
      updateExisting: this.updateExisting,
      generateSaleBillNo: this.generateSaleBillNo,
      createMissingMasters: this.createMissingMasters,
      dryRun
    };
  }

  async validate(item = this.active): Promise<void> {
    if (!item || this.missingRequired.length) return;
    await this.run(item, true);
  }

  async importNow(item = this.active): Promise<void> {
    if (!item?.result || !item.result.dryRun || this.work(item.result) === 0) return;
    const r = item.result;
    const ok = window.confirm(
      `${this.label(item)}:\n` +
      `New bills: ${this.num(r.billsReady)}\nBills to update (already imported from Cogxim): ${this.num(r.billsToUpdate)}\n` +
      `Vehicles: ${this.num(r.vehiclesReady)}\n\n` +
      `Saved as Invoiced with Bill From "Cogxim Import". Stock is not changed. Continue?`);
    if (!ok) return;
    await this.run(item, false);
    if (item.state === 'Imported' && item.result) {
      const r = item.result;
      this.successMessage = `Imported successfully - ${this.label(item)}: ${this.num(r.billsImported)} bills imported, ${this.num(r.billsUpdated)} updated, ` +
        `${this.num(r.vehiclesImported + r.vehiclesUpdated)} vehicles saved, ${this.num(r.rowsSkipped)} rows skipped.`;
      window.alert(this.successMessage);
    }
  }

  /** Validate every waiting file, then (after one confirmation) import every file that has bills ready. */
  async importAll(): Promise<void> {
    if (this.missingRequired.length || this.busy) return;
    // live index: reading a Cogxim workbook adds its other year sheets to the queue
    for (let i = 0; i < this.queue.length; i++) {
      const q = this.queue[i];
      if (q.state === 'Imported') continue;
      this.active = q;
      if (!q.preview) await this.loadPreview(q);
      if (q.state === 'Failed') continue;
      await this.run(q, true);
    }
    const ready = this.queue.filter(q => q.result?.dryRun && this.work(q.result) > 0);
    if (!ready.length) { this.toast('Nothing to import - check the issues of each file.', 'warning'); return; }
    const bills = ready.reduce((s, q) => s + q.result!.billsReady, 0);
    const upd = ready.reduce((s, q) => s + (q.result!.billsToUpdate ?? 0), 0);
    const vehicles = ready.reduce((s, q) => s + q.result!.vehiclesReady, 0);
    if (!window.confirm(`Import ${this.num(bills)} new bills and update ${this.num(upd)} already-imported bills (${this.num(vehicles)} vehicles) from ${ready.length} sheet(s)?`)) return;
    for (const q of ready) { this.active = q; await this.run(q, false); }
    const done = ready.filter(q => q.state === 'Imported' && q.result);
    const failed = ready.length - done.length;
    if (done.length) {
      const sum = (f: (r: ImportResult) => number) => done.reduce((s, q) => s + f(q.result!), 0);
      this.successMessage = `Imported successfully - ${done.length} sheet(s): ${this.num(sum(r => r.billsImported))} bills imported, ` +
        `${this.num(sum(r => r.billsUpdated))} updated, ${this.num(sum(r => r.vehiclesImported + r.vehiclesUpdated))} vehicles saved, ` +
        `${this.num(sum(r => r.rowsSkipped))} rows skipped.` + (failed ? ` ${failed} sheet(s) failed - see the file list.` : '');
      window.alert(this.successMessage);
    }
  }

  mastersTotal(r: ImportResult | undefined | null): number {
    if (!r) return 0;
    return (r.oemModelsCreated ?? 0) + (r.itemModelsCreated ?? 0) + (r.financiersCreated ?? 0) + (r.citiesCreated ?? 0) + (r.occupationsCreated ?? 0);
  }

  private async run(item: QueueItem, dryRun: boolean): Promise<void> {
    this.busy = true;
    item.state = dryRun ? 'Validating' : 'Importing';
    item.error = undefined;
    try {
      item.result = await firstValueFrom(this.api.importCogximSales(item.file, this.options(dryRun, item)));
      item.state = dryRun ? 'Validated' : 'Imported';
      if (!dryRun) this.toast(`${this.label(item)}: ${this.num(item.result.billsImported)} bills imported, ${this.num(item.result.billsUpdated)} updated, ${this.num(item.result.customersUpdated)} customers completed, ${this.num(this.mastersTotal(item.result))} masters created.`, 'success');
    } catch (e: any) {
      item.state = 'Failed';
      item.error = this.err(e);
      this.toast(`${item.file.name}: ${item.error}`, 'danger');
    } finally {
      this.busy = false;
    }
  }

  /** bills that a real run would insert or update */
  work(r?: ImportResult): number { return r ? (r.billsReady ?? 0) + (r.billsToUpdate ?? 0) : 0; }
  label(q: QueueItem): string { return q.sheet ? `${q.file.name} › ${q.sheet}` : q.file.name; }

  // ------------------------------------------------------------------ result helpers
  get result(): ImportResult | undefined { return this.active?.result; }
  get issues(): ImportIssue[] {
    const list = this.result?.issues ?? [];
    return this.issueFilter ? list.filter(i => i.level === this.issueFilter) : list;
  }
  count(level: string): number { return (this.result?.issues ?? []).filter(i => i.level === level).length; }

  downloadIssues(): void {
    const r = this.result;
    if (!r?.issues?.length) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['Row,Level,Bill No,Chassis No,Message', ...r.issues.map(i => [i.rowNo, i.level, i.saleBillNo, i.chassisNo, i.message].map(esc).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.fileName.replace(/\.[^.]+$/, '')}_import_issues.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  stateClass(s: FileState): string {
    return ({
      Waiting: 'bg-light text-muted', Reading: 'bg-info-subtle text-info', Ready: 'bg-primary-subtle text-primary',
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
  date(v?: string): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  private err(e: any): string {
    if (e?.status === 0) return 'API not reachable.';
    if (e?.status === 401) return 'Session expired - log in again.';
    if (e?.status === 403) return e?.error?.message ?? 'Only Admin / SuperAdmin can import.';
    if (e?.status === 413) return 'File too large for the server (IIS/Kestrel upload limit).';
    return e?.error?.message ?? e?.message ?? 'Unexpected error.';
  }
  private toast(msg: string, kind: 'success' | 'warning' | 'danger'): void {
    this.toaster.show(msg, { classname: `bg-${kind} text-${kind === 'warning' ? 'dark' : 'white'}`, delay: 6000 });
  }
}
