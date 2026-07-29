import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepoBillingService {
  protected apiUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getRepoBillingData(chassisNo: string | null, regNo: string | null): Observable<any> {

    let params = new HttpParams()
      .set('regNo', regNo || null)
      .set('chassisNo', chassisNo || null);

    return this.httpClient.get(`${this.apiUrl}/repo-billing/GetRepoBillingByChassis`, { params });
  }
}
