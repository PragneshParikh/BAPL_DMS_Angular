import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaxCodeMasterService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllTaxCodes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/TaxCodeMaster/GetAllTaxCodes`);
  }

  getTaxCodeById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/TaxCodeMaster/GetTaxCodeById/${id}`);
  }

  addTaxCode(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/TaxCodeMaster/AddTaxCode`, model, { responseType: 'text' as 'json' });
  }

  updateTaxCode(model: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/TaxCodeMaster/UpdateTaxCode`, model, { responseType: 'text' as 'json' });
  }

  downloadTaxCodeExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/TaxCodeMaster/DownloadTaxCodeExcel`, {
      responseType: 'blob'
    });
  }
}