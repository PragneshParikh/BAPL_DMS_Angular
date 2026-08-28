import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuRightService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDealers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/menu-rights/dealers`);
  }

  getMenuRights(dealerCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/menu-rights/${dealerCode}`);
  }

  saveMenuRights(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/menu-rights/save`, payload);
  }
}