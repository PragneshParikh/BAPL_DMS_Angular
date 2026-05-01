import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PerformaInvoiceRequest } from '../../ViewModels/PerformaInvoiceRequest';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PerformaInvoiceService {
   private apiUrl = environment.apiUrl;

   constructor(private http: HttpClient) {}

  generatePerformaInvoice(request: PerformaInvoiceRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/PerformaInvoice/createPerformaInvoice`, request);
  }
}
