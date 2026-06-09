import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationMasterService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllLocationMaster(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/LocationMaster/GetAllLocationMaster`);
  }

  getDealerDropdown(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/DealerMaster/GetDealerDropdown`);
  }

  downloadLocationMasterExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/LocationMaster/DownloadLocationMasterExcel`, { responseType: 'blob' });
  }

  getLocationByDealerCode(dealerCode: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/LocationMaster/GetLocationByDealerCode/${dealerCode}`);
  }

  getLocationByDealerCodeAndAreaId(dealerCode: string, areaId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/LocationMaster/GetLocationByDealerByAreaId?dealerCode=${dealerCode}&areaId=${areaId}`);
  }

  getLocationList(dealerCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/LocationMaster/GetLocationTypeWiseNameByDealerCode?dealerCode=${dealerCode}`);
  }

}