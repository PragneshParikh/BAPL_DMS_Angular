import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LineOrderReportRequest,LineOrderReportPagedResponse } from '../../ViewModels/models/line-order-report.model';

@Injectable({ providedIn: 'root' })
export class LineOrderReportService {
  private baseUrl = `${environment.apiUrl}/line-order-report`;

  constructor(private http: HttpClient) {}

  private toParams(req: LineOrderReportRequest): HttpParams {
    let params = new HttpParams()
      .set('lineType', req.lineType)
      .set('fromDate', req.fromDate)
      .set('toDate', req.toDate)
      .set('pageIndex', req.pageIndex)
      .set('pageSize', req.pageSize);

    if (req.dealerCode) {
      params = params.set('dealerCode', req.dealerCode);
    }
    return params;
  }

  getReport(req: LineOrderReportRequest): Observable<LineOrderReportPagedResponse> {
    return this.http.get<LineOrderReportPagedResponse>(
      `${this.baseUrl}/GetByDealerPaged`,
      { params: this.toParams(req) }
    );
  }

  download(req: LineOrderReportRequest): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download`, {
      params: this.toParams(req),
      responseType: 'blob'
    });
  }
}