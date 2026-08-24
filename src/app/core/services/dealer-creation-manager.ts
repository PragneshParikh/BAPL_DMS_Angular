import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DealerListModel, DealerListFilter, DealerListPagedResponse, DealerQuickUpdate } from '../../ViewModels/models/DealerListModel';
import { DealerMenuAccessResponse, DealerLocationModel } from '../../ViewModels/models/DealerMenuAccessModel';

@Injectable({ providedIn: 'root' })
export class DealerCreationManagerService {
  private apiUrl = `${environment.apiUrl}/dealer-creation-manager`;

  constructor(private http: HttpClient) { }

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

  unassignRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/assign-role`);
  }

  // Top-level sidebar categories (Master, Process, Reports, Services,
  // Accounts, Utility, Warranty Claim, Stocks, EBW Process, BG Warranty, ...)
  //
  // THIS TAKES ONE OPTIONAL ARGUMENT. It is called with an argument from
  // TWO places:
  //   - dealer-menu-access-page.ts, onAreaChange():
  //       this.dealerService.getAvailableModules(this.selectedArea)
  //   - dealer-creation-manager-list.ts, onLocationAreaChange():
  //       this.dealerService.getAvailableModules(this.locationSelectedArea)
  // A zero-argument version of this method will fail to compile against
  // both of those call sites - do not remove the `area` parameter.
  getAvailableModules(area?: string): Observable<string[]> {
    let params = new HttpParams();
    if (area) params = params.set('area', area);
    return this.http.get<string[]>(`${this.apiUrl}/modules`, { params });
  }

  // Business areas (ShowRoom / WorkShop / Account), a separate dimension
  // from Module above.
  getAvailableAreas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/areas`);
  }

  getMenuAccess(dealerId: number, roleId?: string, module?: string, area?: string): Observable<DealerMenuAccessResponse> {
    let params = new HttpParams();
    if (roleId) params = params.set('roleId', roleId);
    if (module) params = params.set('module', module);
    if (area) params = params.set('area', area);
    return this.http.get<DealerMenuAccessResponse>(`${this.apiUrl}/${dealerId}/menu-access`, { params });
  }

  updateMenuAccess(dealerId: number, roleId: string, grantedSubMenuIds: number[], module: string, area?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${dealerId}/menu-access`, { roleId, grantedSubMenuIds, module, area });
  }

  getLocations(dealerId: number): Observable<DealerLocationModel[]> {
    return this.http.get<DealerLocationModel[]>(`${this.apiUrl}/${dealerId}/locations`);
  }

  updateLocationsStatus(dealerId: number, locationIds: number[], isActive: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${dealerId}/locations/bulk-status`, { locationIds, isActive });
  }
}