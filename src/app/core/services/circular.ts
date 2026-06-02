import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CircularService {

  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/circular`);
  }
  // getByDate(date: string): Observable<any> {
  //   return this.httpClient.get(`${this.baseUrl}/circular/GetByDate?date=${date}`);
  // }

  getById(Id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/circular/${Id}`);
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/circular`, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/circular`, data);
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/circular/${id}`);
  }
}
