import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Lotinspectionservice {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) {

  }
  //  Insert Header (Invoice Accept)
  acceptInvoiceHeader(invoiceNo: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LOTInspection/AcceptInvoices`, `"${invoiceNo}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert invoice details
  InsertDetailsByInvoice(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LotInspectionDetails/InsertDetailsByInvoice`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
