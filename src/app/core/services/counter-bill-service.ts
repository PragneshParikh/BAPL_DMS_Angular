import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CounterBillService {
  private apiUrl = `${environment.apiUrl}/CounterBill`;

  constructor(private http: HttpClient) { }

  saveCounterBill(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, data);
  }
  getAllCounterBills(dealerCode?: string, fromDate?: Date, toDate?: Date, search?: string,dealerFilter?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString());
    }
    if (toDate) {
      params = params.set('toDate', toDate.toISOString());
    }
    if (search) {
      params = params.set('search', search);
    }
    if (dealerFilter) {
      params = params.set('dealerFilter', dealerFilter);
    }
    return this.http.get<any[]>(`${this.apiUrl}/GetAll`, { params });
  }

  getCounterBillById(id: number) {
    return this.http.get(`${environment.apiUrl}/CounterBill/${id}`);
  }

  updateCounterBill(id: number, payload: any) {
    return this.http.put(`${environment.apiUrl}/CounterBill/update?id=${id}`, payload);
  }

  deleteCounterBill(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  downloadCounterBillExcel(dealerCode?: string, dateFrom?: string, dateTo?: string) {
    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }

    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    return this.http.get(
      `${this.apiUrl}/download-counter-bill-excel`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

}
