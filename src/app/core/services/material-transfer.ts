import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MaterialTransferService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

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
}
