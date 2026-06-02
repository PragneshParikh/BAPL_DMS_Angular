import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepairBillService {

  private baseUrl = environment.apiUrl

  constructor(private httpClient : HttpClient){
  }

  insertRepairBill(model: any): Observable<any> {
  return this.httpClient.post(`${this.baseUrl}/RepairBill/InsertRepairBill`,model);
}
getAllRepairBillList(search: any): Observable<any[]> {
  return this.httpClient.post<any[]>(`${this.baseUrl}/RepairBill/GetAllRepairBillList`,search);
}
  
}
