import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LotInspectionService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getAllLotInspectionHeaderDetails(search: string = '', dealerCode?: string): Observable<any> {
    let params = new HttpParams().set('search', search ?? '');


    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
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

  getLotinspectedExcel(invoiceNo?: string,
    fromDate?: string,
    toDate?: string): Observable<Blob> {
    debugger
    let params = new HttpParams();

    if (invoiceNo) {
      params = params.set('invoiceNo', invoiceNo);
    }

    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }

    if (toDate) {
      params = params.set('toDate', toDate);
    }
    return this.httpClient.get(
      `${this.baseUrl}/LOTInspection/GetLotinspectedExcel`,
      {
        params,
        responseType: 'blob'
      }
    );
  }
}
