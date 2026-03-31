import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LotInspectionDetailsservice {

  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) {

  }
  //  Insert Header (Invoice Accept)
  acceptInvoiceHeader(invoiceNo: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LOTInspection/AcceptInvoices/`, invoiceNo);
  }

  // Insert invoice details
  InsertDetailsByInvoice(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LotInspectionDetails/InsertDetailsByInvoice`, data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update invoice details
  updateLotInspectedDetails(formData: any): Observable<any> {
    debugger
    return this.httpClient.put(
      `${this.baseUrl}/LOTInspection/UpdateLotInspectedDetails`,
      formData
    );
  }

  // get all details based on invoice no
  getAllDetailsByInvoice(invoiceNo: string = ''): Observable<any> {
    //debugger
    let params = new HttpParams().set('invoiceNo', invoiceNo ?? '');

    if (invoiceNo && invoiceNo.trim() !== '') {
      params = params.set('invoiceNo', invoiceNo.trim());
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/LotInspectionDetails/GetAllDetailsByInvoice`, { params });
  }

}
