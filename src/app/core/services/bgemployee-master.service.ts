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

  // FIX: every route below was mismatched against the real
  // BgEmployeeController (e.g. this called GET /BgEmployee/GetAll, but the
  // controller's bare [HttpGet] is just GET /BgEmployee — same class of
  // mismatch on every method here, not just this one). Corrected to match
  // the controller's actual [HttpGet]/[HttpPost]/etc. attributes exactly.
  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  getEmployeeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  saveEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, employee);
  }

  updateEmployee(employee: any): Observable<any> {
    // Controller's [HttpPut] takes no id in the route — it reads
    // model.Id from the body, so employee.id must already be set on the
    // object being passed in.
    return this.http.put<any>(`${this.baseUrl}`, employee);
  }

  updateStatus(id: number, isActive: boolean): Observable<any> {
    // Controller reads isActive via [FromQuery], not from the body.
    return this.http.patch<any>(`${this.baseUrl}/${id}/status?isActive=${isActive}`, null);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  getCities(): Observable<any[]> {
    return this.employeeMasterService.getCities();
  }

  getAssignedDealers(excludeId: number = 0): Observable<any[]> {
    // Route is hyphenated ("assigned-dealers", not "AssignedDealers"), and
    // the controller's query param is named excludeEmployeeId, not excludeId.
    return this.http.get<any[]>(
      `${this.baseUrl}/assigned-dealers?excludeEmployeeId=${excludeId}`
    );
  }

  getEmployeeListView(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/list`);
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
    // Controller route is "export", not "Download".
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' }).pipe(
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