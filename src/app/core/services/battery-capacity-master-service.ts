import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BatteryApiResponse } from '../../ViewModels/BatteryCapacityMaster/BatteryCapacity';

@Injectable({
  providedIn: 'root',
})
export class BatteryCapacityMasterService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getBatteryCapcityMaster(): Observable<BatteryApiResponse> {
    return this.http.get<BatteryApiResponse>(`${this.apiUrl}/BatteryCapacityMaster/list`);
  }

  updateBatteryCapacityMaster(id: number, data: any): Observable<any> {

    return this.http.put(`${this.apiUrl}/BatteryCapacityMaster/update/${id}`, data);
  }

  addBatteryCapacityMaster(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/BatteryCapacityMaster/create`, data);
  }

  downloadBatteryCapacityMasterExcel() {
    return this.http.get(`${this.apiUrl}/BatteryCapacityMaster/download`,
      {
        responseType: 'blob'
      }
    );
  }
}
