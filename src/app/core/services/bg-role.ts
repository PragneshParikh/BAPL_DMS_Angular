import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BgRoleMappingModel } from '../../ViewModels/models/BgRoleMappingModel';

@Injectable({ providedIn: 'root' })
export class BgRoleService {
  private apiUrl = `${environment.apiUrl}/bg-role`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getByCategory(category: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-category/${encodeURIComponent(category)}`);
  }

  getMappings(): Observable<BgRoleMappingModel[]> {
    return this.http.get<BgRoleMappingModel[]>(`${this.apiUrl}/mappings`);
  }

  createWithCategory(payload: { name: string; category?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/with-category`, payload);
  }

  updateMapping(id: number, name: string, category?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/mappings/${id}`, { name, category });
  }

  deleteMapping(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mappings/${id}`);
  }
}