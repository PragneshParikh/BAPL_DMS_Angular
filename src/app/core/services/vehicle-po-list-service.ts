import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehiclePoListService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPOList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/PurchaseOrder/Polist`);
  }

  downloadPurchaseOrderExcel(filters: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/PurchaseOrder/DownloadPurchaseOrderExcel`, {
      params: filters,
      responseType: 'blob'
    });
  }
}
