import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationMasterService {

  private apiUrl = `${environment.apiUrl}/LocationMaster/GetAllLocationMaster`;
  private apiUrldrp = `${environment.apiUrl}/LocationMaster/GetLocationByDealerCode`;
  private dealerUrl = `${environment.apiUrl}/DealerMaster/GetDealerDropdown`;
  private locationmasterexcelUrl = `${environment.apiUrl}/LocationMaster/DownloadLocationMasterExcel`;

  constructor(private http: HttpClient) { }

  getAllLocationMaster(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getDealerDropdown(): Observable<any> {
    return this.http.get<any>(this.dealerUrl);
  }

  downloadLocationMasterExcel(): Observable<Blob> {
    return this.http.get(this.locationmasterexcelUrl, { responseType: 'blob' });
  }

  getLocationByDealerCode(dealerCode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrldrp}/${dealerCode}`);
  }
}