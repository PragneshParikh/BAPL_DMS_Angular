import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LabourmaasterService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  importModelwiseExcel(data: FormData): Observable<any> {
    debugger
    return this.httpClient.post(`${this.baseUrl}/LabourMaster/ImportModelWiseLabourMasterExcelApi`, data);
  }
  importPartwiseExcel(data: FormData): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LabourMaster/ImportPartWiseLabourMasterExcelApi`, data);
  }
  updateLabourMasterDataApi(data: any): Observable<any>{
    return this.httpClient.put(`${this.baseUrl}/LabourMaster/UpdateLabourMasterDataApi`,data)
  }
  updatePartWiseLabourMasterDataApi(data:any):Observable<any>{
    return this.httpClient.put(`${this.baseUrl}/LabourMaster/UpdatePartWiseLabourMasterDataApi`,data)
  }
  getLabourMasterModelwiseListApi():Observable<any>{
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterModelwiseListApi`);
  }
  getLabourMasterPartwiseListApi():Observable<any>{
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterPartwiseListApi`);
  }
}
