import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehiclePoListService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPOList(dealerCode?:string): Observable<any[]> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    return this.http.get<any[]>(`${this.baseUrl}/PurchaseOrder/Polist`,
      {
      params 
    
    });
  }

  downloadPurchaseOrderExcel(filters: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/PurchaseOrder/DownloadPurchaseOrderExcel`, {
      params: filters,
      responseType: 'blob'
    });
  }
}
