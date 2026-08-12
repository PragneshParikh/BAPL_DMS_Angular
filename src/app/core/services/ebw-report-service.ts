//BAPL_DMS_Angular\src\app\core\services\ebw-report-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EbwReportService {
  private baseUrl = `${environment.apiUrl}/EbwReport`;
  private dispatchUrl = `${environment.apiUrl.replace('/api', '')}/api/dispatch`;

  constructor(private http: HttpClient) {}

  getEbwReport(filter: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    searchTerm?: string;
  }) {
    let params = new HttpParams();
    if (filter.dateFrom) params = params.set('DateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('DateTo', filter.dateTo);
    if (filter.status) params = params.set('Status', filter.status);
    if (filter.searchTerm) params = params.set('SearchTerm', filter.searchTerm);

    return this.http.get<{ data: any[] }>(this.baseUrl, { params });
  }

  getEbwNotifications() {
    return this.http.get<{ data: any[] }>(`${this.dispatchUrl}/ebw-notifications`);
  }

  // getSerialsByItemCode(itemCode: string) {
  //   return this.http.get<{ data: string[] }>(`${this.dispatchUrl}/serials-by-itemcode/${itemCode}`);
  // }

  getSerialsByItemCode(itemCode: string, excludeInvoiceId?: number) {
    const params = excludeInvoiceId ? `?excludeInvoiceId=${excludeInvoiceId}` : '';
    return this.http.get<{ data: string[] }>(`${this.dispatchUrl}/serials-by-itemcode/${itemCode}${params}`);
  }

  getDispatchBySerialNo(serialNo: string) {
    return this.http.get<{ data: any }>(`${this.dispatchUrl}/by-serialno/${serialNo}`);
  }

  getWarrantyDispatchByItemCodes(itemCodes: string[]) {
    return this.http.post<{ data: any[] }>(`${this.dispatchUrl}/by-itemcodes`, itemCodes);
  }

  // REMOVED — this line didn't belong here at all:
  // getLatestByPartNo(partNo: string): Observable<any> {
  //   return this.httpClient.get(`${this.baseUrl}/parts-inward/latest-by-partno/${partNo}`);
  // }
}