import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LedgerMaster {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getLedger(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master`)
  }

  getCompanyLedgers(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master/companies`)
  }

  getLedgerByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getLedgerById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master/${id}`);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/ledger-master`, data);
  }

  insert(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/ledger-master`, data);
  }

  getLedgerByType(ledgerType: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master/ledgerByType?ledgerType=${ledgerType}`);
  }


}
