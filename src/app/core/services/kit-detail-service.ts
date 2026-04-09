import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KitDetailService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  getKitDetailsByKitHeaderId(headerId): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/kit-details/${headerId}`);
  }

  getKitDetailsByPaged(headerId: number = 0, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/kit-details/paged?headerId=${headerId}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  saveKitDetails(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/kit-details`, data);
  }

  updateKitDetails(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/kit-details`, data);
  }
}
