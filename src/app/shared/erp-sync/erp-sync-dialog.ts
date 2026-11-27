//src\app\shared\erp-sync\erp-sync-dialog.ts
// 26.11.2026 - shared popup for Dealer Master / Location Master:
//   import  = UAT ERP report (exact headers)  -> preview -> Apply
//   sync    = ERP table (BaplConnection)      -> preview -> Apply
// Opened with NgbModal; set kind / mode / dealerCode on componentInstance. Closes with 'saved' after Apply.
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { ErpMasterSyncService, ErpSyncItem, ErpSyncKind, ErpSyncMode, ErpSyncResult } from '../../core/services/erp-master-sync.service';

@Component({
  selector: 'app-erp-sync-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './erp-sync-dialog.html',
  styleUrl: './erp-sync-dialog.scss'
})
export class ErpSyncDialog {
  @Input() kind: ErpSyncKind = 'dealer';
  @Input() mode: ErpSyncMode = 'import';
  /** sync only: one dealer (blank = all) */
  @Input() dealerCode: string | null = null;

  readonly dealerHeaders = ['Company Code', 'Company Name', 'Dealer Code', 'Email Id', 'MobileNo', 'State', 'City', 'City Tier', 'Source', 'Current Status', 'Registration Date', 'Modified By', 'Previous Status', 'Modified Date', 'Remarks'];
  readonly locationHeaders = ['Location Area', 'Location Code', 'Location Name', 'SupplierCode', 'Dealer Code', 'Dealer Name', 'Source', 'Status'];
  readonly actions = ['Insert', 'Update', 'Activate', 'Inactivate', 'Unchanged', 'Skip', 'Failed'];

  file: File | null = null;
  inactivateMissing = true;
  busy = false;
  error = '';
  preview: ErpSyncResult | null = null;
  done: ErpSyncResult | null = null;
  filterAction = '';
  search = '';
  showRows = 200;

  constructor(public modal: NgbActiveModal, private api: ErpMasterSyncService) {}

  get title(): string {
    const what = this.kind === 'dealer' ? 'Dealers' : 'Locations';
    return this.mode === 'import' ? `Import ${what} - UAT ERP report` : `Sync ${what} from ERP`;
  }

  get sourceText(): string {
    if (this.mode === 'import')
      return this.kind === 'dealer' ? 'UAT_ERP_ManageDealerReport (Excel)' : 'UAT_ERP_LocatonList (Excel)';
    return this.kind === 'dealer'
      ? "ERP C_CustomerMaster (CustomerCode like '%CUS%' and Active = 'Y')"
      : 'ERP C_DMS_DealerConsigneeDetail';
  }

  get result(): ErpSyncResult | null { return this.done || this.preview; }

  get changes(): number {
    const r = this.preview;
    return r ? r.inserted + r.updated + r.activated + r.inactivated : 0;
  }

  get rows(): ErpSyncItem[] {
    const r = this.result;
    if (!r) return [];
    const q = (this.search || '').trim().toLowerCase();
    return r.items.filter(i =>
      (!this.filterAction || i.action === this.filterAction) &&
      (!q || `${i.code} ${i.name || ''} ${i.dealerCode || ''} ${i.detail || ''}`.toLowerCase().includes(q)));
  }

  count(action: string): number {
    return this.result ? this.result.items.filter(i => i.action === action).length : 0;
  }

  badge(action: string): string {
    switch (action) {
      case 'Insert': return 'bg-success';
      case 'Update': return 'bg-info text-dark';
      case 'Activate': return 'bg-primary';
      case 'Inactivate': return 'bg-warning text-dark';
      case 'Failed': return 'bg-danger';
      case 'Skip': return 'bg-secondary';
      default: return 'bg-light text-dark border';
    }
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] || null;
    this.preview = null;
    this.done = null;
    this.error = '';
  }

  private call(apply: boolean): Observable<ErpSyncResult> {
    if (this.kind === 'dealer')
      return this.mode === 'import' ? this.api.importDealers(this.file!, apply) : this.api.syncDealers(apply, this.dealerCode);
    return this.mode === 'import' ? this.api.importLocations(this.file!, apply, this.inactivateMissing) : this.api.syncLocations(apply, this.dealerCode);
  }

  private message(err: any): string {
    if (err?.status === 0) return 'Server not reachable.';
    if (err?.status === 403) return err?.error?.message || 'Only SuperAdmin can do this.';
    const b = err?.error;
    return (typeof b === 'string' && b) || b?.message || b?.title || 'Request failed.';
  }

  runPreview(): void {
    if (this.mode === 'import' && !this.file) { this.error = 'Choose the Excel file first.'; return; }
    this.busy = true;
    this.error = '';
    this.done = null;
    this.filterAction = '';
    this.call(false).subscribe({
      next: r => { this.preview = r; this.busy = false; this.showRows = 200; },
      error: e => { this.error = this.message(e); this.busy = false; }
    });
  }

  apply(): void {
    if (!this.preview || this.busy) return;
    const p = this.preview;
    const text = `Save these changes?\n\nAdd: ${p.inserted}\nUpdate: ${p.updated}\nActivate: ${p.activated}\nInactivate: ${p.inactivated}`;
    if (!window.confirm(text)) return;
    this.busy = true;
    this.error = '';
    this.call(true).subscribe({
      next: r => { this.done = r; this.busy = false; this.filterAction = ''; this.showRows = 200; },
      error: e => { this.error = this.message(e); this.busy = false; }
    });
  }

  close(): void {
    this.modal.close(this.done ? 'saved' : 'cancel');
  }

  /** the list as CSV (opens in Excel) */
  downloadCsv(): void {
    const r = this.result;
    if (!r) return;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Action', this.kind === 'dealer' ? 'Dealer Code' : 'Location Code', 'Name', 'Dealer Code', 'Row', 'Detail'];
    const lines = [head.map(esc).join(',')].concat(this.rows.map(i => [i.action, i.code, i.name, i.dealerCode, i.rowNumber, i.detail].map(esc).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.kind}-${this.mode}-${this.done ? 'result' : 'preview'}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}
