// src\app\core\services\prefix.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PrefixService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get() {
    return this.httpClient.get(`${this.baseUrl}/prefix`);
  }

  getPrefixByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/prefix/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getByDealerCode(dealerCode: string) {
    return this.httpClient.get(`${this.baseUrl}/prefix/${dealerCode}`);
  }

  saveSequence(sequence: any) {
    return this.httpClient.post(`${this.baseUrl}/prefix`, sequence);
  }

  saveSequenceForDealers(sequence: any) {
    return this.httpClient.post(`${this.baseUrl}/prefix/AddPrefixForDealers`, sequence);
  }

  getPrefixByDealerByModule(dealerCode: string, module: string): Observable<string> {
    return this.httpClient.get(`${this.baseUrl}/prefix/${dealerCode}/modules/${module}`, { responseType: 'text' });
  }

  downloadExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/prefix/downloadExcel`, { responseType: 'blob' });
  }

  getById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/prefix/byId/${id}`);
  }

  updatePrefix(id: number, model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/prefix/${id}`, model);
  }

  deletePrefix(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/prefix/${id}`);
  }

  checkDuplicate(dealerCode: string, moduleName: string, year: string, prefix: string, billingType?: number, excludeId?: number): Observable<boolean> {
    let params: any = { dealerCode, moduleName, year, prefix };
    if (billingType != null) params.billingType = billingType;
    if (excludeId) params.excludeId = excludeId;
    return this.httpClient.get<boolean>(`${this.baseUrl}/prefix/checkDuplicate`, { params });
  }

  getPrefixByDealerModuleBillingType(dealerCode: string, module: string, billingType: number): Observable<string> {
    return this.httpClient.get(`${this.baseUrl}/prefix/${dealerCode}/modules/${module}/billingType/${billingType}`, { responseType: 'text' });
  }

  updateNextNumberByDealerModuleBillingType(dealerCode: string, module: string, billingType: number): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/prefix/${dealerCode}/modules/${module}/billingType/${billingType}`, null);
  }

  getPrefixByPagedByDealer(searchTerm: string = null, pageIndex: number, pageSize: number, dealerCode: string | null): Observable<any> {
    let params = new HttpParams();

    params = params.set('pageIndex', pageIndex);
    params = params.set('pageSize', pageSize);

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    if (dealerCode) {
      params = params.set("dealerCode", dealerCode)
    }

    return this.httpClient.get(`${this.baseUrl}/prefix/GetPrefixByPagedByDealer`, { params });
  }
}
