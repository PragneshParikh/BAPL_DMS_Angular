// src\app\core\services\vehicle-sale-import.service.ts
// Cogxim (old DMS) sale register Excel -> VehicleSaleBillHeader / VehicleSaleBillDetails
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImportField {
  key: string; label: string; group: 'Header' | 'Detail'; required: boolean; target: string; aliases: string[];
}
export interface ImportPreview {
  fileName: string;
  sheets: { name: string; rows: number }[];
  sheetName: string;
  headerRow: number;
  totalRows: number;
  headers: string[];
  suggestedMapping: { [key: string]: string };
  sampleRows: { [header: string]: string | null }[];
  fields: ImportField[];
}
export interface ImportOptions {
  sheetName?: string | null;
  headerRow: number;
  mapping: { [key: string]: string };
  defaultDealerCode?: string | null;
  defaultLocation?: string | null;
  prefixDealerCodeOnBillNo: boolean;
  createMissingCustomers: boolean;
  dryRun: boolean;
}
export interface ImportIssue { rowNo: number; saleBillNo?: string; chassisNo?: string; level: 'Error' | 'Skipped' | 'Warning'; message: string; }
export interface ImportResult {
  dryRun: boolean; fileName: string; sheetName: string; totalRows: number;
  billsInFile: number; billsReady: number; vehiclesReady: number;
  billsImported: number; vehiclesImported: number; customersCreated: number;
  rowsSkipped: number; rowsWithErrors: number; warnings: number; totalAmount: number;
  fromDate?: string; toDate?: string;
  dealers: { dealerCode: string; bills: number; vehicles: number; amount: number }[];
  issues: ImportIssue[]; issuesTruncated: boolean;
}

@Injectable({ providedIn: 'root' })
export class VehicleSaleImportService {
  private baseUrl = `${environment.apiUrl}/vehicle-sale-import`;

  constructor(private http: HttpClient) { }

  preview(file: File, sheetName?: string | null, headerRow = 1): Observable<ImportPreview> {
    const fd = new FormData();
    fd.append('file', file);
    if (sheetName) fd.append('sheetName', sheetName);
    fd.append('headerRow', String(headerRow || 1));
    return this.http.post<ImportPreview>(`${this.baseUrl}/preview`, fd);
  }

  import(file: File, options: ImportOptions): Observable<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('options', JSON.stringify(options));
    return this.http.post<ImportResult>(`${this.baseUrl}/import`, fd);
  }
}
