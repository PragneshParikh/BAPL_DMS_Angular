import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WarrantyOrderService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertWarrantyOrder(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyOrder/InsertWarrantyOrder`, model);
  }

  updateWarrantyOrder(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/WarrantyOrder/UpdateWarrantyOrder`, model);
  }

  deleteWarrantyOrder(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/WarrantyOrder/DeleteWarrantyOrder/${id}`);
  }

  getWarrantyOrderById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyOrder/GetWarrantyOrderById/${id}`);
  }

  searchWarrantyOrders(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyOrder/SearchWarrantyOrders`, filter);
  }

  getNextOrderNumbers(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyOrder/GetNextOrderNumbers?dealerCode=${dealerCode}`);
  }

  getWarrantyJCClaimById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyOrder/GetWarrantyJCClaimById/${id}`);
  }

  printWarrantyOrder(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyOrder/PrintWarrantyOrder/${id}`, { responseType: 'blob' });
  }
}