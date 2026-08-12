import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UwLineItemService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  searchUwLineItems(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/UwLineItem/SearchUwLineItems`, filter);
  }

  approveUwLineItem(model: { id: number }): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/UwLineItem/ApproveUwLineItem`, model);
  }

  rejectUwLineItem(model: { id: number; rejectionReason: string }): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/UwLineItem/RejectUwLineItem`, model);
  }

    deleteUwLineItem(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/UwLineItem/DeleteUwLineItem/${id}`);
  }
}