import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DealerService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDealers(search?: string): Observable<any> {

    let params = new HttpParams();

    if (search && search.trim()) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.baseUrl}/DealerMaster/list`, { params });
  }

  downloadDealerExcel() {
    return this.http.get(
      `${this.baseUrl}/DealerMaster/download`,
      { responseType: 'blob' }
    );
  }

  updateTradeCertificate(dealerId: number, tradeCertificate: string) {
    return this.http.put(
      `${this.baseUrl}/DealerMaster/updateTradeCertificate?dealerId=${dealerId}`,
      JSON.stringify(tradeCertificate),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  getByDealerId(dealerId: string | null): Observable<any> {
    return this.http.get(`${this.baseUrl}/DealerMaster/dealerCode?dealerCode=${dealerId}`);
  }
}
