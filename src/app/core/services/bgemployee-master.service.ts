import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAll`);
  }

  getEmployeeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  saveEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Save`, employee);
  }

  updateEmployee(employee: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Update/${employee.id}`, employee);
  }

  updateStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/ToggleStatus/${id}`, { isActive });
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Delete/${id}`);
  }

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

  // =========================================
  // EXCEL EXPORT
  // FIX: with responseType 'blob', a failed request's JSON error body
  // ({ message: "..." } from BgEmployeeController.Download's catch block)
  // arrives as an unreadable Blob in err.error, not parsed JSON — so any
  // failure looked identical: silent, no message anywhere. This decodes
  // that blob back into text/JSON so the real reason is actually visible,
  // same fix already applied to EmployeeMasterService's export.
  // =========================================

  downloadBgEmployeeExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Download`, { responseType: 'blob' }).pipe(
      catchError((err: HttpErrorResponse) => this.readBlobError(err))
    );
  }

  private readBlobError(err: HttpErrorResponse): Observable<never> {
    if (err.error instanceof Blob) {
      return new Observable<never>(observer => {
        const reader = new FileReader();
        reader.onload = () => {
          let message = `Request failed (${err.status})`;
          try {
            const parsed = JSON.parse(reader.result as string);
            message = parsed.message ?? message;
          } catch {
            if (reader.result) message = reader.result as string;
          }
          observer.error({ status: err.status, message });
        };
        reader.onerror = () => observer.error({ status: err.status, message: `Request failed (${err.status})` });
        reader.readAsText(err.error);
      });
    }
    return throwError(() => ({ status: err.status, message: err.message }));
  }
}