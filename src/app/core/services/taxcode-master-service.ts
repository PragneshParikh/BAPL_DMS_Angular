import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaxCodeMasterService {

  private apiUrl = 'http://localhost:5215/api/TaxCodeMaster';

  constructor(private http: HttpClient) { }

  getAllTaxCodes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAllTaxCodes`);
  }

  getTaxCodeById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetTaxCodeById/${id}`);
  }

  addTaxCode(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddTaxCode`, model, { responseType: 'text' as 'json' });
  }

  updateTaxCode(model: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/UpdateTaxCode`, model, { responseType: 'text' as 'json' });
  }

  downloadTaxCodeExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/DownloadTaxCodeExcel`, {
      responseType: 'blob'
    });
  }
}