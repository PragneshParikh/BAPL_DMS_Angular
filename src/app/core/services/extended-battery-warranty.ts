import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExtendedBatteryWarrantyService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/extended-battery-warranty`);
  }

  getByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/extended-battery-warranty/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/extended-battery-warranty/${id}`);
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/extended-battery-warranty`, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/extended-battery-warranty/${id}`, data);
  }
}