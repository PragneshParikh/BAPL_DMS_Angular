import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

}