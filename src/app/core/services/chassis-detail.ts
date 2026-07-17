import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChassisDetailService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  updateChassisNewLedger(ledgerId: Number, dealerCode: string, chassisNo: string): Observable<any> {
    const params = new HttpParams()
      .set('ledgerId', ledgerId.toString())
      .set('dealerCode', dealerCode)
      .set('chassisNo', chassisNo);

    return this.httpClient.put(`${this.baseUrl}/chassis-details/UpdateNewLedgerForChassis`, {}, { params });
  }
}
