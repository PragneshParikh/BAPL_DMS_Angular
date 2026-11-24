// src/app/components/b2b-jobcard/services/b2b-jobcard.service.ts
// B2B Job Card (24.11.2026) - every call of the B2B module goes through here. API: DMSBAPLAPI
// DMS_BAPL/Controllers/B2BJobCardController.cs (api/b2b-jobcard) -> JobCardScanner database.
// The token is added by the existing auth interceptor.
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  B2BComplaint, B2BDealer, B2BIdName, B2BJobCardCreateRequest, B2BJobCardDetail, B2BJobCardFilter, B2BJobCardListRow,
  B2BJobCardUpdateRequest, B2BMasters, B2BPaged, B2BPhoto, B2BPriority, B2BSaveResult, B2BStaffLists, B2BVehicleCard, B2BVehicleSuggestResult, B2BWorkshop
} from '../models/b2b-jobcard.model';

@Injectable({ providedIn: 'root' })
export class B2BJobcardService {
  private readonly baseUrl = `${environment.apiUrl}/b2b-jobcard`;

  constructor(private http: HttpClient) {}

  private params(values: Record<string, any>): HttpParams {
    let p = new HttpParams();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== null && v !== undefined && String(v).trim() !== '') p = p.set(k, String(v).trim());
    });
    return p;
  }

  ping(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ping`);
  }

  /** Admin / SuperAdmin: JobCardScanner dealers linked to a DMS dealer code */
  getDealers(): Observable<B2BDealer[]> {
    return this.http.get<B2BDealer[]>(`${this.baseUrl}/dealers`);
  }

  /** Service Menu rows (Job Type / Service Head / Priority), complaints and the dealer's workshops in one call */
  getMasters(dealerCode?: string | null): Observable<B2BMasters> {
    return this.http.get<B2BMasters>(`${this.baseUrl}/masters`, { params: this.params({ dealerCode }) });
  }

  getJobTypes(): Observable<B2BIdName[]> {
    return this.http.get<B2BIdName[]>(`${this.baseUrl}/job-types`);
  }

  getServiceHeads(jobTypeId: number): Observable<B2BIdName[]> {
    return this.http.get<B2BIdName[]>(`${this.baseUrl}/service-heads`, { params: this.params({ jobTypeId }) });
  }

  getPriorities(jobTypeId: number, serviceHeadId: number): Observable<B2BPriority[]> {
    return this.http.get<B2BPriority[]>(`${this.baseUrl}/priorities`, { params: this.params({ jobTypeId, serviceHeadId }) });
  }

  getWorkshops(dealerCode?: string | null): Observable<B2BWorkshop[]> {
    return this.http.get<B2BWorkshop[]>(`${this.baseUrl}/workshops`, { params: this.params({ dealerCode }) });
  }

  /** Supervisor/Advisor + Technician dropdowns of the dealer's workshop (JobCardScanner Users / Technicians) */
  getStaff(dealerCode: string | null | undefined, locationCode: string | null | undefined): Observable<B2BStaffLists> {
    return this.http.get<B2BStaffLists>(`${this.baseUrl}/staff`, { params: this.params({ dealerCode, locationCode }) });
  }

  getComplaints(): Observable<B2BComplaint[]> {
    return this.http.get<B2BComplaint[]>(`${this.baseUrl}/complaints`);
  }

  /** from 2 characters; the caller's dealer first, every dealer when nothing matches there (result.scope = 'all') */
  suggestVehicles(term: string, dealerCode?: string | null): Observable<B2BVehicleSuggestResult> {
    return this.http.get<B2BVehicleSuggestResult>(`${this.baseUrl}/vehicle-suggest`, { params: this.params({ term, dealerCode }) });
  }

  /** check-in photos (blob URLs already uploaded with JobcardPhotoService.uploadAll) */
  addPhotos(id: string, photos: { fileName: string; blobUrl: string; contentType: string; fileSize: number; caption?: string | null }[]): Observable<B2BPhoto[]> {
    return this.http.post<B2BPhoto[]>(`${this.baseUrl}/${id}/photos`, { photos });
  }

  /** vehicle + customer + full service card history (JobCardScanner job cards of the chassis, every dealer) */
  getVehicle(value: string, dealerCode?: string | null): Observable<B2BVehicleCard> {
    return this.http.get<B2BVehicleCard>(`${this.baseUrl}/vehicle`, { params: this.params({ value, dealerCode }) });
  }

  getList(filter: B2BJobCardFilter): Observable<B2BPaged<B2BJobCardListRow>> {
    return this.http.get<B2BPaged<B2BJobCardListRow>>(this.baseUrl, { params: this.params(filter as any) });
  }

  getById(id: string): Observable<B2BJobCardDetail> {
    return this.http.get<B2BJobCardDetail>(`${this.baseUrl}/${id}`);
  }

  create(req: B2BJobCardCreateRequest): Observable<B2BSaveResult> {
    return this.http.post<B2BSaveResult>(this.baseUrl, req);
  }

  update(id: string, req: B2BJobCardUpdateRequest): Observable<B2BSaveResult> {
    return this.http.put<B2BSaveResult>(`${this.baseUrl}/${id}`, req);
  }

  /** the API's { message } text, or a plain fallback */
  static errorText(err: any, fallback = 'Something went wrong. Please try again.'): string {
    const e = err as HttpErrorResponse;
    if (e?.status === 0) return 'Server not reachable. Check the network or that the API is running.';
    if (e?.status === 401) return 'Session expired. Please log in again.';
    const body = e?.error;
    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || body?.title || fallback;
  }
}
