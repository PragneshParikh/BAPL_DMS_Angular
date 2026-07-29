import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReceiptEntryAddViewModel, ReceiptEntryEditModel, ReceiptEntryModel, ReceiptFilter } from '../../ViewModels/ReceiptEntryModel';
import { LedgerMaster } from '../../ViewModels/LedgerMasterViewModel';

@Injectable({
  providedIn: 'root',
})
export class ReceiptEntryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getReceiptList(searchTerm: string, fromDate?: string, toDate?: string, dealerCode?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }

    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get<any[]>(
      `${this.apiUrl}/ReceiptEntry/getAllReceiptList`,
      { params }
    );
  }

  getReceiptEntryList(filter: ReceiptFilter): Observable<ReceiptEntryModel[]> {

    let params = new HttpParams();

    Object.keys(filter).forEach(key => {
      let value = filter[key as keyof ReceiptFilter];

      if (value !== null && value !== undefined && value !== '') {



        params = params.set(key, value as string);
      }
    });

    return this.http.get<ReceiptEntryModel[]>(
      `${this.apiUrl}/ReceiptEntry/getReceiptEntryList`,
      { params }
    );
  }

  getNextReceiptNo(): Observable<string> {
    return this.http.get(`${this.apiUrl}/ReceiptEntry/getNextReceiptNo`, {
      responseType: 'text'
    });
  }

  addReceiptEntry(data: ReceiptEntryAddViewModel) {
    return this.http.post(
      `${this.apiUrl}/ReceiptEntry/addReceiptEntry`,
      data
    );
  }

  getReceiptById(id: number) {
    return this.http.get<ReceiptEntryEditModel>(`${this.apiUrl}/ReceiptEntry/receiptById?id=${id}`);
  }

  updateReceipt(id: number, payload: any) {
    return this.http.put(`${this.apiUrl}/ReceiptEntry/editReceiptEntry?id=${id}`, payload);
  }

  checkReceiptExist(mobileNo: string | null, bookingId: string | null,recType:string | null,dealerCode:string | null) {
    return this.http.get<boolean>(
      `${this.apiUrl}/ReceiptEntry/checkReceiptExist?mobileNo=${mobileNo ?? ''}&bookingId=${bookingId ?? ''}&recType=${recType ?? ''}&dealerCode=${dealerCode ?? ''}`
    );
  }

  downloadReceiptExcel() {
    return this.http.get(
      `${this.apiUrl}/ReceiptEntry/download`,
      { responseType: 'blob' }
    );
  }
  
}