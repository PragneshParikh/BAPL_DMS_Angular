// core/services/dispatch-master-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DispatchMasterViewModel , DispatchMasterApiResponse, DispatchMasterListViewModel } from '../../ViewModels/models/DispatchMasterViewModel';

@Injectable({ providedIn: 'root' })
export class DispatchMasterService {

  private baseUrl = `${environment.apiUrl}/DispatchMaster`;

  constructor(private http: HttpClient) {}

  search(masterType: string, name: string, pageNumber: number, perPageRecords: number): Observable<DispatchMasterApiResponse> {
    return this.http.post<DispatchMasterApiResponse>(`${this.baseUrl}/Search`, {
      masterType,
      name,
      pageNumber,
      perPageRecords
    });
  }

  getById(id: number): Observable<{ success: boolean; data: DispatchMasterViewModel }> {
    return this.http.get<{ success: boolean; data: DispatchMasterViewModel }>(`${this.baseUrl}/${id}`);
  }

  save(model: DispatchMasterViewModel): Observable<any> {
    return this.http.post(`${this.baseUrl}/Save`, model);
  }

  toggleActive(id: number, isActive: boolean): Observable<any> {
    return this.http.put(`${this.baseUrl}/ToggleActive/${id}?isActive=${isActive}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}