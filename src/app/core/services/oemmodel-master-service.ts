import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OemmodelMasterService {

  // API Base URL
  private apiUrl = 'http://localhost:5215/api/OEMModelMaster';

  constructor(private http: HttpClient) { }

  // Get All OEM Models
  getAllOEMModels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAllOEMModels`);
  }

  // Save / Insert OEM Model
  AddOEMModel(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddOEMModel`, data);
  }

  // // Update OEM Model
  // updateOEMModel(data: any): Observable<any> {
  //   return this.http.put(`${this.apiUrl}/UpdateOEMModel`, data);
  // }

  // Delete OEM Model
  deleteOEMModel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/DeleteOEMModel/${id}`);
  }

  // Excel Download
  downloadOEMModelExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/downloadOEMModelExcel`, {
      responseType: 'blob'
    });
  }
  updateOEMModel(data: any) {

    return this.http.put(
      `${this.apiUrl}/UpdateOEMModel`,
      data,
      { responseType: 'text' }   // ⭐ important
    );

  }


}