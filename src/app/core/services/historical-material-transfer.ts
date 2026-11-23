import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HistoricalMaterialTransferFilter {
  fromDate: string;
  toDate: string;
  dealerCode: string;
  pageIndex: number;
  pageSize: number;
}

export interface HistoricalMaterialTransferRow {
  id: number;
  dealerCode: string | null;
  dealerName: string | null;
  docNo: number | null;
  jobNo?: string | null;
  docDate: string | null;
  docType: string | null;
  location: string | null;
  locCode: string | null;
  technicianName: string | null;
  action: string | null;
}

export interface HistoricalMaterialTransferItem {
  id: number;
  materialTransferId: number;
  itemName: string | null;
  itemDescription: string | null;
  itemType: string | null;
  qty: number | null;
  rate: number | null;
  sgstPer: number | null;
  sgstAmount: number | null;
  cgstPer: number | null;
  cgstAmount: number | null;
  igstPer: number | null;
  igstAmount: number | null;
  discount: number | null;
  mrp: number | null;
}

export interface HistoricalMaterialTransferLabor {
  id: number;
  materialTransferItemId: number;
  lbrName: string | null;
  lbrDescription: string | null;
  lbrRate: number | null;
  sgstPer: number | null;
  sgstAmount: number | null;
  cgstPer: number | null;
  cgstAmount: number | null;
  igstPer: number | null;
  igstAmount: number | null;
}

export interface HistoricalMaterialTransferDetailsResponse {
  items: HistoricalMaterialTransferItem[];
  labors: HistoricalMaterialTransferLabor[];
}

export interface HistoricalMaterialTransferResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  data: HistoricalMaterialTransferRow[];
}

@Injectable({ providedIn: 'root' })
export class HistoricalMaterialTransferService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  list(filter: HistoricalMaterialTransferFilter): Observable<HistoricalMaterialTransferResponse> {
    let params = new HttpParams()
      .set('pageIndex', filter.pageIndex)
      .set('pageSize', filter.pageSize);

    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);

    return this.http.get<HistoricalMaterialTransferResponse>(
      `${this.baseUrl}/historical-material-transfer/list`,
      { params }
    );
  }

  details(ids: number[]): Observable<HistoricalMaterialTransferDetailsResponse> {
    return this.http.post<HistoricalMaterialTransferDetailsResponse>(
      `${this.baseUrl}/historical-material-transfer/details-by-transfers`,
      ids
    );
  }

  exportExcel(filter: { fromDate: string; toDate: string; dealerCode: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);

    return this.http.get<any[]>(
      `${this.baseUrl}/historical-material-transfer/export-excel`,
      { params }
    );
  }
}