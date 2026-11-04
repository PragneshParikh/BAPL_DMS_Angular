// src\app\core\services\jobcard-servicehistory-report.service.ts
// Reports on the imported service history (BAPLDMSvad.dbo.JobCardServiceHistory):
//   Service History (search by Chassis No / Registration No) and Job Data (dealer + date range).
// Filtering and paging happen on the API (≈4.8 lakh rows); Excel exports are built on the API.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JcshReportRow { [column: string]: any; }
export interface JcshJobDataDealerRow {
  dealerCode: string; dealerName?: string | null; jobs: number; vehicles: number; netTotal: number;
  firstJobDate?: string | null; lastJobDate?: string | null;
}
export interface JcshReportPage {
  total: number; page: number; pageSize: number; netTotal: number;
  rows: JcshReportRow[];
  /** Job Data only: dealer-wise totals for the whole filter */
  dealers: JcshJobDataDealerRow[];
}
export interface JcshDealerOption { dealerCode: string; dealerName?: string | null; jobs: number; }
export interface JcshSuggestion {
  /** matched value - goes into the search box when picked */
  value: string;
  kind: 'Chassis No' | 'Reg No';
  chassisNo?: string | null; regNo?: string | null; model?: string | null; dealerCode?: string | null;
  jobs: number; lastJobDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JobcardServicehistoryReportService {
  private baseUrl = `${environment.apiUrl}/jobcard-servicehistory-report`;

  constructor(private http: HttpClient) { }

  private params(o: { [k: string]: any }): HttpParams {
    let p = new HttpParams();
    Object.entries(o).forEach(([k, v]) => { if (v != null && v !== '') p = p.set(k, String(v)); });
    return p;
  }

  /** exact = value picked from the type-ahead (matched exactly); otherwise a "starts with" search */
  serviceHistory(search: string, page: number, pageSize: number, exact = false): Observable<JcshReportPage> {
    return this.http.get<JcshReportPage>(`${this.baseUrl}/service-history`, { params: this.params({ search, page, pageSize, exact: exact || null }) });
  }

  /** type-ahead: chassis / reg numbers starting with term (min 2 letters/digits) */
  suggest(term: string): Observable<JcshSuggestion[]> {
    return this.http.get<JcshSuggestion[]>(`${this.baseUrl}/service-history/suggest`, { params: this.params({ term }) });
  }

  jobData(dealerCode: string | null, fromDate: string, toDate: string, page: number, pageSize: number): Observable<JcshReportPage> {
    return this.http.get<JcshReportPage>(`${this.baseUrl}/job-data`, { params: this.params({ dealerCode, fromDate, toDate, page, pageSize }) });
  }

  dealers(): Observable<JcshDealerOption[]> {
    return this.http.get<JcshDealerOption[]>(`${this.baseUrl}/dealers`);
  }

  exportServiceHistory(search: string, exact = false): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/service-history/export`, { params: this.params({ search, exact: exact || null }), responseType: 'blob', observe: 'response' });
  }

  exportJobData(dealerCode: string | null, fromDate: string, toDate: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/job-data/export`, { params: this.params({ dealerCode, fromDate, toDate }), responseType: 'blob', observe: 'response' });
  }

  /** saves an export response as a file (name from Content-Disposition) */
  save(res: HttpResponse<Blob>, fallbackName: string): void {
    const cd = res.headers.get('Content-Disposition') ?? '';
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
    const name = m ? decodeURIComponent(m[1]) : fallbackName;
    const url = URL.createObjectURL(res.body!);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** error text from a JSON or blob error response */
  async errorText(e: any): Promise<string> {
    if (e?.status === 0) return 'API not reachable.';
    if (e?.status === 401) return 'Session expired - log in again.';
    if (e?.status === 404) return 'API endpoint not found - rebuild and restart the API.';
    let body = e?.error;
    if (body instanceof Blob) { try { body = JSON.parse(await body.text()); } catch { body = null; } }
    return body?.message ?? e?.message ?? 'Unexpected error.';
  }
}
