import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiTrackingService {

  protected baseURL = environment.apiUrl;

  constructor(private httpClient: HttpClient) {

  }

  getApiTracking(): Observable<any> {
    return this.httpClient.get(`${this.baseURL}/api-tracking`);
  }

  getDataByFilter(fromDate: Date, toDate: Date, endPoint: string, status: string): Observable<any> {

    const params = {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      endPoint: endPoint || '',
      status: status || ''
    };

    return this.httpClient.get(`${this.baseURL}/api-tracking/FilterData`, { params });

  }
}
