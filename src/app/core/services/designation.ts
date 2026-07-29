import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DesignationModel } from '../../ViewModels/models/DesignationModel';

@Injectable({ providedIn: 'root' })
export class DesignationService {
  // Match this base to however CityService builds its URL
private baseUrl = `${environment.apiUrl}/designation`;

  constructor(private http: HttpClient) {}

  get(): Observable<DesignationModel[]> {
    return this.http.get<DesignationModel[]>(this.baseUrl);
  }

  create(designation: DesignationModel): Observable<any> {
    return this.http.post(this.baseUrl, designation);
  }

  update(designation: DesignationModel): Observable<any> {
    return this.http.put(this.baseUrl, designation);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}