import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WarrantyDispatchService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  searchWarrantyPackingSlips(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyPacking/SearchWarrantyPackingSlips`, filter);
  }
  getPackingSlipById(id: number): Observable<any> {
  return this.httpClient.get(`${this.baseUrl}/WarrantyPacking/GetWarrantyPackingSlipById/${id}`);
  }

  saveWarrantyDispatch(payload: any): Observable<any> {
  return this.httpClient.post(`${this.baseUrl}/WarrantyDispatch/SaveWarrantyDispatch`, payload);
 }

 getWarrantyDispatchById(id: any): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyDispatch/GetWarrantyDispatchById?id=${id}`);
  }

  searchWarrantyDispatch(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyDispatch/SearchWarrantyDispatch`, filter);
  }

  deleteWarrantyDispatch(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/WarrantyDispatch/DeleteWarrantyDispatch/${id}`);
  }
 
}