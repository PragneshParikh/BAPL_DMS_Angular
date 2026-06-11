import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class KitCreationService {

  private baseURL = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getKits(): Observable<any> {
    return this.httpClient.get(`${this.baseURL}/kit-header`);
  }

  getKitByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseURL}/kit-header/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getKitById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseURL}/kit-header/${id}`);
  }

  save(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseURL}/kit-header`, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseURL}/kit-header`, data);
  }

  downloadExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseURL}/kit-header/downloadExcel`, { responseType: 'blob' });
  }

}
