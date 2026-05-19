import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleInwardService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}`);
  }

  getByVehicleStatus(status: boolean, dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/vehicle-inward?dealerCode=${dealerCode}&status=${status}`);
  }

  updateStatusByInvoiceNumber(invoice: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/vehicle-inward/UpdateInvoiceStatus`, `"${invoice}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
