import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeMasterService {

  // private apiUrl = 'http://localhost:5215/api/Employee';

  // private stateApi = 'http://localhost:5215/api/state';

  // private cityApi = 'http://localhost:5215/api/city';  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // =========================================
  // GET ALL EMPLOYEES
  // =========================================

  getEmployees(): Observable<any[]> {

    return this.http.get<any[]>(`${this.apiUrl}/Employee`);
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
      `${this.apiUrl}/state`
    );
  }

  // =========================================
  // GET CITIES
  // =========================================

  getCities(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/city`
    );
  }

  getEmployeesByDesignation(dealerCode?: string, designation?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }
    if (designation) {
      params = params.set('designation', designation);
    }
    return this.http.get<any[]>(
      `${this.apiUrl}/Employee/employeeByDesignation`,
      { params }
    );
  }

  // =========================================
  // GET DEALER BY CODE
  // =========================================

  getDealerByCode(dealerCode: string): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/GetDealerByCode/${dealerCode}`
    );
  }

  // =========================================
  // GET DEALER LOCATIONS
  // =========================================

  getDealerLocations(dealerCode: string): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/GetLocationsByDealer/${dealerCode}`
    );
  }
}