// src\app\core\services\role-menu-rights.service.ts
//
// Role-wise Menu Rights (table: RoleWiseMenuRights)
// ---------------------------------------------------------------------------
// API (DMS_BAPL MenuRightsController - same tree/save logic as the dealer
// "Menu Right" screen, keyed directly by RoleId):
//   GET  {apiUrl}/menu-rights/role/{roleId}  -> RoleMenuGroup[] (full MenuMaster
//        tree, grouped by MenuMaster.parentMenuId, permission 0 = not granted)
//   POST {apiUrl}/menu-rights/role/save      -> { success, message }
//        body { roleId, rights: [{ menuId, subMenuId, permission }] }
//        Server re-derives MenuId from MenuMaster and removes duplicate rows.
// Roles list: GET {apiUrl}/role (RoleService.getRoles)
//
// Permission bitmask: View=1, Create=2, Edit=4, Delete=8, Print/Download=16 (31 = all)
// ---------------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoleSubMenuRight {
  subMenuId: number;
  menuName: string;
  pathName?: string | null;
  moduleName?: string | null;
  serialNo?: number | null;
  permission: number;
}

export interface RoleMenuGroup {
  menuId: number;
  menuName: string;
  moduleName?: string | null;
  serialNo?: number | null;
  subMenus: RoleSubMenuRight[];
}

export interface SaveRoleMenuRightsRequest {
  roleId: string;
  rights: { menuId: number; subMenuId: number; permission: number }[];
}

export interface RoleEmployee {
  employeeId: number;
  employeeCode?: string | null;
  name: string;
  email?: string | null;
  isActive: boolean;
  hasOwnRights: boolean;
}

export interface EmployeeMatrix {
  employeeId: number;
  hasOwnRights: boolean;
  tableReady: boolean;
  groups: RoleMenuGroup[];
}

export interface ApiResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class RoleMenuRightsService {
  private baseUrl = `${environment.apiUrl}/menu-rights/role`;

  constructor(private http: HttpClient) {}

  getMatrix(roleId: string): Observable<RoleMenuGroup[]> {
    return this.http.get<RoleMenuGroup[]>(`${this.baseUrl}/${encodeURIComponent(roleId)}`);
  }

  save(payload: SaveRoleMenuRightsRequest): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.baseUrl}/save`, payload);
  }

  // ---- 27.11.2026 employee-wise rights (API: EmployeeMenuRightsController, table BgEmployeeMenuRight)
  private empUrl = `${environment.apiUrl}/menu-rights/employee`;

  getRoleEmployees(roleId: string): Observable<{ tableReady: boolean; data: RoleEmployee[] }> {
    return this.http.get<{ tableReady: boolean; data: RoleEmployee[] }>(`${this.empUrl}/list`, { params: { roleId } });
  }

  getEmployeeMatrix(employeeId: number, roleId: string): Observable<EmployeeMatrix> {
    return this.http.get<EmployeeMatrix>(`${this.empUrl}/${employeeId}`, { params: { roleId } });
  }

  /** Same rights for one or several employees */
  saveEmployees(employeeIds: number[], rights: { menuId: number; subMenuId: number; permission: number }[]): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.empUrl}/save`, { employeeId: 0, employeeIds, rights });
  }

  resetEmployeeToRole(employeeId: number): Observable<ApiResult> {
    return this.http.delete<ApiResult>(`${this.empUrl}/${employeeId}`);
  }
}
