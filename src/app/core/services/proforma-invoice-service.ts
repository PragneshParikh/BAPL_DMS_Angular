import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PerformaInvoiceRequest } from '../../ViewModels/PerformaInvoiceRequest';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProformaInvoiceService {
   private apiUrl = environment.apiUrl;

   constructor(private http: HttpClient) {}

  generatePerformaInvoice(request: PerformaInvoiceRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/PerformaInvoice/createPerformaInvoice`, request);
  }
  
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/PerformaInvoice`);
  }

  // GET BY ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // CREATE
  create(invoice: any): Observable<any> {
    return this.http.post(this.apiUrl, invoice);
  }

  // UPDATE
  update(invoice: any): Observable<any> {
    return this.http.put(this.apiUrl, invoice);
  }

  // DELETE
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
