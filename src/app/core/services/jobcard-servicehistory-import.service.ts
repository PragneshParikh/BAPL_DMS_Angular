// src\app\core\services\jobcard-servicehistory-import.service.ts
// Jobcard Servicehistory Excel (DMS_ServiceHistory export, 63 columns) -> BAPLDMSvad.dbo.JobCardServiceHistory.
// Flow: upload once -> map / check columns -> validate (background dry run) -> import (background, batched).
// The API runs validate / import as background jobs because a 4.8 lakh row file takes longer than the
// Azure App Service request timeout (~230 s); the page polls the job for progress.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JcshField {
  /** Excel header and DB column name are the same, except Excel "Id" -> DB "SourceId" */
  key: string;
  label: string;
  /** Job / Vehicle / Battery / Customer / Amounts / Audit */
  group: string;
  required: boolean;
  /** DB column + SQL type, e.g. "DealerCode nvarchar(20)" */
  target: string;
}

export interface JcshUpload {
  uploadId: string;
  fileName: string;
  fileSize: number;
  sheetName: string;
  sheets: { name: string; rows: number }[];
  totalRows: number;
  headers: string[];
  suggestedMapping: { [key: string]: string };
  sampleRows: { [header: string]: string | null }[];
  fields: JcshField[];
  missingColumns: string[];
  extraColumns: string[];
  /** false when the API has no DefaultConnection configured (validation still runs, without the DB duplicate check) */
  destinationConfigured: boolean;
  /** false when dbo.JobCardServiceHistory is not created yet in BAPLDMSvad (or misses columns) */
  destinationTableExists: boolean;
  destinationMessage?: string | null;
}

export interface JcshRunOptions {
  dryRun: boolean;
  mapping: { [key: string]: string };
  batchSize: number;
  /** optional row range (Excel row numbers, header = 1) */
  fromRow?: number | null;
  toRow?: number | null;
}

export interface JcshIssue {
  rowNo: number;
  level: 'Error' | 'Skipped' | 'Warning' | 'Info';
  uniqueKey?: string | null;
  jobNo?: string | null;
  chassisNo?: string | null;
  message: string;
}

export interface JcshDealerSummary { dealerCode: string; rows: number; netTotal: number; }

export type JcshJobState = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

export interface JcshJob {
  jobId: string;
  uploadId: string;
  dryRun: boolean;
  state: JcshJobState;
  phase: string;
  fileName: string;
  sheetName: string;
  startedAt: string;
  finishedAt?: string | null;
  elapsedSeconds: number;
  totalRows: number;
  rowsRead: number;
  /** valid rows that are new (dry run) */
  rowsReady: number;
  /** rows actually inserted (real import) */
  rowsInserted: number;
  skippedDuplicateInFile: number;
  skippedExisting: number;
  rowsWithErrors: number;
  warnings: number;
  batchesDone: number;
  batchesFailed: number;
  duplicateCheckedAgainstDb: boolean;
  netTotal: number;
  fromDate?: string | null;
  toDate?: string | null;
  dealers: JcshDealerSummary[];
  issues: JcshIssue[];
  issuesTruncated: boolean;
  issueCounts: { [level: string]: number };
  message?: string | null;
  engine: string;
}

export interface JcshHistoryRow { [column: string]: any; }
export interface JcshHistoryPage { total: number; page: number; pageSize: number; rows: JcshHistoryRow[]; }
export interface JcshHistoryQuery {
  chassisNo?: string; regNo?: string; dealerCode?: string; jobNo?: string;
  fromDate?: string; toDate?: string; page?: number; pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class JobcardServicehistoryImportService {
  private baseUrl = `${environment.apiUrl}/jobcard-servicehistory-import`;
  private readUrl = `${environment.apiUrl}/jobcard-servicehistory`;

  constructor(private http: HttpClient) { }

  /** Uploads the workbook once; the API keeps it in temp storage for validate / import. */
  upload(file: File): Observable<JcshUpload> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<JcshUpload>(`${this.baseUrl}/upload`, fd);
  }

  /** Starts a background validate (dryRun) or import job and returns its first status. */
  start(uploadId: string, options: JcshRunOptions): Observable<JcshJob> {
    return this.http.post<JcshJob>(`${this.baseUrl}/${uploadId}/run`, options);
  }

  job(jobId: string): Observable<JcshJob> {
    return this.http.get<JcshJob>(`${this.baseUrl}/jobs/${jobId}`);
  }

  cancel(jobId: string): Observable<JcshJob> {
    return this.http.post<JcshJob>(`${this.baseUrl}/jobs/${jobId}/cancel`, {});
  }

  /** Removes the uploaded file from the API's temp storage. */
  discard(uploadId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${uploadId}`);
  }

  // ---------------------------------------------------------------- read API (imported history)
  search(q: JcshHistoryQuery): Observable<JcshHistoryPage> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, String(v)); });
    return this.http.get<JcshHistoryPage>(this.readUrl, { params });
  }

  byChassis(chassisNo: string): Observable<JcshHistoryRow[]> {
    return this.http.get<JcshHistoryRow[]>(`${this.readUrl}/chassis/${encodeURIComponent(chassisNo)}`);
  }
}
