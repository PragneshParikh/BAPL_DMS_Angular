import { Injectable, model } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComplaintmasterService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getComplaintMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ComplaintMaster/GetComplaintMasterList`);
  }

  getComplaintMasterById(complaintId: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ComplaintMaster/GetComplaintMasterById/${complaintId}`);
  }

  insertComplaintMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/ComplaintMaster/InsertComplaintMaster`, model);
  }

  updateComplaintMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/ComplaintMaster/UpdateComplaintMaster`, model);
  }

  deleteComplaintMaster(complaintId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/ComplaintMaster/DeleteComplaintMaster/${complaintId}`);
  }

  getComplaintMasterExcel():Observable<any>{
    return this.httpClient.get(`${this.baseUrl}/ComplaintMaster/GetComplaintMasterExcel`,{
       responseType: 'blob'
    });
  }
}