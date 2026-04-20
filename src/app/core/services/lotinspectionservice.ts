import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Lotinspectionservice {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getAllLotInspectionHeaderDetails(search: string = ''): Observable<any> {
    let params = new HttpParams().set('search', search ?? '');


    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/LOTInspection/GetAllAcceptedInvoiceList`, { params });
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
