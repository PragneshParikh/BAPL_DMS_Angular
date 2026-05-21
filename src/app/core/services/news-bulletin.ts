import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NewsBulletinService {

  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/news-bulletin`);
  }
  // getByDate(date: string): Observable<any> {
  //   return this.httpClient.get(`${this.baseUrl}/news-bulletin/GetByDate?date=${date}`);
  // }

  getById(Id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/news-bulletin/${Id}`);
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/news-bulletin`, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/news-bulletin`, data);
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/news-bulletin/${id}`);
  }
}
