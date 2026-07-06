import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeMasterService } from './employee-master';

@Injectable({
  providedIn: 'root',
})
export class BgemployeeMasterService {

  private readonly baseUrl = `${environment.apiUrl}/BgEmployee`;

  constructor(
    private http: HttpClient,
    private employeeMasterService: EmployeeMasterService,
  ) {}

  // =====================================================
  // BG EMPLOYEE CRUD
  // =====================================================

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAll`);
  }

  getEmployeeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  /** Save — returns the created entity including auto-generated Id */
  saveEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Save`, employee);
  }

  updateEmployee(employee: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Update/${employee.id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Delete/${id}`);
  }

  // =====================================================
  // LOOKUP — delegate to EmployeeMasterService
  // =====================================================

  getCities(): Observable<any[]> {
    return this.employeeMasterService.getCities();
  }

    getAssignedDealers(excludeId: number = 0): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/AssignedDealers?excludeId=${excludeId}`
    );
  }

    getEmployeeListView(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ListView`);
  }
}