import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LedgerMasterService {
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
  getInsuranceLedgers(): Observable<any> {
    return this.httpClient.get<[]>(`${this.baseUrl}/ledger-master/insurance`);
  }

  getLedgerByType(ledgerType: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/ledger-master/ledgerByType?ledgerType=${ledgerType}`);
  }

 getNextLedId(dealerCode: string): Observable<string> {
  return this.httpClient.get<string>(
    `${this.baseUrl}/ledger-master/getNextLed`,
    {
      params: { dealerCode },
      responseType: 'text' as 'json'
    }
  );
}
  getLedgerMobileList(dealerCode: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/ledger-master/getLedgerMobileList`, {
      params: {
        dealerCode: dealerCode
      }
    }
    );
  }

downloadExcel(dealerCode: string | null = null) {
  let params = new HttpParams();
  if (dealerCode) {
    params = params.set('dealerCode', dealerCode);
  }
  return this.httpClient.get(
    `${this.baseUrl}/ledger-master/download`,
    {
      params,
      responseType: 'blob'
    }
  );
}
}
