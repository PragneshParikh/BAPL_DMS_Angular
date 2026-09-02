import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgreegateTaxCodeMasterService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getAggregateTaxcodesAsync(search: string = ''): Observable<any> {

    let params = new HttpParams()
      .set('search', search ?? '');

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/AgreegateTaxCode`, { params });
  }

  getAggregateTaxCodesByAtaxCode(ataxCode: string): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/AgreegateTaxCode/details/${ataxCode}`);
  }

  getTaxCodesWithRate(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/AgreegateTaxCode/taxcodes-with-rate`);
  }

  insertAggregateTaxCode(data: any): Observable<any> {
    return this.httpClient.post(
      `${this.baseUrl}/AgreegateTaxCode`,
      data,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  UpdateAggregateTaxCode(id: number, data: any) {
    return this.httpClient.put(
      `${this.baseUrl}/AgreegateTaxCode/${id}`,
      data, {
      headers: { 'Content-Type': 'application/json' }
    }

    );
  }

  // Posts as multipart/form-data — do not set a Content-Type header manually here,
  // the browser needs to set its own boundary for FormData to be parsed correctly.
  importAggregateTaxCodeExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post(`${this.baseUrl}/AgreegateTaxCode/import`, formData);
  }

}