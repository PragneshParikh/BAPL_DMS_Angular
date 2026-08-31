// src\app\core\services\repair-bill-service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepairBillService {

  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) {
  }

  insertRepairBill(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/RepairBill/InsertRepairBill`, model);
  }

  getAllRepairBillList(search: any): Observable<any[]> {
    return this.httpClient.post<any[]>(`${this.baseUrl}/RepairBill/GetAllRepairBillList`, search);
  }

  updateRepairBill(model: any): Observable<any> {
    return this.httpClient.put<any[]>(`${this.baseUrl}/RepairBill/UpdateRepairBill`, model);
  }

  getRepairBillById(id: number): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/RepairBill/GetRepairBillById/${id}`);
  }
  // generateRepairBillPerformaDetails(dealerCode:string,repairBillId :number){
  //   return this.httpClient.post<any[]>(`${this.baseUrl}/RepairBill/GenerateRepairBillPerformaDetails/${dealerCode}/${repairBillId}`,{})
  // }
  deleteRepairbill(id: number, role: string) {
    return this.httpClient.delete(`${this.baseUrl}/RepairBill/DeleteRepairbill/${id}/${role}`);
  }
  generateRepairBillPerformaDetails(
    dealerCode: string,
    repairBillId: number
  ): Observable<any> {

    return this.httpClient.post<any>(
      `${this.baseUrl}/RepairBill/GenerateRepairBillPerformaDetails/${dealerCode}/${repairBillId}`,
      {}
    );
  }


}
