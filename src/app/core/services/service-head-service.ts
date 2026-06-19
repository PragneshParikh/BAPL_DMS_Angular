import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServiceHeadService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertServiceHeadMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/ServiceHead/InsertServiceHead`, model);
  }

  updateServiceHeadMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/ServiceHead/UpdateServiceHeadName`, model);
  }

  deleteServiceHeadMaster(serviceHeadId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/ServiceHead/DeleteServiceHead/${serviceHeadId}`);
  }
  getServiceHeadMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ServiceHead/GetAllServiceHead`);
  }
  getServiceHeadExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ServiceHead/GetServiceHeadMasterExcel`, {
      responseType: 'blob'
    });
  }
  
}
