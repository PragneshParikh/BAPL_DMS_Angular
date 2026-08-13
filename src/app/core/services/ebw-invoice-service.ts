//BAPL_DMS_Angular\src\app\core\services\ebw-invoice-service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EbwInvoiceService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  // ⚠️ STUB — backend endpoint /api/ebw-invoice/next-prefix does not exist yet.
  // Needs a NumberSequence row seeded for sequence_name = 'ebw_invoice'
  // and a controller action mirroring how part_inward's prefix is generated.
  getNextPrefixNo(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ebw-invoice/next-prefix?dealerCode=${dealerCode}`);
  }

  // ⚠️ STUB — no existing endpoint returns battery serial no(s) by chassis.
  // Needs a lookup against ChassisBatteryDetail.BatteryNo filtered by ChassisNo.
  getBatterySerialsByChassisNo(chassisNo: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/chassis-details/battery-serials/${chassisNo}`);
  }

  getAll(dealerCode?: string, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (dealerCode) params = params.set('dealerCode', dealerCode);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.httpClient.get(`${this.baseUrl}/ebw-invoice`, { params });
  }

  getById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ebw-invoice/${id}`);
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/ebw-invoice/${id}`);
  }

  getDealerInfo(dealerCode: string) {
    return this.httpClient.get<any>(`${this.baseUrl}/ebw-invoice/dealer-info/${dealerCode}`);
  }

  getReportData(dealerCode?: string, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (dealerCode) params = params.set('dealerCode', dealerCode);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.httpClient.get(`${this.baseUrl}/ebw-invoice/report`, { params });
  }

  // ⚠️ STUB — no EbwInvoiceHeader/Detail table or controller exists yet.
  save(payload: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/ebw-invoice`, payload);
  }
}