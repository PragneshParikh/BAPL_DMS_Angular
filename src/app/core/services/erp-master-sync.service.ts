//src\app\core\services\erp-master-sync.service.ts
// 26.11.2026 - Dealer Master / Location Master: UAT ERP report import + ERP sync (SuperAdmin).
// API: DMS_BAPL/Controllers/ErpMasterSyncController.cs. apply=false -> preview only, apply=true -> saved.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ErpSyncItem {
  code: string;
  name?: string | null;
  dealerCode?: string | null;
  action: 'Insert' | 'Update' | 'Activate' | 'Inactivate' | 'Unchanged' | 'Skip' | 'Failed' | string;
  detail?: string | null;
  rowNumber?: number | null;
}

export interface ErpSyncResult {
  applied: boolean;
  source: string;
  totalRows: number;
  inserted: number;
  updated: number;
  activated: number;
  inactivated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  activeAfter: number;
  inactiveAfter: number;
  items: ErpSyncItem[];
  notes: string[];
}

export type ErpSyncKind = 'dealer' | 'location';
export type ErpSyncMode = 'import' | 'sync';

@Injectable({ providedIn: 'root' })
export class ErpMasterSyncService {
  private readonly baseUrl = `${environment.apiUrl}/erp-master-sync`;

  constructor(private http: HttpClient) {}

  importDealers(file: File, apply: boolean): Observable<ErpSyncResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<ErpSyncResult>(`${this.baseUrl}/dealers/import`, fd, { params: new HttpParams().set('apply', apply) });
  }

  syncDealers(apply: boolean, dealerCode?: string | null): Observable<ErpSyncResult> {
    let p = new HttpParams().set('apply', apply);
    if (dealerCode) p = p.set('dealerCode', dealerCode);
    return this.http.post<ErpSyncResult>(`${this.baseUrl}/dealers/sync`, null, { params: p });
  }

  importLocations(file: File, apply: boolean, inactivateMissing: boolean): Observable<ErpSyncResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<ErpSyncResult>(`${this.baseUrl}/locations/import`, fd,
      { params: new HttpParams().set('apply', apply).set('inactivateMissing', inactivateMissing) });
  }

  syncLocations(apply: boolean, dealerCode?: string | null): Observable<ErpSyncResult> {
    let p = new HttpParams().set('apply', apply);
    if (dealerCode) p = p.set('dealerCode', dealerCode);
    return this.http.post<ErpSyncResult>(`${this.baseUrl}/locations/sync`, null, { params: p });
  }
}
