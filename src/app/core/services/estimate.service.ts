import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';

export interface JobTypeDropdownItem {
  id: number;
  jobTypeName: string;
}

export interface PartSearchResult {
  itemCode: string;
  itemDescription: string;
  rate: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;

  // Linked labour auto-fetched alongside this part (from
  // PartWiseLabourMaster), if the part has one associated.
  linkedLabourCode?: string;
  linkedLabourDescription?: string;
  linkedLabourRate?: number;
  linkedLabourCgstPercent?: number;
  linkedLabourSgstPercent?: number;
  linkedLabourIgstPercent?: number;
}

export interface LabourSearchResult {
  labourCode: string;
  labourDescription: string;
  rate: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
}

export interface EstimateFilterModel {
  dealerCode?: string;
  chassisNo?: string;
  estimationNo?: string;
  fromDate?: string;
  toDate?: string;
  pageIndex: number;
  pageSize: number;
}

export interface EstimateListRow {
  id: number;
  estimationNo: string;
  estimateDate: string;
  chassisNo: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  customerState: string;
  jobTypeId?: number;
  jobTypeName?: string;
  dealerCode: string;
  status: string;
  createdDate: string;
  insuranceId?: number;
  insDescription?: string;
  surveyorName?: string;
  contactNumber?: string;
  policyNo?: string;
  insValidTill?: string;
  zeroDepo?: boolean;
  jobCardNo?: number;
  jobCardCreatedDate?: string;
}

export interface EstimatePagedResponse {
  data: EstimateListRow[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}
export interface EstimateDetailLine {
  id: number;
  itemType: string;
  itemCode: string;
  itemDescription: string;
  qty: number;
  rate: number;
  discountPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  amount: number;
}

export interface EstimateDetailResponse {
  id: number;
  estimationNo: string;
  estimateDate: string;
  chassisNo: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerPin: string;
  customerEmail: string;
  customerCity: string;
  customerState: string;
  kms?: number;
  jobTypeId?: number;
  jobTypeName?: string;
  dealerCode: string;
  status: string;
  createdDate: string;
  details: EstimateDetailLine[];

  // ── Insurance ──
  // Populated once the backend adds matching columns/mapping (see note in
  // EstimateRepo / EstimateCreateViewModel). Optional so existing responses
  // that don't include these fields still type-check.
  insuranceId?: number;
  insDescription?: string;
  surveyorName?: string;
  contactNumber?: string;
  policyNo?: string;
  insValidTill?: string;
  zeroDepo?: boolean;
}
@Injectable({ providedIn: 'root' })
export class EstimateService {
  private apiUrl = `${environment.apiUrl}/Estimate`;

  constructor(private http: HttpClient) {}

  getNextEstimationNo(): Observable<string> {
    return this.http.get(`${this.apiUrl}/getNextEstimationNo`, { responseType: 'text' });
  }

  getJobTypes(): Observable<JobTypeDropdownItem[]> {
    return this.http.get<JobTypeDropdownItem[]>(`${this.apiUrl}/job-types`);
  }

  create(model: any): Observable<number> {
    return this.http.post<number>(this.apiUrl, model);
  }


searchParts(query: string, maxResults: number = 20): Observable<PartSearchResult[]> {
  return this.http.get<PartSearchResult[]>(`${this.apiUrl}/search-parts`, {
    params: { query: query || '', maxResults: maxResults.toString() }
  });
}

searchLabour(query: string, maxResults: number = 20): Observable<LabourSearchResult[]> {
  return this.http.get<LabourSearchResult[]>(`${this.apiUrl}/search-labour`, {
    params: { query: query || '', maxResults: maxResults.toString() }
  });
}

getAll(filter: EstimateFilterModel): Observable<EstimatePagedResponse> {
  let params = new HttpParams()
    .set('pageIndex', filter.pageIndex.toString())
    .set('pageSize', filter.pageSize.toString());

  if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);
  if (filter.chassisNo) params = params.set('chassisNo', filter.chassisNo);
  if (filter.estimationNo) params = params.set('estimationNo', filter.estimationNo);
  if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
  if (filter.toDate) params = params.set('toDate', filter.toDate);

  return this.http.get<EstimatePagedResponse>(this.apiUrl, { params });
}

getEstimationNumbers(dealerCode?: string): Observable<string[]> {
  let params = new HttpParams();
  if (dealerCode) params = params.set('dealerCode', dealerCode);
  return this.http.get<string[]>(`${this.apiUrl}/estimation-numbers`, { params });
}

getById(id: number): Observable<EstimateDetailResponse> {
  return this.http.get<EstimateDetailResponse>(`${this.apiUrl}/${id}`);
}

update(id: number, model: any): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${id}`, model);
}

downloadPdf(id: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' });
}
}