import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobCardService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient:HttpClient){}

  
   getJobType(): Observable<any> {
   // debugger;;
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobType`);
  }
  getServiceHead(jobTypeId: number): Observable<any>{
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetServiceHead?jobTypeId=${jobTypeId}`);
  }
  getServiceType(serviceHeadId: number): Observable<any>{
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetServiceType?serviceHeadId=${serviceHeadId}`);
  }
  getAllInspectedChassis(dealerCode: string): Observable<any>{
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetAllInspectedChassis?dealerCode=${dealerCode}`);
  }
  getJobSource(): Observable<any> {
    //debugger;;
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobSource`);
  }
  getPdiChecklist(): Observable<any>{
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetPdiChecklist`)
  }
  insertJobCard(data: any) {
  return this.httpClient.post(`${this.baseUrl}/JobCard/SaveJobCardDetails`, data);
}
}
