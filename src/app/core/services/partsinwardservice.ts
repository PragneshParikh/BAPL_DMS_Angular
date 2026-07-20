import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PartsInwardService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getPendingNotificationByDealer(dealerCode: string) {
    return this.httpClient.get(`${this.baseUrl}/parts-inward/notificationsbydealer/${dealerCode}`);
  }

  update(invoiceNumber: any) {
    return this.httpClient.put(`${this.baseUrl}/parts-inward/updatebyinvoice`, JSON.stringify(invoiceNumber), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  getPendingPartInwardDetailByLocation(locationCode: string): Observable<any> {
    let params = new HttpParams()
      .set('locationCode', locationCode);
    return this.httpClient.get(`${this.baseUrl}/part-inward/GetPendingPartInwardDetailByLocation`, { params });
  }
}
