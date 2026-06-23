import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleInfoService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getVehicleInfo(regNo?: string, chassisNo?: string): Observable<any> {
    let params = new HttpParams();
    if (regNo) {
      params = params.set('regNo', regNo);
    }
    if (chassisNo) {
      params = params.set('chassisNo', chassisNo);
    }
    return this.http.get<any>(`${this.apiUrl}/VehicleInfo`, { params });
  }
  updateVehicleInfo(data: any) {
    return this.http.post(`${this.apiUrl}/VehicleInfo/update`, data);
  }
}
