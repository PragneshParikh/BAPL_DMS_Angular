import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeProfileMasterService {

  private readonly baseUrl = `${environment.apiUrl}/EmployeeProfileMaster`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // PROFILE MASTER
  // GET api/EmployeeProfileMaster/GetAll
  // Returns 5 profiles ordered by SortOrder:
  //   City Head → District Head → Zone Head
  //   → State Head → National Head
  // =====================================================

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAll`);
  }

  // =====================================================
  // PROFILE MAPPINGS — per BG Employee
  // =====================================================

  /**
   * GET api/EmployeeProfileMaster/GetMappings/{bgEmployeeId}
   * Returns all Employee+Profile mappings for a BG employee.
   * Response: [{ id, bgEmployeeId, employeeId, profileId,
   *              employeeName, employeeCode, profileName }]
   */
  getMappingsByBgEmployee(bgEmployeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetMappings/${bgEmployeeId}`);
  }

  /**
   * POST api/EmployeeProfileMaster/SaveMappings
   * Replaces ALL existing mappings for the BG employee
   * (delete-then-insert on the backend).
   * Request: { bgEmployeeId, mappings: [{employeeId, profileId}], createdBy }
   */
  saveMappings(request: {
    bgEmployeeId: number;
    mappings:     { employeeId: number; profileId: number }[];
    createdBy:    string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/SaveMappings`, request);
  }
}