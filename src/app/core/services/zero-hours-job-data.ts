import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ZeroHoursJobDataRow {
  id: number;
  compName?: string;
  dealerCode?: string;
  dealerState?: string;
  jobDate?: string;
  jobNo?: string;
  jobCategory?: string;
  ffrPer?: number;
  docNo?: string;
  docDate?: string;
  docType?: string;
  jobStatus?: string;
  location?: string;
  model?: string;
  brandName?: string;
  partyName?: string;
  partyMobile?: string;
  supervisor?: string;
  technician?: string;
  kms?: number;
  serviceHead?: string;
  jobType?: string;
  regNo?: string;
  vehicleType?: string;
  engineNo?: string;
  chassisNo?: string;
  expectedDeliveryDate?: string;
  proformaDate?: string;
  invoiceDate?: string;
  estimatedJobExpenses?: number;
  labourHours?: number;
  parts?: number;
  accessory?: number;
  oil?: number;
  labour?: number;
  outsideWork?: number;
  totalWoTax?: number;
  gstAmnt?: number;
  igstAmnt?: number;
  netTotal?: number;
  inTime?: string;
  closeTime?: string;
  closeDate?: string;
  copnNo?: string;
  saleDate?: string;
  batterySerialNo1?: string;
  batterySerialNo2?: string;
  batterySerialNo3?: string;
  batterySerialNo4?: string;
  batterySerialNo5?: string;
  batterySerialNo6?: string;
  individualAhBattery1?: string;
  individualAhBattery2?: string;
  individualAhBattery3?: string;
  individualAhBattery4?: string;
  individualAhBattery5?: string;
  individualAhBattery6?: string;
  chargerNo?: string;
  controllerNo?: string;
  converter?: string;
  createThrough?: string;
  zoneName?: string;
  uniqueId?: string;
  dealerType?: string;
}

@Injectable({ providedIn: 'root' })
export class ZeroHoursJobDataService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/zero-hours-job-data`;

  getList(filters: {
    dealerCode?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    pageIndex: number;
    pageSize: number;
  }): Observable<{ data: ZeroHoursJobDataRow[]; totalRecords: number }> {
    let params = new HttpParams()
      .set('PageIndex', filters.pageIndex)
      .set('PageSize', filters.pageSize);

    if (filters.dealerCode) params = params.set('DealerCode', filters.dealerCode);
    if (filters.fromDate) params = params.set('FromDate', filters.fromDate);
    if (filters.toDate) params = params.set('ToDate', filters.toDate);
    if (filters.search?.trim()) params = params.set('Search', filters.search.trim());

    return this.http.get<{ data: ZeroHoursJobDataRow[]; totalRecords: number }>(`${this.baseUrl}/list`, { params });
  }

  importFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/import`, formData);
  }

  exportExcel(filters: {
    dealerCode?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }): Observable<Blob> {
    let params = new HttpParams();
    if (filters.dealerCode) params = params.set('DealerCode', filters.dealerCode);
    if (filters.fromDate) params = params.set('FromDate', filters.fromDate);
    if (filters.toDate) params = params.set('ToDate', filters.toDate);
    if (filters.search?.trim()) params = params.set('Search', filters.search.trim());

    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }
}