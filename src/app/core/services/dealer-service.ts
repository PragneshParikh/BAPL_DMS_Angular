  import { HttpClient, HttpParams } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';
  import { environment } from '../../../environments/environment';

  @Injectable({
    providedIn: 'root',
  })
  export class DealerService {
    protected baseUrl = environment.apiUrl;

    constructor(private httpClient: HttpClient) { }

    getDealerByPaged(
      searchTerm: string | null = null,
      pageIndex: number,
      pageSize: number,
      dealer: string | null = null
    ): Observable<any> {

      let params = new HttpParams()
        .set('pageIndex', pageIndex)
        .set('pageSize', pageSize);

      if (searchTerm) {
        params = params.set('searchTerm', searchTerm);
      }

      if (dealer) {
        params = params.set('dealerCode', dealer);
      }

      return this.httpClient.get(`${this.baseUrl}/DealerMaster/paged`, { params });
    }

    downloadDealerExcel() {
      return this.httpClient.get(
        `${this.baseUrl}/DealerMaster/download`,
        { responseType: 'blob' }
      );
    }

    updateTradeCertificate(dealerCode: string, tradeCertificate: string) {
      return this.httpClient.put(
        `${this.baseUrl}/DealerMaster/updateTradeCertificate?dealerCode=${dealerCode}`,
        JSON.stringify(tradeCertificate),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    getByDealerCode(dealerCode: string | null): Observable<any> {
      return this.httpClient.get(`${this.baseUrl}/DealerMaster/GetByDealerCode/${dealerCode}`);
    }

    getDealerDropdown(dealerCode: string | null): Observable<any> {
      let params = new HttpParams();
      if (dealerCode) {
        params = params.set('dealerCode', dealerCode)
      }
      return this.httpClient.get<any>(`${this.baseUrl}/DealerMaster/GetDealerDropdown`, { params });
    }
  }
