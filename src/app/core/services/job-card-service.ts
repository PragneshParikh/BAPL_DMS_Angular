import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAllInspectedChassis(dealerCode: string, jobTypeId: number): Observable<any> {
    if (!jobTypeId) jobTypeId = 0;
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetAllInspectedChassis/${dealerCode}/${jobTypeId}`);
  }

  getJobSource(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobSource`);
  }

  getPdiChecklist(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetPdiChecklist`)
  }

  // getJobCardList(dealerCode: string): Observable<any> {
  //   return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobCardList?dealerCode=${dealerCode}`);
  // }

  getJobCardList(dealerCode?: string,
    dateFrom?: string,
    dateTo?: string,
    jobNo?: string,
    registerNo?: string,
    chassisNo?: string): Observable<any> {
    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }

    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    if (jobNo) {
      params = params.set('jobNo', jobNo);
    }

    if (registerNo) {
      params = params.set('registerNo', registerNo);
    }

    if (chassisNo) {
      params = params.set('chassisNo', chassisNo);
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetJobCardList`,
      {
        params
      }
    );
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
    return this.httpClient.get(`${this.baseUrl}/JobCard/${id}`);
  }

  deleteJobCard(id: number) {
    return this.httpClient.delete(`${this.baseUrl}/JobCard/DeleteJobCard/${id}`);
  }

  searchJobCard(payload: any) {
    return this.httpClient.post<any[]>(`${this.baseUrl}/JobCard/SearchJobCard/`, payload)
  }

  getJobCardServiceHistory(chassisNo: string) {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetServiceHistory/${chassisNo}`)
  }

  getCIRJobCardDetails(id: number) {

    return this.httpClient.get(`${this.baseUrl}/JobCard/GetCIRJobCardDetails/${id}`)
  }
  getMaterialedJobCardList(jobId: number) {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetMaterialedJobCardList/${jobId}`)
  }

  getJobNo(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetNextJobNo/${dealerCode}`);
  }
}
