import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockReport } from '../../ViewModels/models/stock-report.model';

@Injectable({
  providedIn: 'root'
})
export class StockReportService {

  private apiUrl = `${environment.apiUrl}/Report`;

  constructor(private http: HttpClient) {}

  getDealerWiseReport(): Observable<StockReport[]> {
    return this.http.get<StockReport[]>(`${this.apiUrl}/dealer-wise`);
  }
}