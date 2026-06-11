import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModewiseServiceScheduleService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  getServiceHeadmodelwise(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/ModelwiseServiceSchedule/GetServiceHead`);
  }

  saveServiceSchedule(payload: any): Observable<any> {
    return this.httpClient.post<any[]>(`${this.baseUrl}/ModelwiseServiceSchedule/SavemodelwiseserviceSchedule`, payload)
  }

  getModelwiseservicescheduleList(oemModelId?: number, effectiveDate?: string): Observable<any> {
    let params: any = {};

    if (oemModelId) params.oemModelId = oemModelId;
    if (effectiveDate) params.effectiveDate = effectiveDate;
    return this.httpClient.get<any[]>(`${this.baseUrl}/ModelwiseServiceSchedule/GetmodelwiseserviceSchedulelist`, { params });
  }

  getBymodelwiseserviceschedule(oemModelId: number): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/ModelwiseServiceSchedule/GetByModelwiseserviceschedule?oemModelId=${oemModelId}`)
  }

  getBymodelwisemodelvarient(oemModelId: number): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/ModelwiseServiceSchedule/GetOemModelbasedModelVarientList?oemModelId=${oemModelId}`)
  }
}
