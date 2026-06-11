import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OemmodelMasterService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get All OEM Models
  getAllOEMModels(): Observable<any> {
    return this.http.get(`${this.baseUrl}/OEMModelMaster/GetAllOEMModels`);
  }

  // Save / Insert OEM Model
  AddOEMModel(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/OEMModelMaster/AddOEMModel`, data);
  }

  // Delete OEM Model
  deleteOEMModel(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/OEMModelMaster/DeleteOEMModel/${id}`);
  }

  // Excel Download
  downloadOEMModelExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/OEMModelMaster/downloadOEMModelExcel`, { responseType: 'blob' });
  }

  updateOEMModel(data: any) {
    return this.http.put(`${this.baseUrl}/OEMModelMaster/UpdateOEMModel`, data, { responseType: 'text' });
  }

  getOEMModelByStatus(status: boolean): Observable<any> {
    return this.http.get(`${this.baseUrl}/OEMModelMaster/GetOEMModelByStatus/${status}`);
  }


}