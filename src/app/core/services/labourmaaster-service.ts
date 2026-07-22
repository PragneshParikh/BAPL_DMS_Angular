import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LabourMasterService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  importModelwiseExcel(data: FormData): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LabourMaster/ImportModelWiseLabourMasterExcelApi`, data);
  }

  importPartwiseExcel(data: FormData): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/LabourMaster/ImportPartWiseLabourMasterExcelApi`, data);
  }

  updateLabourMasterDataApi(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/LabourMaster/UpdateLabourMasterDataApi`, data)
  }

  updatePartWiseLabourMasterDataApi(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/LabourMaster/UpdatePartWiseLabourMasterDataApi`, data)
  }

  getLabourMasterModelwiseListApi(searchText: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterModelwiseListApi`,
      { params: { searchText: searchText } }
    );
  }

  getLabourMasterPartwiseListApi(searchText: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterPartwiseListApi`,{ params: { searchText: searchText } });
  }

  getLabourRateDropDown(oemmodelName: string, customerLedgerId: number, dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourRateDropDown/${oemmodelName}/${customerLedgerId}/${dealerCode}`);
  }
}
