import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaxService {
  protected baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getTaxList(itemCode: string, dealerLocation: string, customerLocation: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tax/GetTax?itemCode=${itemCode}&dealerLocation=${dealerLocation}`);
  }
}
