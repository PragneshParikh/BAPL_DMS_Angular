import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehicleSaleChasisRequest, VehicleSaleChasisResponse } from '../../ViewModels/VehicleSaleBill';

@Injectable({
  providedIn: 'root',
})
export class VehicleSaleBillService {
   private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

   getNextSaleBillNo(): Observable<string> {
    return this.http.get(`${this.apiUrl}/VehicleSaleBill/getNextSaleBillNo`, {
      responseType: 'text'
    });
  }

  createVehicleSaleBill(data: any) {
    return this.http.post(`${this.apiUrl}/VehicleSaleBill`, data);
  }
  getAllVehicleSaleBills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/VehicleSaleBill`);
  }
  updateVehicleSaleBill(id: number, data: any) {
  return this.http.put(`${this.apiUrl}/VehicleSaleBill/${id}`, data);
}
 sendToERP(saleBillNo: number): Observable<any> {
    // Backend expects [FromBody] string poNumber
    return this.http.post<any>(`${this.apiUrl}/VehicleSaleBill/SendToERP`, JSON.stringify(saleBillNo), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getChasisPricing(dealerCode: string, ledgerId: number) {
  return this.http.get<any>(
    `${this.apiUrl}/VehicleSaleBill/GetChasisPricing?dealerCode=${dealerCode}&ledgerId=${ledgerId}`
  );
}

}
