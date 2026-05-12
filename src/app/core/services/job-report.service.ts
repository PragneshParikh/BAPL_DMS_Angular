// src/app/core/services/job-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable , map} from 'rxjs';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================

export interface JobReportViewModel {
  srNo: number;
  invoiceNo: number;
  invoiceDate: Date | string;
  jobNo: number;
  partyName: string;
  partyMobileNo: string;
  regNo: string;
  mechanicName: string;
  invoiceType: string;
  invoiceMode: string;
  sparesAmount: number;
  acsrAmount: number;
  oilAmount: number;
  labourAmount: number;
  outsideWorkAmount: number;
  taxableAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  chassisNo: string;
  dealerCode: string;
  serviceLocation: string;
  jobType: string;
  serviceHead: string;
  serviceType: string;
  jobInDate: Date | null;
  estimatedDeliveryDate: Date | null;
}

export interface JobReportPagedResponse {
  data: JobReportViewModel[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalSpares: number;
  totalAcsr: number;
  totalOil: number;
  totalLabour: number;
  totalOutsideWork: number;
  totalTaxable: number;
  totalSGST: number;
  totalCGST: number;
  grandTotal: number;
}

export interface JobReportFilterModel {
  dealerCode?: string;
  fromDate?: Date;
  toDate?: Date;
  serviceLocation?: string;
  jobNo?: number | null;
  partyName?: string;
  chassisNo?: string;
  regNo?: string;
  pageIndex: number;
  pageSize: number;
}

export interface DealerWiseJobReportSummary {
  dealerCode: string;
  dealerName: string;
  totalJobs: number;
  totalSpares: number;
  totalLabour: number;
  totalTaxable: number;
  totalSGST: number;
  totalCGST: number;
  grandTotal: number;
  jobDetails: JobReportViewModel[];
}

export interface JobReportSummaryStats {
  totalJobs: number;
  totalRevenue: number;
  totalTaxes: number;
  completedJobs: number;
  pendingJobs: number;
  averageJobValue: number;
}

export interface DealerDropdownItem {
  dealerCode: string;
  dealerName: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class JobReportService {

  private apiUrl = `${environment.apiUrl}/Report`;

  constructor(private http: HttpClient) {}

  /** POST /api/Report/job-card — paginated + filtered report */
  getJobReportAsync(filter: JobReportFilterModel): Observable<JobReportPagedResponse> {
    return this.http.post<JobReportPagedResponse>(
      `${this.apiUrl}/job-card`,
      filter
    );
  }
  getDealerDropdown(): Observable<DealerDropdownItem[]> {
    return this.http.get<{ success: boolean; data: DealerDropdownItem[] }>(
      `${environment.apiUrl}/DealerMaster/getDealerDropdown`
    ).pipe(
      map(response => response.data)
    );
  }
  /** GET /api/Report/job-card/dealer-wise — dealer summary */
  getDealerWiseJobReportAsync(
    dealerCode?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<DealerWiseJobReportSummary[]> {
    let params = new HttpParams();
    if (dealerCode) params = params.set('dealerCode', dealerCode);
    if (fromDate)   params = params.set('fromDate', fromDate.toISOString());
    if (toDate)     params = params.set('toDate', toDate.toISOString());

    return this.http.get<DealerWiseJobReportSummary[]>(
      `${this.apiUrl}/job-card/dealer-wise`,
      { params }
    );
  }

  /** GET /api/Report/job-card/export */
  exportJobCardReport(
    dealerCode: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<JobReportViewModel[]> {
    let params = new HttpParams().set('dealerCode', dealerCode);
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate)   params = params.set('toDate', toDate.toISOString());

    return this.http.get<JobReportViewModel[]>(
      `${this.apiUrl}/job-card/export`,
      { params }
    );
  }

  /** GET /api/Report/job-card/summary-stats */
  getJobReportSummaryStats(
    dealerCode: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<JobReportSummaryStats> {
    let params = new HttpParams().set('dealerCode', dealerCode);
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate)   params = params.set('toDate', toDate.toISOString());

    return this.http.get<JobReportSummaryStats>(
      `${this.apiUrl}/job-card/summary-stats`,
      { params }
    );
  }
}