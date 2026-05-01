import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobCardService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  getJobType(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobType`);
  }

  getServiceHead(jobTypeId: number): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetServiceHead?jobTypeId=${jobTypeId}`);
  }

  getServiceType(serviceHeadId: number): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetServiceType?serviceHeadId=${serviceHeadId}`);
  }

  getAllInspectedChassis(dealerCode: string): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetAllInspectedChassis?dealerCode=${dealerCode}`);
  }

  getJobSource(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobSource`);
  }

  getPdiChecklist(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetPdiChecklist`)
  }

  getJobCardList(dealerCode: string): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobCardList?dealerCode=${dealerCode}`);
  }

  insertJobCard(data: any) {
    return this.httpClient.post(`${this.baseUrl}/JobCard/SaveJobCardDetails`, data);
  }


  updateJobCard(data: any) {
    return this.httpClient.put(`${this.baseUrl}/JobCard/UpdateJobCardDetails`, data);
  }

  getFilterdDataByPaged(fromDate: Date | null, toDate: Date | null, jobNo: number | null, manualJobNo: number | null, pageIndex: number, pageSize: number): Observable<any> {

    const params = {
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      fromDate: fromDate ? new Date(fromDate).toISOString() : '',
      toDate: toDate ? new Date(toDate).toISOString() : '',
      jobNo: jobNo ? jobNo.toString() : '',
      manualJobNo: manualJobNo ? manualJobNo.toString() : ''
    };

    return this.httpClient.get(`${this.baseUrl}/JobCard/GetFilteredJobCard`, { params });
  }

  getJobCardById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetJobCardById?Id=${id}`);
  }

  deleteJobCard(id: number) {
    return this.httpClient.delete(`${this.baseUrl}/JobCard/DeleteJobCard/${id}`);
  }

  searchJobCard(payload: any){
    return this.httpClient.post<any[]>(`${this.baseUrl}/JobCard/SearchJobCard/`,payload)
  }

}
