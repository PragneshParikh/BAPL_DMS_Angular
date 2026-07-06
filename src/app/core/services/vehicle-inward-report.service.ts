import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VehicleInwardReportFilter {
  dealerCode?: string;
  fromDate?: string;
  toDate?: string;
  locationCode?: string;
  invoiceNo?: string;
  chassisNo?: string;
  motorNo?: string;
  batteryNo?: string;
  pageIndex: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleInwardReportService {

  private readonly baseUrl = `${environment.apiUrl}/Report`;

  constructor(private http: HttpClient) {}

  getInwardReport(filter: VehicleInwardReportFilter): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vehicle-inward`, filter);
  }
}