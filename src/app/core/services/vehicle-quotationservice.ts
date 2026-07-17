import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleQuotationService {

  private baseUrl = `${environment.apiUrl}/VehicleQuotation`;

  constructor(private http: HttpClient) { }

  getQuotations(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
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
  
}