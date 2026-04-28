import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehicleSaleChasisRequest, VehicleSaleChasisResponse } from '../../ViewModels/VehicleSaleBill';
import { VehicleSaleListChasisResponse } from '../../ViewModels/VehicleSaleChasisResponse';

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
  // getAllVehicleSaleBills(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/VehicleSaleBill`);
  // }

 getAllVehicleSaleBills(search?: string, fromDate?: Date, toDate?: Date, erpStatus?: string): Observable<any[]> {
  let params = new HttpParams();

  if (search) {
    params = params.set('search', search);
  }

  if (fromDate) {
    params = params.set('fromDate', fromDate.toISOString());
  }

  if (toDate) {
    params = params.set('toDate', toDate.toISOString());
  }
  if (erpStatus) {
    params = params.set('erpStatus', erpStatus);
  }

  return this.http.get<any[]>(`${this.apiUrl}/VehicleSaleBill`, { params });
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

getChassisListPDIOK(dealerCode: string): Observable<VehicleSaleListChasisResponse[]> {
  return this.http.get<VehicleSaleListChasisResponse[]>(
    `${this.apiUrl}/VehicleSaleBill/ChassisListPDIOK?dealerCode=${dealerCode}`
  );
}
getVehicleSaleBillById(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/VehicleSaleBill/${id}`);
}


//To be modified when SaleBill is created

confirmInvoice(saleBillNo: string) {
  return this.http.put<boolean>(
    `${this.apiUrl}/VehicleSaleBill/ConfirmInvoice?saleBillNo=${saleBillNo}`,
    null   // ✅ no body
  );
}
}
