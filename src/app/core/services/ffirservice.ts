import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FFIRService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  getPartDropdownlist(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/FFIR/GetPartDropdownlist`);
  }
  getComplaintCodeList(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/FFIR/GetComplaintCodeList`)
  }
  getJobCardHistory(chassisNo: string): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/FFIR/GetJobCardHistory/${chassisNo}`)
  }
  insertFFIR(data: any) {
    return this.httpClient.post(`${this.baseUrl}/FFIR/InsertFFIR`, data);
  }
  getFFIRDetailListing(dealerCode: string, search: string) {

  return this.httpClient.get<any[]>(
    `${this.baseUrl}/FFIR/GetFFIRDetailListing`,
    {
      params: {
        dealerCode: dealerCode,
        search: search || ''
      }
    }
  );

}
getFFIRById(id: number): Observable<any> {

  return this.httpClient.get(
    `${environment.apiUrl}/FFIR/GetFFIRById/${id}`
  );

}
updateFFIR(id: number, payload: any): Observable<any> {
  return this.httpClient.put(
    `${environment.apiUrl}/FFIR/UpdateFFIR/${id}`,
    payload
  );
}

}
