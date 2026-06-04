import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeMasterService {

  private apiUrl = 'http://localhost:5215/api/Employee';

  private stateApi = 'http://localhost:5215/api/state';

  private cityApi = 'http://localhost:5215/api/city';

  constructor(private http: HttpClient) { }

  // =========================================
  // GET ALL EMPLOYEES
  // =========================================

  getEmployees(): Observable<any[]> {

    return this.http.get<any[]>(this.apiUrl);
  }

  // =========================================
  // GET EMPLOYEE BY ID
  // =========================================

  getEmployeeById(id: number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/GetById/${id}`
    );
  }

  // =========================================
  // INSERT EMPLOYEE
  // =========================================

  saveEmployee(employeeObj: any): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      employeeObj
    );
  }

  // =========================================
  // UPDATE EMPLOYEE
  // =========================================

  updateEmployee(employeeObj: any): Observable<any> {

    return this.http.put<any>(
      this.apiUrl,
      employeeObj
    );
  }

  // =========================================
  // DELETE EMPLOYEE
  // =========================================

  deleteEmployee(id: number): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }

  // =========================================
  // GET STATES
  // =========================================

  getStates(): Observable<any[]> {

    return this.http.get<any[]>(
      this.stateApi
    );
  }

  // =========================================
  // GET CITIES
  // =========================================

  getCities(): Observable<any[]> {

    return this.http.get<any[]>(
      this.cityApi
    );
  }
}