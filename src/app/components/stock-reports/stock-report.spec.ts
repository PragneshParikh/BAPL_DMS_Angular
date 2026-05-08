import { Injectable } from '@angular/core';

import { HttpClient }
from '@angular/common/http';

import { Observable }
from 'rxjs';

import { environment } from '../../../environments/environment';


import { StockReport }
from './models/stock-report.model';

import { DealerStockGroup }
from './models/dealer-stock-group.model';

import { ColourStockGroup }
from './models/colour-stock-group.model';

@Injectable({
  providedIn: 'root'
})
export class StockReportService {

  private apiUrl =
    `${environment.apiUrl}/StockReport`;

  constructor(
    private http: HttpClient
  ) {}

  getDealerWiseReport():
    Observable<StockReport[]>
  {
    return this.http.get<StockReport[]>(
      `${this.apiUrl}/dealer-wise`
    );
  }

  getColourWiseReport():
    Observable<StockReport[]>
  {
    return this.http.get<StockReport[]>(
      `${this.apiUrl}/colour-wise`
    );
  }
}