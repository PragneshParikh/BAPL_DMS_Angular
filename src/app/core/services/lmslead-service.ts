import { Injectable } from '@angular/core';
import { LeadResponse } from '../../ViewModels/LedgerResponse';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LMSLeadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getLeadByMobileOrBooking(mobileNo: string | null, bookingId: number | null): Observable<LeadResponse> {
    let params = new HttpParams();
    if (mobileNo) params = params.set('mobileNo', mobileNo);
    if (bookingId !== null) params = params.set('bookingId', bookingId.toString());

    return this.http.get<LeadResponse>(`${this.apiUrl}/LMSLeadMaster/lmsLeadbyMob`, { params });
  }

}
