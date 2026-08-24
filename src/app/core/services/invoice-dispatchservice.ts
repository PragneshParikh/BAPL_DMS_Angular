import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceDispatchFilter {
  dealerCode?: string | null;
  locCode?: string | null;
  fromDate?: Date | null;
  toDate?: Date | null;
  pageIndex: number;
  pageSize: number;
}

export interface PagedResult<T> {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  data: T[];
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceDispatchService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  private buildParams(filter: InvoiceDispatchFilter): HttpParams {
    let params = new HttpParams()
      .set('pageIndex', filter.pageIndex)
      .set('pageSize', filter.pageSize);

    if (filter.dealerCode) {
      params = params.set('dealerCode', filter.dealerCode);
    }
    if (filter.locCode) {
      params = params.set('locCode', filter.locCode);
    }
    if (filter.fromDate) {
      params = params.set('fromDate', filter.fromDate.toISOString());
    }
    if (filter.toDate) {
      params = params.set('toDate', filter.toDate.toISOString());
    }

    return params;
  }

  getPartDispatchList(filter: InvoiceDispatchFilter): Observable<PagedResult<any>> {
    return this.httpClient.get<PagedResult<any>>(
      `${this.baseUrl}/InvoiceDispatch/parts`,
      { params: this.buildParams(filter) }
    );
  }

  getVehicleDispatchList(filter: InvoiceDispatchFilter): Observable<PagedResult<any>> {
    return this.httpClient.get<PagedResult<any>>(
      `${this.baseUrl}/InvoiceDispatch/vehicles`,
      { params: this.buildParams(filter) }
    );
  }
}
