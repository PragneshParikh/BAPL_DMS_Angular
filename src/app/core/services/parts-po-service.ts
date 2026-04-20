import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PartsPoService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createPartsPurchaseOrder(poModel: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PurchaseOrder/parts/create`, poModel);
  }

  getPartsPOList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/PurchaseOrder/parts/Polist`);
  }
}
