// src/app/core/services/stock-report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockReport } from '../../ViewModels/models/stock-report.model'; 
// ✅ single consistent path

@Injectable({
  providedIn: 'root'
})
export class StockReportService {

  private apiUrl = `${environment.apiUrl}/Report`; // ✅ matches controller route

  constructor(private http: HttpClient) { }

// stock-report.service.ts
getDealerWiseStockReport(dealerCode?: string): Observable<StockReport[]> {
  const params = dealerCode ? `?dealerCode=${dealerCode}` : '';
  return this.http.get<StockReport[]>(`${this.apiUrl}/dealer-wise${params}`);
}

  getColourWiseReport(): Observable<StockReport[]> {
    return this.http.get<StockReport[]>(`${this.apiUrl}/colour-wise`);
  }
}