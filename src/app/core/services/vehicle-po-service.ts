import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehiclePoService {
  protected baseUrl = environment.apiUrl;
  protected erpBaseUrl = environment.ERPApiUrl;

  constructor(private http: HttpClient) { }

  createPurchaseOrder(poModel: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PurchaseOrder/create`, poModel);
  }

  sendToERP(poModel: any): Observable<any> {
    return this.http.post<any>(`${this.erpBaseUrl}/BAPLSOHeader`, JSON.stringify(poModel), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getPOByNumber(poNumber: string): Observable<any> {
    const params = new HttpParams().set('code', poNumber);
    return this.http.get<any>(`${this.baseUrl}/PurchaseOrder/list`, { params });
  }

  updatePO(poModel: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/PurchaseOrder/update`, poModel);
  }

  updatePOStatus(poNumber: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/PurchaseOrder/updatePOStatus`, { poNumber, status });
  }

  deletePOItems(poNumber: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/PurchaseOrder/items/${poNumber}`);
  }

  getSubsidyValue(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/PurchaseOrder/subsidy`);
  }
}
