// src/app/core/services/vehicle-sale-report.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VehicleSaleReportViewModel {
  srNo: number;

  modelCode: string;
  modelDescription: string;
  oemModelName: string;
  vehicleGroup: string;

  colorCode: string;

  chasisNo: string;
  regNo: string;

  dealerCode: string;
  dealerName: string;
  dealerCity: string;
  dealerState: string;

  location: string;
  locCode: string;
  locCity: string;

  name: string;
  address1: string;
  address2: string;

  customerState: string;
  customerCity: string;

  pin: string;
  email: string;
  mobileNo: string;

  type: string;

  bookingId: string;

  dispatchDate: Date | string;
  saleDate: Date | string;

  invoiceNo: string;

  billType: string;

  financeBy: string;

  financerCode: string;

  financerCategory: string;

  executiveName: string;

  prospectName: string;

  prospectMobNo: string;

  motorNumber: string;

  batteryNo: string;
  batteryNo2: string;
  batteryNo3: string;
  batteryNo4: string;
  batteryNo5: string;
  batteryNo6: string;

  batteryCapacity: string;

  subsidyAmount: number;

  fameIIRequired: boolean;

  totalAmount: number;

  billDate: Date | string;
}

export interface DealerDropdownItem {
  dealerCode: string;
  dealerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleSaleReportService {

  private apiUrl = `${environment.apiUrl}/Report`;

  constructor(private http: HttpClient) {}

  getVehicleSaleReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<VehicleSaleReportViewModel[]> {

    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    if (fromDate) {
      params = params.set(
        'fromDate',
        fromDate.toISOString()
      );
    }

    if (toDate) {
      params = params.set(
        'toDate',
        toDate.toISOString()
      );
    }

    return this.http.get<VehicleSaleReportViewModel[]>(
      `${this.apiUrl}/vehicle-sale`,
      { params }
    );
  }

  getDealerDropdown(): Observable<DealerDropdownItem[]> {
    return this.http
      .get<{ success: boolean; data: DealerDropdownItem[] }>(
        `${environment.apiUrl}/DealerMaster/getDealerDropdown`
      )
      .pipe(
        map(response => response.data)
      );
  }
}