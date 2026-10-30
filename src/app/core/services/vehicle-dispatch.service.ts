// src\app\core\services\vehicle-dispatch.service.ts
// Vehicle Dispatch (OEM invoice to dealer = VehicleInward): Cogxim import + report. SuperAdmin only.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DispatchSheetInfo { name: string; rows: number; missingColumns: string[]; canImport: boolean; }
export interface DispatchSheetsResponse { fileName: string; sheets: DispatchSheetInfo[]; }

export interface DispatchImportOptions {
  sheetName?: string | null;
  dryRun: boolean;
  updateExisting: boolean;
  markAsAccepted: boolean;
}
export interface DispatchImportIssue {
  rowNo: number; level: 'Error' | 'Skipped' | 'Warning' | 'Info'; invoiceNo?: string; chassisNo?: string; message: string;
}
export interface DispatchImportResult {
  engine?: string; dryRun: boolean; fileName: string; sheetName: string;
  totalRows: number; invoicesInFile: number;
  vehiclesReady: number; vehiclesToUpdate: number; vehiclesImported: number; vehiclesUpdated: number;
  rowsSkipped: number; rowsWithErrors: number; warnings: number;
  fromDate?: string; toDate?: string;
  dealers: { dealerCode: string; dealerName?: string; invoices: number; vehicles: number }[];
  issues: DispatchImportIssue[]; issuesTruncated: boolean;
}

export interface DispatchReportFilter {
  fromDate?: string; toDate?: string; dealerCode?: string; invoiceNo?: string; chassisNo?: string;
  source?: '' | 'cogxim' | 'dms'; status?: '' | 'accepted' | 'pending'; saleStatus?: '' | 'sold' | 'unsold';
  search?: string; pageIndex: number; pageSize: number;
}
export interface DispatchReportRow {
  srNo: number; id: number; invoiceDate?: string; invoiceNo?: string;
  dealerCode?: string; dealerName?: string; dealerCity?: string; dealerState?: string;
  locCode?: string; locationName?: string; locationCity?: string;
  itemCode?: string; modelName?: string; colrCode?: string; colourName?: string; mfgMonth?: number; mfgYear?: number;
  chassisNo?: string; motorNo?: string; batteryId?: string; batteryNo?: string; batteryNo2?: string;
  batteryCapacity?: string; batteryChemistry?: string; batteryMake?: string; chargerNo?: string; controllerNo?: string;
  converter?: string; vcu?: string; ecuSerno?: string; ecuImEi?: string; immoblizerNo?: string; bikeSimid?: string;
  voltage?: string; regNumber?: string; startDate?: string; tyreNo1?: string; tyreNo2?: string; poNumber?: string;
  isAccepted?: boolean; isD2d?: boolean; source: string;
  saleBillNo?: string; saleDate?: string; customerName?: string; createdDate?: string;
}
export interface DispatchReportResponse {
  data: DispatchReportRow[]; totalRecords: number; pageIndex: number; pageSize: number;
  totalAccepted: number; totalPending: number; totalSold: number; totalUnsold: number;
  totalDealers: number; totalInvoices: number; totalCogxim: number;
}

@Injectable({ providedIn: 'root' })
export class VehicleDispatchService {
  private apiUrl = `${environment.apiUrl}/vehicle-dispatch-data`;

  constructor(private http: HttpClient) { }

  readSheets(file: File): Observable<DispatchSheetsResponse> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DispatchSheetsResponse>(`${this.apiUrl}/import/sheets`, fd);
  }

  importSheet(file: File, options: DispatchImportOptions): Observable<DispatchImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('options', JSON.stringify(options));
    return this.http.post<DispatchImportResult>(`${this.apiUrl}/import`, fd);
  }

  getReport(filter: DispatchReportFilter): Observable<DispatchReportResponse> {
    return this.http.post<DispatchReportResponse>(`${this.apiUrl}/report`, filter);
  }
}
