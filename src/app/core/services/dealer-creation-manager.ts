import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DealerListModel, DealerListFilter, DealerListPagedResponse, DealerQuickUpdate } from '../../ViewModels/models/DealerListModel';

@Injectable({ providedIn: 'root' })
export class DealerCreationManagerService {
  private apiUrl = `${environment.apiUrl}/dealer-creation-manager`;

  constructor(private http: HttpClient) {}

  getAll(filter: DealerListFilter): Observable<DealerListPagedResponse> {
    let params = new HttpParams()
      .set('pageIndex', filter.pageIndex.toString())
      .set('pageSize', filter.pageSize.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.dealerCode) params = params.set('dealerCode', filter.dealerCode);

    return this.http.get<DealerListPagedResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<DealerListModel> {
    return this.http.get<DealerListModel>(`${this.apiUrl}/${id}`);
  }

  update(id: number, model: DealerQuickUpdate): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, model);
  }

  deactivate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  assignRole(id: number, roleId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/assign-role`, { roleId });
  }
}