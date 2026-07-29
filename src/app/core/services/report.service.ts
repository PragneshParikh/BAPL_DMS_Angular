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
  UnifiedSaleReportViewModel,
  UnifiedSaleReportFilter,
  UnifiedSaleReportResponse
} from '../../ViewModels/models/UnifiedSaleReportViewModel';

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
  PartDispatchKitReportViewModel

} from '../../ViewModels/models/part-dispatch-kit-report.model';

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
import { Form22SlipViewModel } from '../../ViewModels/Form22SlipViewModel';

import {
  VehicleSaleBillReportViewModel,
  VehicleSaleBillReportFilterModel,
  VehicleSaleBillReportPagedResponse
} from '../../ViewModels/models/sale-bill-report.model';

import {
  ModelWiseSaleCountFilter,
  ModelWiseSalePivotResponse
} from '../../ViewModels/models/model-wise-sale-countModel';

import {
  ModelWiseStockPivotResponse,
  ModelWiseStockCountFilter
} from '../../ViewModels/models/Model wise stock count.model';

import {
  TotalSaleReportDealerWiseFilter,
  TotalSaleReportDealerWiseResponse
} from '../../ViewModels/models/total-sale-reportModel';

import {
  ModelWiseVariantStockPivotResponse,
  ModelWiseVariantStockCountFilter
} from '../../ViewModels/models/Model wise variant stock count.model';

import { D2DReportFilter, D2DReportRow, D2DReportResponse } from '../../ViewModels/models/d2d-reportModel';

import {
  MaterialTransferReportFilterModel,
  MaterialTransferReportPagedResponse,
  MaterialTransferReportRow
} from '../../ViewModels/models/material-transferModel';

import {
  RepairBillReportFilterModel,
  RepairBillReportPagedResponse,
  RepairBillReportRow
} from '../../ViewModels/models/repair-billModel';

import {
  ComparisonReportFilterModel,
  ComparisonReportPagedResponse,
  ComparisonReportRow
} from '../../ViewModels/models/Comaprision-reportModel';

