import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NewZeroHoursRow {
  id: number;
  jobCardHeaderId?: number;
  repairBillHeaderId?: number;
  compName?: string;
  dealerCode?: string;
  dealerName?: string;
  dealerState?: string;
  dealerType?: string;
  locationCode?: string;
  locationName?: string;
  jobDate?: string;
  jobNo?: string;
  jobCategory?: string;
  docNo?: string;
  docDate?: string;
  jobStatus?: string;
  invoiceDate?: string;
  closeDate?: string;
  saleDate?: string;
  expectedDeliveryDate?: string;
  inTime?: string;
  closeTime?: string;
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
  motorNo?: string;
  chassisNo?: string;
  copnNo?: string;
  chargerNo?: string;
  controllerNo?: string;
  converterNo?: string;
  createThrough?: string;
  issueType?: string;
  estimatedJobExpenses?: number;
  partsAmount?: number;
  accessoryAmount?: number;
  oilAmount?: number;
  labourAmount?: number;
  outsideWorkAmount?: number;
  totalWoTax?: number;
  gstAmnt?: number;
  igstAmnt?: number;
  netTotal?: number;
  zoneName?: string;
  uniqueId?: string;
}

export interface NewZeroHoursFilter {
  dealerCode?: string;
  locationCode?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  pageIndex: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class NewZeroHoursService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/new-zero-hours`;

  getDealers(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/DealerMaster/getDealerDropdown`);
  }

  getLocations(dealerCode?: string): Observable<any> {
    let params = new HttpParams();
    if (dealerCode && dealerCode !== 'ALL') {
      params = params.set('dealerCode', dealerCode);
    }
    return this.http.get<any>(`${this.baseUrl}/locations`, { params });
  }

  syncFromNewDms(payload: {
    dealerCode?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sync`, {
      dealerCode: payload.dealerCode && payload.dealerCode !== 'ALL' ? payload.dealerCode : null,
      fromDate: payload.fromDate || null,
      toDate: payload.toDate || null
    });
  }

  getList(filters: NewZeroHoursFilter): Observable<{ data: NewZeroHoursRow[]; totalRecords: number }> {
    let params = new HttpParams()
      .set('pageIndex', String(filters.pageIndex))
      .set('pageSize', String(filters.pageSize));

    if (filters.dealerCode && filters.dealerCode !== 'ALL') {
      params = params.set('dealerCode', filters.dealerCode);
    }
    if (filters.locationCode && filters.locationCode !== 'ALL') {
      params = params.set('locationCode', filters.locationCode);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<{ data: NewZeroHoursRow[]; totalRecords: number }>(
      `${this.baseUrl}/list`,
      { params }
    );
  }

  exportExcel(filters: Omit<NewZeroHoursFilter, 'pageIndex' | 'pageSize'>): Observable<Blob> {
    let params = new HttpParams();

    if (filters.dealerCode && filters.dealerCode !== 'ALL') {
      params = params.set('dealerCode', filters.dealerCode);
    }
    if (filters.locationCode && filters.locationCode !== 'ALL') {
      params = params.set('locationCode', filters.locationCode);
    }
    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}