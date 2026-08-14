import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WarrantyPackingSlipService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getPackableLines(warrantyInvoiceHeaderId: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyPacking/GetPackableLines/${warrantyInvoiceHeaderId}`);
  }

  insertWarrantyPackingSlip(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyPacking/InsertWarrantyPackingSlip`, model);
  }

  searchWarrantyPackingSlips(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyPacking/SearchWarrantyPackingSlips`, filter);
  }

  getWarrantyPackingSlipById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyPacking/GetWarrantyPackingSlipById/${id}`);
  }

  deleteWarrantyPackingSlip(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/WarrantyPacking/DeleteWarrantyPackingSlip/${id}`);
  }

    searchWarrantyPackingSlipLines(filter: any): Observable<any> {
      return this.httpClient.post(`${this.baseUrl}/WarrantyPacking/SearchWarrantyPackingSlipLines`, filter)   
  }

    searchPackingSlipNos(dealerCode: string | null, searchText: string): Observable<string[]> {
      return this.httpClient.get<string[]>(`${this.baseUrl}/WarrantyPacking/SearchPackingSlipNos`, {
        params: dealerCode ? { dealerCode, searchText } : { searchText }
      });
  }

  searchPackingInvoiceNos(dealerCode: string | null, searchText: string): Observable<string[]> {
      return this.httpClient.get<string[]>(`${this.baseUrl}/WarrantyPacking/SearchPackingInvoiceNos`, {
        params: dealerCode ? { dealerCode, searchText } : { searchText }
      });
  }

    printWarrantyPackingSlip(id: number): Observable<Blob> {
      return this.httpClient.get(`${this.baseUrl}/WarrantyPacking/GenerateWarrantyPackingSlipPdf/${id}`, {
        responseType: 'blob'
      });
  }
}