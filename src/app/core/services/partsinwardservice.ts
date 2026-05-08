import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PartsInwardservice {
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
}
