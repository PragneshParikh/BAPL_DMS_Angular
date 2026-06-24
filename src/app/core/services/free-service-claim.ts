import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';

@Injectable({
  providedIn: 'root',
})
export class FreeServiceClaimService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/free-service-claim`);
  }

  getClaimById(id: Number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/free-service-claim/${id}`);
  }

  getPendingApprovalJobCard(dealerCode: string): Observable<any> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set("dealerCode", dealerCode);
    }

    return this.httpClient.get(`${this.baseUrl}/free-service-claim/GetPendingApprovalJobCard`, { params });
  }

  getByDealerCode(dealerCode: string, pageSize: Number, pageIndex: Number): Observable<any> {
    let params = new HttpParams()
      .set("dealerCode", dealerCode)
      .set("pageSize", pageSize.toString())
      .set("pageIndex", pageIndex.toString());

    return this.httpClient.get(`${this.baseUrl}/free-service-claim/GetWarrantyClaimByDealerCode`, { params });
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/free-service-claim`, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/free-service-claim`, data);
  }
}
