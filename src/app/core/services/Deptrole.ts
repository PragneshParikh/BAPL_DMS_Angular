import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleModel } from '../../ViewModels/RoleModel';
import { RoleMappingModel } from '../../ViewModels/RoleMappingModel';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private baseUrl = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) { }

  // GET all roles from dbo.AspNetRoles
  getRoles(): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(this.baseUrl);
  }

  // GET only the named roles (e.g. ['Sales', 'Service'])
  getRolesByNames(names: string[]): Observable<RoleModel[]> {
    const params = new HttpParams().set('names', names.join(','));
    return this.http.get<RoleModel[]>(this.baseUrl, { params });
  }

  get(): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(this.baseUrl);
  }

  create(role: RoleModel) {
    return this.http.post(this.baseUrl, role);
  }

  update(id: string, role: RoleModel) {
    return this.http.put(`${this.baseUrl}/${id}`, role);
  }

  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Role <-> Category mapping =====

  // create a role in AspNetRoles + map it to a category
  createWithCategory(payload: { name: string; category: string }) {
    return this.http.post(`${this.baseUrl}/with-category`, payload);
  }

  // all role->category mappings (Role Master list)
  getMappings(): Observable<RoleMappingModel[]> {
    return this.http.get<RoleMappingModel[]>(`${this.baseUrl}/mappings`);
  }

  // delete a mapping row by its id
  deleteMapping(id: number) {
    return this.http.delete(`${this.baseUrl}/mappings/${id}`);
  }

  // roles for a given category (used by the employee form on category check)
  getByCategory(category: string): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(`${this.baseUrl}/by-category/${encodeURIComponent(category)}`);
  }
}