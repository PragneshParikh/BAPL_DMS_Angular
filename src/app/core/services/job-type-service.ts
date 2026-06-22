import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobTypeService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertJobtypeMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/JobType/InsertJobType`, model);
  }

  updateJobTypeMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/JobType/UpdateJobTypeName`, model);
  }

  deleteJobTypeMaster(jobTypeId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/JobType/DeleteJobType/${jobTypeId}`);
  }
  getJobTypepMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobType/GetAllJobType`);
  }
  getJobTypeMasterExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobType/GetJobTypeMasterExcel`, {
      responseType: 'blob'
    });
  }


  
}
