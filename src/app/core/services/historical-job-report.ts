import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HistoricalJobReportRequest {
  fromDate: string;
  toDate: string;
  searchText?: string;
  dealerCode?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface HistoricalJobReportPagedResponse {
  data: any[];
  totalRecords: number;
}

@Injectable({ providedIn: 'root' })
export class HistoricalJobReportService {
  private baseUrl = `${environment.apiUrl}/historical-job-report`;

  constructor(private http: HttpClient) {}

  private toParams(req: HistoricalJobReportRequest): HttpParams {
    let params = new HttpParams()
      .set('fromDate', req.fromDate)
      .set('toDate', req.toDate)
      .set('pageIndex', req.pageIndex)
      .set('pageSize', req.pageSize);

    if (req.dealerCode) {
      params = params.set('dealerCode', req.dealerCode);
    }

    if (req.searchText && req.searchText.trim()) {
      params = params.set('searchText', req.searchText.trim());
    }

    return params;
  }

  getReport(req: HistoricalJobReportRequest): Observable<HistoricalJobReportPagedResponse> {
    return this.http.get<HistoricalJobReportPagedResponse>(
      `${this.baseUrl}/list`,
      { params: this.toParams(req) }
    );
  }

  download(req: HistoricalJobReportRequest): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download`, {
      params: this.toParams(req),
      responseType: 'blob'
    });
  }
}