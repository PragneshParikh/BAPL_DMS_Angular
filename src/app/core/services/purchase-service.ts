import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  protected baseUrl = environment.apiUrl;
  protected erpBaseUrl = environment.ERPApiUrl;

  constructor(private httpClient: HttpClient) { }

  getPOList(orderType: string, dealerCode?: string, pageIndex?: number, pageSize?: number, poFilterForm?: any): Observable<any[]> {
    let params = new HttpParams();

    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }

    if (poFilterForm.dateFrom) {
      params = params.set('dateFrom', poFilterForm.dateFrom);
      params = params.set('dateTo', poFilterForm.dateTo);
    }

    if (poFilterForm.purchaseNo) {
      params = params.set('purchaseNo', poFilterForm.purchaseNo);
    }
    if (poFilterForm.isSubmitted) {
      params = params.set('isSubmitted', poFilterForm.isSubmitted);
    }

    params = params.set('pageIndex', pageIndex);
    params = params.set('pageSize', pageSize);
    params = params.set('orderType', orderType);

    return this.httpClient.get<any[]>(`${this.baseUrl}/PurchaseOrder/Polist`, { params });
  }

  downloadPurchaseOrderExcel(filters: any): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/PurchaseOrder/DownloadPurchaseOrderExcel`, {
      params: filters,
      responseType: 'blob'
    });
  }

  createPurchaseOrder(poModel: any): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/PurchaseOrder/create`, poModel);
  }

  sendToERP(poModel: any): Observable<any> {
    // return this.httpClient.post<any>(`${this.erpBaseUrl}/BAPLSOHeader`, JSON.stringify(poModel), {
    //   headers: { 'Content-Type': 'application/json' },
    // });
    return this.httpClient.post(`${this.baseUrl}/PurchaseOrder/SendToERP`, poModel);
  }

  getPOByNumber(poNumber: string): Observable<any> {
    const params = new HttpParams().set('code', poNumber);
    return this.httpClient.get<any>(`${this.baseUrl}/PurchaseOrder/list`, { params });
  }

  updatePO(poModel: any): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/PurchaseOrder/update`, poModel);
  }

  updatePOStatus(poNumber: string, status: boolean, saleOrderNo: string, consigneeCode: string): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/PurchaseOrder/updatePOStatus`, { poNumber, status, saleOrderNo, consigneeCode });
  }

  deletePOItems(poNumber: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.baseUrl}/PurchaseOrder/items/${poNumber}`);
  }

  getSubsidyValue(): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/PurchaseOrder/subsidy`);
  }

  // createPartsPurchaseOrder(poModel: any): Observable<any> {
  //   return this.httpClient.post<any>(`${this.baseUrl}/PurchaseOrder/parts/create`, poModel);
  // }

  // getPartsPOList(): Observable<any> {
  //   return this.httpClient.get<any>(`${this.baseUrl}/PurchaseOrder/parts/Polist`);
  // }
}