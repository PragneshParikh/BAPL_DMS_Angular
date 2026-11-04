// src\app\shared\import-progress\import-progress.service.ts
// Live status of a running Excel import (Vehicle Sale Import, Vehicle Dispatch Import).
// The page sends options.progressId with the import request and polls GET api/import-progress/{id}
// every 1.5 s until that request returns.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, catchError, of, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImportProgressInfo {
  id: string;
  kind: string;
  dryRun: boolean;
  phase: string;
  step: number;
  steps: number;
  rowsRead: number;
  totalRows: number;
  /** what done / total count: bills, chassis, rows, customers */
  unit: string;
  done: number;
  total: number;
  batchNo: number;
  batches: number;
  inserted: number;
  updated: number;
  failed: number;
  finished: boolean;
  success: boolean;
  elapsedSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class ImportProgressService {
  private baseUrl = `${environment.apiUrl}/import-progress`;

  constructor(private http: HttpClient) { }

  /** id accepted by the API: letters, digits and '-' (crypto.randomUUID needs https, so not used) */
  newId(): string {
    return `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  get(id: string): Observable<ImportProgressInfo | null> {
    return this.http.get<ImportProgressInfo>(`${this.baseUrl}/${id}`).pipe(catchError(() => of(null)));   // 404 until the import starts
  }

  /** Polls every 1.5 s and hands each status to onUpdate. Unsubscribe when the import request returns. */
  watch(id: string, onUpdate: (p: ImportProgressInfo) => void): Subscription {
    return timer(800, 1500).pipe(switchMap(() => this.get(id))).subscribe(p => { if (p) onUpdate(p); });
  }
}
