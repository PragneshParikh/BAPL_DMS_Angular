//src\app\core\services\job-card-service.ts
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

  getPdiChecklist(oemModelId: number): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetPdiChecklist?oemModelId=${oemModelId}`)
  }

  getJobCardList(search: any): Observable<any> {

    let params = new HttpParams();

    if (search.dealerCode) {
      params = params.set('dealerCode', search.dealerCode);
    }

    if (search.fromDate) {
      params = params.set('dateFrom', search.fromDate);
    }

    if (search.toDate) {
      params = params.set('dateTo', search.toDate);
    }

    if (search.jobNo) {
      params = params.set('jobNo', search.jobNo);
    }

    if (search.registerNo) {
      params = params.set('registerNo', search.registerNo);
    }
    if (search.serviceLocation) {
      params = params.set('serviceLocation', search.serviceLocation);
    }

    if (search.chassisNo) {
      params = params.set('chassisNo', search.chassisNo);
    }

    return this.httpClient.get<any[]>(
      `${this.baseUrl}/JobCard/GetJobCardList`,
      { params }
    );
  }

  insertJobCard(data: any) {
    return this.httpClient.post(`${this.baseUrl}/JobCard/SaveJobCardDetails`, data);
  }

  updateJobCard(data: any) {
    return this.httpClient.put(`${this.baseUrl}/JobCard/UpdateJobCardDetails`, data);
  }

    getJobCardForPrint(jobId: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetJobCardForPrint/${jobId}`);
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

  getOpenJobCardDataByPaged(fromDate: Date | null, toDate: Date | null, jobNo: number | null, manualJobNo: number | null, pageIndex: number, pageSize: number, status: boolean, dealerCode: string | null): Observable<any> {
    const params = {
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      fromDate: fromDate ? new Date(fromDate).toISOString() : '',
      toDate: toDate ? new Date(toDate).toISOString() : '',
      jobNo: jobNo ? jobNo.toString() : '',
      manualJobNo: manualJobNo ? manualJobNo.toString() : '',
      isClosed: status.toString(),
      dealerCode: dealerCode
    };

    return this.httpClient.get(`${this.baseUrl}/JobCard/GetJobCardByStatus`, { params });
  }

  getJobCardById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/${id}`);
  }

  deleteJobCard(id: number,role:string) {
    return this.httpClient.delete(`${this.baseUrl}/JobCard/DeleteJobCard/${id}/${role}`);
  }

  searchJobCard(payload: any) {
    return this.httpClient.post<any[]>(`${this.baseUrl}/JobCard/SearchJobCard/`, payload)
  }

  getJobCardServiceHistory(chassisNo: string, jobCardId: number) {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetServiceHistory/${chassisNo}/${jobCardId}`)
  }

  getCIRJobCardDetails(id: number) {

    return this.httpClient.get(`${this.baseUrl}/JobCard/GetCIRJobCardDetails/${id}`)
  }
  getMaterialedJobCardList(jobId: number,dealerCode:string) {
    return this.httpClient.get<any[]>(`${this.baseUrl}/JobCard/GetMaterialedJobCardList/${jobId}/${dealerCode}`)
  }

  getJobNo(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetNextJobNo/${dealerCode}`);
  }

  getInspectedChassisListDropDown(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetInspectedChassisListDropDown/${dealerCode}`)
  }

  getJobCardListRepairBill(search: any): Observable<any> {

    let params = new HttpParams();

    if (search.dealerCode) {
      params = params.set('dealerCode', search.dealerCode);
    }

    if (search.fromDate) {
      params = params.set('dateFrom', search.fromDate);
    }

    if (search.toDate) {
      params = params.set('dateTo', search.toDate);
    }

    if (search.jobNo) {
      params = params.set('jobNo', search.jobNo);
    }

    if (search.registerNo) {
      params = params.set('registerNo', search.registerNo);
    }

    if (search.chassisNo) {
      params = params.set('chassisNo', search.chassisNo);
    }

    return this.httpClient.get<any[]>(
      `${this.baseUrl}/JobCard/GetJobCardListRepairBill`,
      { params }
    );
  }

  getJobCardStatusById(id: Number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetJobCardStatusById/${id}`);
  }

  getIssueTypebasedJobDetails(dealerCode: string, jobNo: number, serviceloc: string, fromDate: Date, toDate: Date) {
    return this.httpClient.get(`${this.baseUrl}/JobCard/GetIssueTypebasedJobDetails/${dealerCode}/${jobNo}/${serviceloc}/${fromDate}/${toDate}`)
  }
}
