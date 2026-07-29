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

  updatePartInwardDetailByInvoiceNo(data: any) {
    return this.httpClient.put(`${this.baseUrl}/parts-inward/updatebyinvoice`, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  getPendingPartInwardDetailByLocation(locationCode: string): Observable<any> {
    let params = new HttpParams()
      .set('locationCode', locationCode);
    return this.httpClient.get(`${this.baseUrl}/parts-inward/GetPendingPartInwardDetailByLocation`, { params });
  }

  getInwardPartDetailByInvoiceNo(invoiceNo: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/parts-inward/GetInwardPartDetailsByInvoiceNo/${invoiceNo}`);
  }

  getInwardDetailsByDealer(pageIndex: number, pageSize: number, fromDate: Date, toDate: Date, dealerCode: string | null): Observable<any> {
    let params = new HttpParams();

    params = params.set("pageIndex", pageIndex);
    params = params.set("pageSize", pageSize);
    params = params.set("fromDate", fromDate.toISOString());
    params = params.set("toDate", toDate.toISOString());

    if (dealerCode) {
      params = params.set("dealerCode", dealerCode);
    }
    return this.httpClient.get(`${this.baseUrl}/parts-inward/GetPartsInwardDetailsByDealer`, { params });
  }

  getExcelDownload(fromDate: Date, toDate: Date, dealerCode: string | null): Observable<any> {

    let params = new HttpParams();

    params = params.set("fromDate", fromDate.toISOString());
    params = params.set("toDate", toDate.toISOString());

    if (dealerCode) {
      params = params.set("dealerCode", dealerCode);
    }

    return this.httpClient.get(`${this.baseUrl}/parts-inward/DownloadPartsInwardExcel`, { params, responseType: 'blob' });
  }
}