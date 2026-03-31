import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReceiptEntryAddViewModel, ReceiptEntryEditModel, ReceiptEntryModel, ReceiptFilter } from '../../ViewModels/ReceiptEntryModel';
import { LedgerMaster } from '../../ViewModels/LedgerMasterViewModel';
import { LmsleadMaster } from '../../ViewModels/LmsleadMaster';

@Injectable({
  providedIn: 'root',
})
export class ReceiptEntryService {
  updateReceiptEntry(id: any, payload: ReceiptEntryAddViewModel) {
    throw new Error('Method not implemented.');
  }

  private apiUrl = environment.apiUrl;
  /**
   *
   */
  constructor(private http: HttpClient) {


  }

   getReceiptList(searchTerm: string): Observable<any[]> {
    let params = new HttpParams();

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<any[]>(`${this.apiUrl}/ReceiptEntry/getAllReceiptList`, { params });
  }
  getReceiptEntryList(filter: ReceiptFilter): Observable<ReceiptEntryModel[]> {

    let params = new HttpParams();

    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof ReceiptFilter];
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<ReceiptEntryModel[]>(
      `${this.apiUrl}/ReceiptEntry/getReceiptEntryList`,
      { params }
    );
  }

  getLocationList(dealerCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/LocationMaster/GetAllShowroomLocationsofCurrentDelaer?dealerCode=${dealerCode}`);
  }
  getNextReceiptNo(): Observable<string> {
    return this.http.get(`${this.apiUrl}/ReceiptEntry/getNextReceiptNo`, {
      responseType: 'text'
    });
  }

  getLedgerByType(type: string): Observable<LedgerMaster[]> {
    return this.http.get<LedgerMaster[]>(
      `${this.apiUrl}/ReceiptEntry/ledgerList?ledgerType=${type}`
    );
  }

  getLeadByMobileOrBooking(mobileNo: string | null, bookingId: number | null): Observable<LmsleadMaster> {
    let params = new HttpParams();
    if (mobileNo) params = params.set('mobileNo', mobileNo);
    if (bookingId !== null) params = params.set('bookingId', bookingId.toString());

    return this.http.get<LmsleadMaster>(`${this.apiUrl}/LMSLeadMaster/lmsLeadbyMob`, { params });
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

  checkLeadExist(mobileNo: string | null, bookingId: string | null) {
    return this.http.get<boolean>(
      `${this.apiUrl}/ReceiptEntry/checkLeadExist?mobileNo=${mobileNo ?? ''}&bookingId=${bookingId ?? ''}`
    );
  }

  downloadReceiptExcel() {
    return this.http.get(
      `${this.apiUrl}/ReceiptEntry/download`,
      { responseType: 'blob' }
    );
  }

}