import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FreeServiceRateService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/free-service-rate`);
  }

  getByOEMModelId(OEMModelId: Number | null): Observable<any> {
    let params = new HttpParams();

    if (OEMModelId) {
      params = params.set("OEMModelId", OEMModelId.toString());
    }
    return this.httpClient.get(`${this.baseUrl}/free-service-rate/GetByOEMMOdelId`);
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/free-service-rate`, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/free-service-rate`, data);
  }

}
