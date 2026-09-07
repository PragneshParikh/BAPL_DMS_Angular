import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retryWhen } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MaterialTransferService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

getByDealer(
  searchTerm: string,
  dealerCode: string,
  pageIndex: number,
  pageSize: number,
  fromDate?: string | null,
  toDate?: string | null
): Observable<any> {
  let params = new HttpParams()
    .set('dealerCode', dealerCode ?? '')
    .set('pageIndex', pageIndex)
    .set('pageSize', pageSize);

  if (searchTerm) {
    params = params.set('searchTerm', searchTerm);
  }
  if (fromDate) {
    params = params.set('fromDate', fromDate);
  }
  if (toDate) {
    params = params.set('toDate', toDate);
  }

  return this.httpClient.get<any>(`${this.baseUrl}/material-transfer/GetByDealerPaged`, { params });
}

  getMaterialIssueId() {
    return this.httpClient.get<any>(`${this.baseUrl}/material-transfer/issue-id`);
  }

  getMaterialTransferByJobId(jobId: Number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/material-transfer/${jobId}`);
  }

  insert(items: any) {
    return this.httpClient.post(`${this.baseUrl}/material-transfer`, items);
  }

  update(items: any) {
    return this.httpClient.put(`${this.baseUrl}/material-transfer`, items);
  }

  delete(items: any) {
    return this.httpClient.delete(`${this.baseUrl}/material-transfer`, {
      body: items,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

deleteByJobId(jobId: number): Observable<any> {
  return this.httpClient.delete<any>(`${this.baseUrl}/material-transfer/by-job/${jobId}`);
}

  downloadExcel() {
    return this.httpClient.get(`${this.baseUrl}/material-transfer/download`, { responseType: 'blob' });
  }

}
