import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServiceTypeService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertServiceTypeMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/ServiceTypeMaster/InsertserviceType`, model);
  }

  updateServiceTypeMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/ServiceTypeMaster/UpdateserviceTypeName`, model);
  }

  deleteServiceTypeMaster(serviceTypeId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/ServiceTypeMaster/DeleteserviceType/${serviceTypeId}`);
  }
  getServiceTypeMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ServiceTypeMaster/GetAllServiceType`);
  }
  getServiceTypeMasterExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ServiceTypeMaster/GetServiceTypeMasterExcel`, {
      responseType: 'blob'
    });
  }
}
