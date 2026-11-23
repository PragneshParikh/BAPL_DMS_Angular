import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HistoricalRepairBillFilter {
  fromDate: string;
  toDate: string;
  dealerCode: string;
  pageIndex: number;
  pageSize: number;
}

export interface HistoricalRepairBillRow {
  id: number;
  dealerCode: string;
  dealerName: string | null;
  jobNo?: string | null;
  invoiceNo: number | null;
  invoiceDate: string | null;
  location: string | null;
  partyName: string | null;
  billType: string | null;
  cashType: string | null;
  regNo: string | null;
  chassisNo: string | null;
}

export interface HistoricalRepairBillItem {
  id: number;
  repairBillId: number;
  itemCode: string | null;
  itemDesc: string | null;
  itemType: string | null;
  qty: number | null;
  rate: number | null;
  sgstAmount: number | null;
  cgstAmount: number | null;
  igstAmount: number | null;
  totAmnt: number | null;
}

export interface HistoricalRepairBillResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  data: HistoricalRepairBillRow[];
}

@Injectable({ providedIn: 'root' })
export class HistoricalRepairBillService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  list(filter: HistoricalRepairBillFilter): Observable<HistoricalRepairBillResponse> {
    let params = new HttpParams()
      .set('pageIndex', filter.pageIndex)
      .set('pageSize', filter.pageSize);

    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);

    return this.http.get<HistoricalRepairBillResponse>(
      `${this.baseUrl}/historical-repair-bill/list`,
      { params }
    );
  }

 items(ids: number[]): Observable<HistoricalRepairBillItem[]> {
    return this.http.post<HistoricalRepairBillItem[]>(
      `${this.baseUrl}/historical-repair-bill/items-by-bills`,
      ids
    );
  }

  exportExcel(filter: { fromDate: string; toDate: string; dealerCode: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);

    return this.http.get<any[]>(
      `${this.baseUrl}/historical-repair-bill/export-excel`,
      { params }
    );
  }
}