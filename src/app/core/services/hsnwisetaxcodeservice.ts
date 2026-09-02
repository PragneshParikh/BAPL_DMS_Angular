import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HsnWiseTaxCodeService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getHsncodeList(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/HSNWiseTaxCode/GetHsncodeList`);
  }

  getAggregateTaxCodeList(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/HSNWiseTaxCode/GetAggregateTaxCodeList`);
  }

  insertHsnwiseTaxcodedetails(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/HSNWiseTaxCode/InsertHsnwiseTaxcodedetails`,
      data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getHsnwiseTaxcodedetails(search: string = ''): Observable<any> {

    let params = new HttpParams()
      .set('search', search ?? '');

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    return this.httpClient.get<any[]>(`${this.baseUrl}/HSNWiseTaxCode/GetHsnwiseTaxcodedetails`, { params });
  }

  importHsnwiseTaxCodeExcel(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.httpClient.post(`${this.baseUrl}/HSNWiseTaxCode/import`, formData);
}
}
