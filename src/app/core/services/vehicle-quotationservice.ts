import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleQuotationService {

  private baseUrl = `${environment.apiUrl}/VehicleQuotation`;

  constructor(private http: HttpClient) { }

  // FIX: was getQuotations() with no params — this is what threw
  // "Expected 0 arguments, but got 1" once vehicle-quotation-list.ts started
  // calling getQuotations(dealerCode). Sent as a query param; the backend
  // service layer (VehicleQuotationService.GetAllAsync) only actually uses
  // it for a SuperAdmin caller and overrides it server-side from the JWT
  // otherwise, so it's safe to always send this regardless of role.
  getQuotations(dealerCode?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dealerCode) params = params.set('dealerCode', dealerCode);

    return this.http.get<any[]>(this.baseUrl, { params });
  }

  getQuotationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  generateQuotationNo(): Observable<string> {
    return this.http.get(`${this.baseUrl}/generate-quotation-no`, {
      responseType: 'text'
    });
  }
    saveQuotation(quotation: any): Observable<any> {
      return this.http.post<any>(
        `${this.baseUrl}/Save`,
        quotation
      );
    }

    updateQuotation(id: number, quotation: any): Observable<any> {
      return this.http.put<any>(
        `${this.baseUrl}/Update/${id}`,
        quotation
      );
    }

    deleteQuotation(id: number): Observable<any> {
      return this.http.delete<any>(
        `${this.baseUrl}/Delete/${id}`
      );
    }

  // Add to LedgerMasterService (src/app/core/services/ledger-master.ts)
    getFinanceCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/finance-ledgers`);
  }

    getPrintQuotation(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/print`);
  }
  
}