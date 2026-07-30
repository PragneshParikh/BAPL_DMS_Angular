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

  getRoles(): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(this.baseUrl);
  }

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

  createWithCategory(payload: { name: string; category: string }) {
    return this.http.post(`${this.baseUrl}/with-category`, payload);
  }

  getMappings(): Observable<RoleMappingModel[]> {
    return this.http.get<RoleMappingModel[]>(`${this.baseUrl}/mappings`);
  }

  deleteMapping(id: number) {
    return this.http.delete(`${this.baseUrl}/mappings/${id}`);
  }

  updateMapping(id: number, name: string, category: string) {
    return this.http.put(`${this.baseUrl}/mappings/${id}`, { name, category });
  }

  getByCategory(category: string): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(`${this.baseUrl}/by-category/${encodeURIComponent(category)}`);
  }

  getMenuAccess(roleId: string) {
    return this.http.get<any>(`${this.baseUrl}/${roleId}/menu-access`);
  }

  updateMenuAccess(roleId: string, grantedSubMenuIds: number[]) {
    return this.http.put(`${this.baseUrl}/${roleId}/menu-access`, { grantedSubMenuIds });
  }

  getMenuTemplate() {
    return this.http.get<any>(`${this.baseUrl}/menu-template`);
  }

  resolveRoleForItems(category: string, subMenuIds: number[]) {
    return this.http.post<any>(`${this.baseUrl}/resolve-for-items`, { category, subMenuIds });
  }
}