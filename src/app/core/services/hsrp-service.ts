import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class HsrpService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPendingHSRPOrders(dealerCode?: string, fromDate?: string, toDate?: string): Observable<any> {

    let params = new HttpParams();

    if (dealerCode && dealerCode.trim()) {
      params = params.set('dealerCode', dealerCode);
    }

    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }

    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get(`${this.baseUrl}/HSRP/list`, { params });
  }

  getHSRPInward(dealerCode?: string, fromDate?: string, toDate?: string): Observable<any> {

    let params = new HttpParams();

    if (dealerCode && dealerCode.trim()) {
      params = params.set('dealerCode', dealerCode);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get(`${this.baseUrl}/HSRP/hsrpInwardList`, { params });
  }

  getAllHSRPOrders(dealerCode?: string, fromDate?: string, toDate?: string): Observable<any> {

    let params = new HttpParams();

    if (dealerCode && dealerCode.trim()) {
      params = params.set('dealerCode', dealerCode);
    }

    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }

    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get(`${this.baseUrl}/HSRP/hsrpList`, { params });
  }

  createBulkHSRPOrder(data: any[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/HSRP/create`, data);
}
updateBulkHSRPOrder(data: any[]): Observable<any> {
  return this.http.put(`${this.baseUrl}/HSRP/update`, data);
}

updateBulkHSRPInward(data: any[]): Observable<any> {
  return this.http.put(`${this.baseUrl}/HSRP/updateInward`, data);
}

getHSRPById(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/HSRP/${id}`);
}


}
