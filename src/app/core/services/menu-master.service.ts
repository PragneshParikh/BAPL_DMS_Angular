// src\app\core\services\menu-master.service.ts
// Menu Master (MenuMaster + RoleWiseMenuRights) - API MenuMasterAdminController, Admin / SuperAdmin only.
//   GET    {apiUrl}/menu-master               -> MenuAdminRow[]
//   POST   {apiUrl}/menu-master               -> { success, message, data: MenuAdminRow }
//   PUT    {apiUrl}/menu-master/{id}          -> { success, message, data: MenuAdminRow }
//   DELETE {apiUrl}/menu-master/{id}          -> { success, message }
//   GET    {apiUrl}/menu-master/{id}/roles    -> MenuAdminRole[]
//   POST   {apiUrl}/menu-master/{id}/roles    -> { success, message }
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuAdminRow {
  id: number;
  menuName: string;
  parentMenuId: number | null;
  pathName: string | null;
  serialNo: number | null;
  moduleName: string | null;
  roleCount: number;
  childCount: number;
}

export interface MenuAdminRole {
  roleId: string;
  roleName?: string | null;
  permission: number;
}

export interface MenuAdminSave {
  menuName: string;
  parentMenuId: number | null;
  pathName: string | null;
  serialNo: number | null;
  moduleName: string | null;
  roles?: MenuAdminRole[];
}

export interface MenuAdminResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class MenuMasterService {
  private baseUrl = `${environment.apiUrl}/menu-master`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MenuAdminRow[]> {
    return this.http.get<MenuAdminRow[]>(this.baseUrl);
  }

  create(model: MenuAdminSave): Observable<MenuAdminResult<MenuAdminRow>> {
    return this.http.post<MenuAdminResult<MenuAdminRow>>(this.baseUrl, model);
  }

  update(id: number, model: MenuAdminSave): Observable<MenuAdminResult<MenuAdminRow>> {
    return this.http.put<MenuAdminResult<MenuAdminRow>>(`${this.baseUrl}/${id}`, model);
  }

  delete(id: number): Observable<MenuAdminResult> {
    return this.http.delete<MenuAdminResult>(`${this.baseUrl}/${id}`);
  }

  getRoles(subMenuId: number): Observable<MenuAdminRole[]> {
    return this.http.get<MenuAdminRole[]>(`${this.baseUrl}/${subMenuId}/roles`);
  }

  saveRoles(subMenuId: number, roles: MenuAdminRole[]): Observable<MenuAdminResult> {
    return this.http.post<MenuAdminResult>(`${this.baseUrl}/${subMenuId}/roles`, roles);
  }
}
