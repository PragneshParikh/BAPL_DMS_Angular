import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { VehicleStockTransferFilter } from '../../ViewModels/VehicleStockTransferViewModel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleStockTransferService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  createStockTransfer(data: any) {
    return this.http.post(`${this.apiUrl}/VehicleStockTransfer/create`, data);
  }

  getVehicleStockTransferList(filter: VehicleStockTransferFilter) {

    let params = new HttpParams()
      .set('fromDate', filter.fromDate || '')
      .set('toDate', filter.toDate || '')
      .set('issuingLocation', filter.issuingLocation || '')
      .set('receivingLocation', filter.receivingLocation || '')
      .set('dealerCode', filter.dealerCode || '');

    return this.http.get<any[]>(
      `${this.apiUrl}/VehicleStockTransfer/list`,
      { params }
    );
  }

  getTransferById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/VehicleStockTransfer/${id}`);
  }

  downloadExcel(dateFrom?: Date, dateTo?: Date, issuingLocation?: string, receivingLocation?: string, search?: string) {

    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom.toISOString());
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo.toISOString());
    }
    if (issuingLocation) {
      params = params.set('issuingLocation', issuingLocation);
    }
    if (receivingLocation) {
      params = params.set('receivingLocation', receivingLocation);
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get(`${this.apiUrl}/VehicleStockTransfer/download`,
      {
        params,
        responseType: 'blob'
      }
    );
  }
}