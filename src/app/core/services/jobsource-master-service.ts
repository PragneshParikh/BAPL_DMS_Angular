import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobsourceMasterService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertJobSourceMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/JobSource/InsertJobSource`, model);
  }

  updateJobSourceMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/JobSource/UpdateJobSourceName`, model);
  }

  deleteJobSourceMaster(jobSourceId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/JobSource/DeleteJobSource/${jobSourceId}`);
  }
  getJobSourceMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobSource/GetAllJobSource`);
  }
  getJobSourceMasterExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/JobSource/GetJobSourceMasterExcel`, {
      responseType: 'blob'
    });
  }


  

}
