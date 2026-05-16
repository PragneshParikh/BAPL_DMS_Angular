import { Injectable } from '@angular/core';
import {
  StockReport
} from '../../ViewModels/models/stock-report.model';

import {
  JobReportViewModel,
  JobReportPagedResponse,
  JobReportFilterModel,
  DealerWiseJobReportSummary,
  JobReportSummaryStats,
  DealerDropdownItem
} from '../../ViewModels/models/job-report.model';

import {
  VehicleSaleReportViewModel
} from '../../ViewModels/models/vehicle-sale-report.model';

import {
  VehicleStockFilterModel,
  VehicleStockReportViewModel,
  PagedResponse
} from '../../ViewModels/models/vehicle-stock-report.model';

import {
  POTrackingReportViewModel,
  POTrackingFilterModel,
} from '../../ViewModels/models/po-tracking-report.model';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import { environment }
  from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl =
    `${environment.apiUrl}/Report`;

  constructor(
    private http: HttpClient
  ) { }

  // =====================================================
  // DEALER DROPDOWN
  // =====================================================

  getDealerDropdown():
    Observable<DealerDropdownItem[]> {
    return this.http
      .get<{
        success: boolean;
        data: DealerDropdownItem[];
      }>(
        `${environment.apiUrl}/DealerMaster/getDealerDropdown`
      )
      .pipe(
        map(response => response.data)
      );
  }

  // =====================================================
  // STOCK REPORT
  // =====================================================

  getDealerWiseStockReport():
    Observable<StockReport[]> {
    return this.http.get<StockReport[]>(
      `${this.apiUrl}/dealer-wise`
    );
  }

  getColourWiseStockReport():
    Observable<StockReport[]> {
    return this.http.get<StockReport[]>(
      `${this.apiUrl}/colour-wise`
    );
  }

  // =====================================================
  // JOB REPORT
  // =====================================================

  getJobReport(
    filter: JobReportFilterModel
  ): Observable<JobReportPagedResponse> {
    return this.http.post<JobReportPagedResponse>(
      `${this.apiUrl}/job-card`,
      filter
    );
  }

  getDealerWiseJobReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<DealerWiseJobReportSummary[]> {
    let params = new HttpParams();

    if (dealerCode)
      params = params.set(
        'dealerCode',
        dealerCode
      );

    if (fromDate)
      params = params.set(
        'fromDate',
        fromDate.toISOString()
      );

    if (toDate)
      params = params.set(
        'toDate',
        toDate.toISOString()
      );

    return this.http.get<
      DealerWiseJobReportSummary[]
    >(
      `${this.apiUrl}/job-card/dealer-wise`,
      { params }
    );
  }

  getJobReportSummaryStats(
    dealerCode: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<JobReportSummaryStats> {
    let params =
      new HttpParams()
        .set('dealerCode', dealerCode);

    if (fromDate)
      params = params.set(
        'fromDate',
        fromDate.toISOString()
      );

    if (toDate)
      params = params.set(
        'toDate',
        toDate.toISOString()
      );

    return this.http.get<JobReportSummaryStats>(
      `${this.apiUrl}/job-card/summary-stats`,
      { params }
    );
  }

  exportJobCardReport(
    dealerCode: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<JobReportViewModel[]> {
    let params =
      new HttpParams()
        .set('dealerCode', dealerCode);

    if (fromDate)
      params = params.set(
        'fromDate',
        fromDate.toISOString()
      );

    if (toDate)
      params = params.set(
        'toDate',
        toDate.toISOString()
      );

    return this.http.get<JobReportViewModel[]>(
      `${this.apiUrl}/job-card/export`,
      { params }
    );
  }

  // =====================================================
  // VEHICLE SALE REPORT
  // =====================================================

  getVehicleSaleReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<VehicleSaleReportViewModel[]> {
    let params = new HttpParams();

    if (dealerCode)
      params = params.set(
        'dealerCode',
        dealerCode
      );

    if (fromDate)
      params = params.set(
        'fromDate',
        fromDate.toISOString()
      );

    if (toDate)
      params = params.set(
        'toDate',
        toDate.toISOString()
      );

    return this.http.get<
      VehicleSaleReportViewModel[]
    >(
      `${this.apiUrl}/vehicle-sale`,
      { params }
    );
  }

  // =====================================================
  // VEHICLE STOCK REPORT
  // =====================================================

  getVehicleStockReport(
    filter: VehicleStockFilterModel
  ): Observable<
    PagedResponse<VehicleStockReportViewModel>
  > {
    return this.http.post<
      PagedResponse<VehicleStockReportViewModel>
    >(
      `${this.apiUrl}/current-stock`,
      filter
    );
  }

  // =====================================================
  // PO TRACKING REPORT
  // =====================================================

    getPOTrackingReport(
      filter: POTrackingFilterModel
    ): Observable<
      PagedResponse<POTrackingReportViewModel>
    > {

      return this.http.post<
        PagedResponse<POTrackingReportViewModel>
      >(
        `${this.apiUrl}/po-tracking`,
        filter
      );
    }

    // =====================================================
    // PO TRACKING DROPDOWNS
    // =====================================================

    getPOTypeDropdown(): Observable<string[]> {
      return this.http.get<string[]>(
        `${this.apiUrl}/po-tracking/dropdown/po-type`
      );
    }

    getPOStatusDropdown(): Observable<string[]> {
      return this.http.get<string[]>(
        `${this.apiUrl}/po-tracking/dropdown/po-status`
      );
    }

     // =====================================================
    // PARTS DISPATCH REPORT
    // =====================================================

  getPartsDispatchReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<any[]> {

    let params = new HttpParams();

    if (dealerCode) {

      params = params.set(
        'dealerCode',
        dealerCode
      );
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

    return this.http.get<any[]>(
      `${this.apiUrl}/parts-dispatch`,
      { params }
    );
  }

    getDealerList(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/dealer-list`
    );
  }
}