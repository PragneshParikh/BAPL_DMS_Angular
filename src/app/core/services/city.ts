import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CityService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/city`);
  }

    getAllWithState(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/city/CitiesWithStateName`);
  }

    getById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/city/${id}`);
  }

 
  create(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/city`, data);
  }

   update(id: number, data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/city/${id}`, data);
  }

   downloadExcel() {
    return this.httpClient.get(
      `${this.baseUrl}/city/download`,
      { responseType: 'blob' }
    );
  }
  
}
