import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PrefixService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  get() {
    return this.httpClient.get(`${this.baseUrl}/prefix`);
  }

  getPrefixByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/prefix/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getByDealerCode(dealerCode: string) {
    return this.httpClient.get(`${this.baseUrl}/prefix/${dealerCode}`);
  }

  saveSequence(sequence: any) {
    return this.httpClient.post(`${this.baseUrl}/prefix`, sequence);
  }

  saveSequenceForDealers(sequence: any) {
    return this.httpClient.post(`${this.baseUrl}/prefix/AddPrefixForDealers`, sequence);
  }

  getPrefixByDealerByModule(dealerCode: string, module: string): Observable<string> {
    return this.httpClient.get(`${this.baseUrl}/prefix/${dealerCode}/modules/${module}`, { responseType: 'text' });
  }
}
