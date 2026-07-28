import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LocationDetailModel, UpdateLocationDetail } from '../../ViewModels/models/LocationDetailModel';
import { LocationMenuAccessResponse } from '../../ViewModels/models/LocationMenuAccessModel';


@Injectable({
  providedIn: 'root'
})
export class LocationMasterService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getAllLocationMaster(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/LocationMaster/GetAllLocationMaster`);
  }

  downloadLocationMasterExcel(): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/LocationMaster/DownloadLocationMasterExcel`, { responseType: 'blob' });
  }

  getLocationByDealerCode(dealerCode: string): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/LocationMaster/GetLocationByDealerCode/${dealerCode}`);
  }


  getAllLocationByDealerCode(dealerCode: string): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/LocationMaster/GetAllLocationByDealerCode/${dealerCode}`);
  }
  
  getLocationDropdownByDealerCode(dealerCode: string | null): Observable<any> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }
    return this.httpClient.get<any>(`${this.baseUrl}/LocationMaster/GetLocationDropdownByDealerCode`, { params });
  }

  getLocationByDealerCodeAndAreaId(dealerCode: string, areaId: number): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/LocationMaster/GetLocationByDealerByAreaId?dealerCode=${dealerCode}&areaId=${areaId}`);
  }

  getLocationList(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LocationMaster/GetLocationTypeWiseNameByDealerCode?dealerCode=${dealerCode}`);
  }

  GetDealerPrimaryLocationByAreaId(areaId: number, locCode: string, dealerCode?: string): Observable<any> {
    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    params = params.set('areaId', areaId);
    params = params.set('locCode', locCode);

    return this.httpClient.get(`${this.baseUrl}/LocationMaster/GetDealerPrimaryLocationByAreaId`, { params });
  }

getDetail(id: number): Observable<LocationDetailModel> {
    return this.httpClient.get<LocationDetailModel>(`${this.baseUrl}/bg-role/location/${id}`);
  }

  updateDetail(id: number, model: UpdateLocationDetail): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/bg-role/location/${id}`, model);
  }

  getMenuAccess(id: number, roleId?: string): Observable<LocationMenuAccessResponse> {
    let params = new HttpParams();
    if (roleId) params = params.set('roleId', roleId);
    return this.httpClient.get<LocationMenuAccessResponse>(`${this.baseUrl}/bg-role/location/${id}/menu-access`, { params });
  }

  updateMenuAccess(id: number, roleId: string, grantedSubMenuIds: number[]): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/bg-role/location/${id}/menu-access`, { roleId, grantedSubMenuIds });
  }

}