import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DepartmentModel } from '../../ViewModels/models/DepartmentModel';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  // Match this base to however CityService builds its URL
  private baseUrl = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) {}

  get(): Observable<DepartmentModel[]> {
    return this.http.get<DepartmentModel[]>(this.baseUrl);
  }

  create(department: DepartmentModel): Observable<any> {
    return this.http.post(this.baseUrl, department);
  }

  update(department: DepartmentModel): Observable<any> {
    return this.http.put(this.baseUrl, department);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}