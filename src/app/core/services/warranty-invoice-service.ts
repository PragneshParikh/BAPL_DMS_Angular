import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WarrantyInvoiceService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertWarrantyInvoice(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyInvoice/InsertWarrantyInvoice`, model);
  }

  updateWarrantyInvoice(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/WarrantyInvoice/UpdateWarrantyInvoice`, model);
  }

  deleteWarrantyInvoice(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/WarrantyInvoice/DeleteWarrantyInvoice/${id}`);
  }

  getWarrantyInvoiceById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyInvoice/GetWarrantyInvoiceById/${id}`);
  }

  searchWarrantyInvoices(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyInvoice/SearchWarrantyInvoices`, filter);
  }

  getNextInvoiceNumbers(dealerCode: string): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyInvoice/GetNextInvoiceNumbers?dealerCode=${dealerCode}`);
  }

  // Reuses the already-working, approved-only search on the Order side -
  // this is how the invoice form's own claim/order picker finds orders
  // that are eligible to be batched into an invoice.
  searchApprovedOrders(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyOrder/SearchWarrantyOrders`, { ...filter, isApproved: true });
  }

  getWarrantyOrderById(id: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyOrder/GetWarrantyOrderById/${id}`);
  }

    printWarrantyInvoicePart(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyInvoice/GenerateWarrantyInvoicePartPdf/${id}`, {
      responseType: 'blob'
    });
  }
  
  printWarrantyInvoiceLabour(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyInvoice/GenerateWarrantyInvoiceLabourPdf/${id}`, {
      responseType: 'blob'
    });
  }
  
  printWarrantyClaimTag(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyInvoice/GenerateWarrantyClaimTagPdf/${id}`, {
      responseType: 'blob'
    });
  }

    searchInvoiceBatchNos(dealerCode: string, searchText: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/WarrantyInvoice/SearchInvoiceBatchNos`, {
      params: { dealerCode, searchText }
    });
  }
  
  searchInvoiceNos(dealerCode: string, searchText: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/WarrantyInvoice/SearchInvoiceNos`, {
      params: { dealerCode, searchText }
    });
  }
  
  getDistinctInvoiceLocations(dealerCode: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/WarrantyInvoice/GetDistinctInvoiceLocations`, {
      params: { dealerCode }
    });
  }

    searchClaimInvoiceNos(dealerCode: string, searchText: string): Observable<string[]> {
      return this.httpClient.get<string[]>(`${this.baseUrl}/WarrantyInvoice/SearchClaimInvoiceNos`, {
        params: { dealerCode, searchText }
      });
  }

  // RENAMED from BAPLWarrantyData - the invoice id now travels in the
  // request body ({ invoiceId }) rather than the URL path, so this is a
  // single fixed route (UATWarrantyData) instead of one URL per invoice.
  // UATWarrantyData(id: number): Observable<any> {
  //   return this.httpClient.post(`${this.baseUrl}/WarrantyInvoice/UATWarrantyData`, { invoiceId: id });
  // }
}