import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/inventory`);
  }

  getPartsByDealerAndDateRange(formData: any, pageIndex: number, pageSize: number): Observable<any> {

    let params = new HttpParams();

    if (formData.fromDate) {
      params = params.set('fromDate', formData.fromDate);
      params = params.set('toDate', formData.toDate);
    }

    if (formData.dealerCode) {
      params = params.set('dealerCode', formData.dealerCode);
    }

    params = params.set('pageIndex', pageIndex);
    params = params.set('pageSize', pageSize);

    return this.httpClient.get(`${this.baseUrl}/inventory/GetPartsByDealerAndDateRange`, { params });
  }
}
