import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleDispatchservice {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}`);
  }

  getByVehicleStatus(status: boolean): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/vehicle-dispatch?status=${status}`);
  }
}