import {
  VehicleInwardReportFilterModel,
  VehicleInwardReportResponse,
  VehicleInwardReportViewModel
} from '../../ViewModels/models/vehicle-inward-report.model';
@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = `${environment.apiUrl}/Report`;

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

  // Financier dropdown moved to LedgerMasterService.getFinancierLedgers() —
  // that service already owns every other ledger-master/* call
  // (getCompanyLedgers, getInsuranceLedgers, etc.); duplicating one call here
  // was how the wrong URL crept in. See vehicle-sale-report.ts for the
  // updated call site.

  // =====================================================
  // STOCK REPORT
  // =====================================================

  // FIX: was building the query string by hand (`?dealerCode=${dealerCode}`),
  // which only ever supported one param. Switched to HttpParams — the same
  // pattern every other method in this file already uses — so fromDate/toDate
  // can be added without another one-off string concat. Dates are passed as
  // plain strings straight from <input type="date">, matching
  // getModelWiseSaleCountReport / getTotalSaleReportDealerWise below rather
  // than the Date+toISOString() convention used by getDealerWiseJobReport —
  // stock-report.ts never has a Date object, only the string the date input
  // already gives it.
  getDealerWiseStockReport(
    dealerCode?: string,
    fromDate?: string,
    toDate?: string
  ): Observable<StockReport[]> {
    let params = new HttpParams();

    if (dealerCode) params = params.set('dealerCode', dealerCode);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<StockReport[]>(
      `${this.apiUrl}/dealer-wise`,
      { params }
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
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<JobReportViewModel[]> {
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

    return this.http.get<JobReportViewModel[]>(
      `${this.apiUrl}/job-card/export`,
      { params }
    );
  }

  // =====================================================
  // VEHICLE SALE REPORT
  // =====================================================

  getVehicleSaleReport(
    filter: UnifiedSaleReportFilter
  ): Observable<UnifiedSaleReportViewModel[]> {
    let params = new HttpParams();

    if (filter.dealerCode)
      params = params.set(
        'dealerCode',
        filter.dealerCode
      );

    if (filter.fromDate)
      params = params.set(
        'fromDate',
        filter.fromDate
      );

    if (filter.toDate)
      params = params.set(
        'toDate',
        filter.toDate
      );

    // The vehicle-sale API returns customer fields under different keys
    // (name / type / mobileNo) than the unified model uses, so they're
    // renamed here before the data ever reaches the component.
    return this.http.get<any[]>(
      `${this.apiUrl}/vehicle-sale`,
      { params }
    ).pipe(
      map(rows => (rows || []).map(r => ({
        ...r,
        customerName: r.customerName ?? r.name,
        customerType: r.customerType ?? r.type,
        customerMobile: r.customerMobile ?? r.mobileNo,
      } as UnifiedSaleReportViewModel)))
    );
  }

  // =====================================================
  // TOTAL SALE REPORT (DEALER-WISE MAPPING)
  // =====================================================
  getTotalSaleReportDealerWise(
    filter: TotalSaleReportDealerWiseFilter
  ): Observable<TotalSaleReportDealerWiseResponse> {
    let params = new HttpParams();

    if (filter.dealerCode)
      params = params.set('dealerCode', filter.dealerCode);

    if (filter.fromDate)
      params = params.set('fromDate', filter.fromDate);

    if (filter.toDate)
      params = params.set('toDate', filter.toDate);

    return this.http.get<TotalSaleReportDealerWiseResponse>(
      `${this.apiUrl}/total-sale-dealer-wise`,
      { params }
    );
  }

  getVehicleSaleBillOnlyReport(
    filter: VehicleSaleBillReportFilterModel
  ): Observable<UnifiedSaleReportResponse> {
    return this.http.post<UnifiedSaleReportResponse>(
      `${this.apiUrl}/vehicle-sale-bill-only`,
      filter
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
  getDealerList() {

    return this.http.get<any[]>(
      `${environment.apiUrl}/Report/dealer-list`
    );
  }

  getModelList() {

    return this.http.get<any[]>(
      `${environment.apiUrl}/Report/model-list`
    );
  }
  getModelListByDealer(
    dealerCode: string
  ) {

    return this.http.get<any[]>(
      `${environment.apiUrl}/Report/model-list/${dealerCode}`
    );
  }

  getChassisList() {

    return this.http.get<string[]>(
      `${environment.apiUrl}/Report/chassis-list`
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

  //=====================================================
  //PART DISPATCH KIT REPORT
  //=====================================================

  getPartDispatchKitReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<
    PartDispatchKitReportViewModel[]
  > {

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

    return this.http.get<
      PartDispatchKitReportViewModel[]
    >(
      `${this.apiUrl}/part-dispatch-kit`,
      { params }
    );
  }

  // ======================================
  // PART DISPATCH KIT PO TYPES
  // ======================================

  getPartDispatchKitPOTypeDropdown() {

    return this.http.get<string[]>(
      `${this.apiUrl}/part-dispatch-kit-po-types`
    );
  }

  getForm22(chassisNo: string): Observable<Form22SlipViewModel> {
    const params = new HttpParams().set('chassisNo', chassisNo);

    return this.http.get<Form22SlipViewModel>(
      `${this.apiUrl}/Form22`,
      { params }
    );
  }

  // =====================================================
  // VEHICLE SALE BILL REPORT
  // =====================================================

  getVehicleSaleBillReport(
    filter: UnifiedSaleReportFilter
  ): Observable<UnifiedSaleReportResponse> {
    return this.http.post<UnifiedSaleReportResponse>(
      `${this.apiUrl}/vehicle-sale-bill`,
      filter
    );
  }

  exportVehicleSaleBillReport(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<VehicleSaleBillReportViewModel[]> {
    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString());
    }

    if (toDate) {
      params = params.set('toDate', toDate.toISOString());
    }

    return this.http.get<VehicleSaleBillReportViewModel[]>(
      `${this.apiUrl}/sale-bill/export`,
      { params }
    );
  }

  getSaleTypeDropdown(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/sale-bill/dropdown/sale-type`
    );
  }

  getSaleBillStatusDropdown(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/sale-bill/dropdown/status`
    );
  }

  // getVehicleSaleBillReport(
  //   filter: VehicleSaleBillReportFilterModel
  // ): Observable<VehicleSaleBillReportPagedResponse> {
  //   return this.http.post<VehicleSaleBillReportPagedResponse>(
  //     `${this.apiUrl}/vehicle-sale-bill`,
  //     filter
  //   );
  // }
  getCounterBillPrint(id: number) {
    return this.http.get<any>(`${this.apiUrl}/print/${id}`);
  }

  // =====================================================
  // MODEL WISE SALE REPORT (COUNT-WISE)
  // =====================================================
  getModelWiseSaleCountReport(
    filter: ModelWiseSaleCountFilter
  ): Observable<ModelWiseSalePivotResponse> {
    let params = new HttpParams();

    if (filter.dealerCode)
      params = params.set('dealerCode', filter.dealerCode);

    if (filter.fromDate)
      params = params.set('fromDate', filter.fromDate);

    if (filter.toDate)
      params = params.set('toDate', filter.toDate);

    return this.http.get<ModelWiseSalePivotResponse>(
      `${this.apiUrl}/model-wise-sale-count`,
      { params }
    );
  }

  // =====================================================
  // MODEL-WISE CURRENT STOCK (COUNT-WISE)
  // =====================================================
  getModelWiseStockCountReport(
    filter: ModelWiseStockCountFilter
  ): Observable<ModelWiseStockPivotResponse> {
    let params = new HttpParams();

    if (filter.dealerCode)
      params = params.set('dealerCode', filter.dealerCode);

    if (filter.fromDate)
      params = params.set('fromDate', filter.fromDate);

    if (filter.toDate)
      params = params.set('toDate', filter.toDate);

    return this.http.get<ModelWiseStockPivotResponse>(
      `${this.apiUrl}/model-wise-stock-count`,
      { params }
    );
  }

  // =====================================================
  // MODEL-WISE VARIANT STOCK (COUNT-WISE)
  // =====================================================
  getModelWiseVariantStockCountReport(
    filter: ModelWiseVariantStockCountFilter
  ): Observable<ModelWiseVariantStockPivotResponse> {
    let params = new HttpParams();

    if (filter.dealerCode)
      params = params.set('dealerCode', filter.dealerCode);

    if (filter.fromDate)
      params = params.set('fromDate', filter.fromDate);

    if (filter.toDate)
      params = params.set('toDate', filter.toDate);

    return this.http.get<ModelWiseVariantStockPivotResponse>(
      `${this.apiUrl}/model-wise-variant-stock-count`,
      { params }
    );
  }

  getD2DReport(
    filter: D2DReportFilter
  ): Observable<D2DReportResponse> {
    return this.http.post<D2DReportResponse>(
      `${this.apiUrl}/d2d-report`,
      filter
    );
  }

  exportD2DReport(
    filter: D2DReportFilter
  ): Observable<D2DReportRow[]> {
    return this.http.post<D2DReportRow[]>(
      `${this.apiUrl}/d2d-report/export`,
      filter
    );
  }

  // =====================================================
  // MATERIAL TRANSFER REPORT
  // =====================================================
  getMaterialTransferReport(
    filter: MaterialTransferReportFilterModel
  ): Observable<MaterialTransferReportPagedResponse> {
    return this.http.post<MaterialTransferReportPagedResponse>(
      `${this.apiUrl}/material-transfer`,
      filter
    );
  }

  exportMaterialTransferReport(
    filter: MaterialTransferReportFilterModel
  ): Observable<MaterialTransferReportRow[]> {
    return this.http.post<MaterialTransferReportRow[]>(
      `${this.apiUrl}/material-transfer/export`,
      filter
    );
  }


  // =====================================================
  // REPAIR BILL REPORT
  // =====================================================
  getRepairBillReport(
    filter: RepairBillReportFilterModel
  ): Observable<RepairBillReportPagedResponse> {
    return this.http.post<RepairBillReportPagedResponse>(
      `${this.apiUrl}/repair-bill`,
      filter
    );
  }

  exportRepairBillReport(
    filter: RepairBillReportFilterModel
  ): Observable<RepairBillReportRow[]> {
    return this.http.post<RepairBillReportRow[]>(
      `${this.apiUrl}/repair-bill/export`,
      filter
    );
  }

  // =====================================================
  // COMPARISON REPORT (Performa vs Sale Bill)
  // =====================================================
  getComparisonReport(
    filter: ComparisonReportFilterModel
  ): Observable<ComparisonReportPagedResponse> {
    return this.http.post<ComparisonReportPagedResponse>(
      `${this.apiUrl}/comparison-report`,
      filter
    );
  }

  exportComparisonReport(
    filter: ComparisonReportFilterModel
  ): Observable<ComparisonReportRow[]> {
    return this.http.post<ComparisonReportRow[]>(
      `${this.apiUrl}/comparison-report/export`,
      filter
    );
  }

  // =====================================================
  // VEHICLE INWARD REPORT
  // Path confirmed as "vehicle-inward" (not "vehicle-inward-report") via
  // the existing dedicated VehicleInwardReportService.getInwardReport() call.
  // =====================================================
  getVehicleInwardReport(
    filter: VehicleInwardReportFilterModel
  ): Observable<VehicleInwardReportResponse> {
    return this.http.post<VehicleInwardReportResponse>(
      `${this.apiUrl}/vehicle-inward`,
      filter
    );
  }

  exportVehicleInwardReport(
    filter: VehicleInwardReportFilterModel
  ): Observable<VehicleInwardReportViewModel[]> {
    const exportFilter: VehicleInwardReportFilterModel = {
      ...filter,
      pageIndex: 1,
      pageSize: 100000
    };

    return this.http.post<VehicleInwardReportResponse>(
      `${this.apiUrl}/vehicle-inward`,
      exportFilter
    ).pipe(
      map(res => res.data)
    );
  }

  getPartsStockDetailsByDealer(groupId: number, fromDate: Date, toDate: Date, dealerCode: string | null): Observable<any> {
    let params = new HttpParams();
    params = params.set("groupId", groupId);
    params = params.set("fromDate", fromDate.toISOString());
    params = params.set("toDate", toDate.toISOString());

    if (dealerCode) {
      params = params.set("dealerCode", dealerCode)
    }

    return this.http.get(`${this.apiUrl}/GetPartsStockDetailsByDealer`, { params });
  }

}
