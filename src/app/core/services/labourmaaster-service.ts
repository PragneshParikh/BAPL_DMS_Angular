import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
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

  getLabourMasterModelwiseListApi(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterModelwiseListApi`);
  }

  getLabourMasterPartwiseListApi(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourMasterPartwiseListApi`);
  }

  getLabourRateDropDown(oemmodelName: string,customerLedgerId:number,dealerCode:string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/LabourMaster/GetLabourRateDropDown/${oemmodelName}/${customerLedgerId}/${dealerCode}`);
  }
  
 downloadLabourRateMasterExcel(rateType: string, oemModelName?: string, cityTier?: number): Observable<Blob> {
    let params = new HttpParams().set('rateType', rateType);
    if (oemModelName) params = params.set('oemModelName', oemModelName);
    if (cityTier != null) params = params.set('cityTier', cityTier.toString());

    return this.httpClient.get(`${this.baseUrl}/LabourMaster/download-excel`, {
      params,
      responseType: 'blob'
    });
  }
}
