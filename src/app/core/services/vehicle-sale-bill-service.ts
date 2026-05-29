import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateSaleDetailsVM, VehicleSaleChasisRequest, VehicleSaleChasisResponse } from '../../ViewModels/VehicleSaleBill';
import { VehicleSaleListChasisResponse } from '../../ViewModels/VehicleSaleChasisResponse';
import { Form22SlipViewModel } from '../../ViewModels/Form22SlipViewModel';

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

 getAllVehicleSaleBills(dealerCode?:string,search?: string, fromDate?: Date, toDate?: Date, erpStatus?: string): Observable<any[]> {
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
  if(dealerCode)
  {
    params =params.set('dealerCode',dealerCode)
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

getChassisListPDIOK(dealerCode: string, ledgerId: number): Observable<VehicleSaleListChasisResponse[]> {
  return this.http.get<VehicleSaleListChasisResponse[]>(
    `${this.apiUrl}/VehicleSaleBill/ChassisListPDIOK?dealerCode=${dealerCode}&ledgerId=${ledgerId}`
  );
}

getAllChassisWithPDIStatus(dealerCode: string, ledgerId: number): Observable<VehicleSaleListChasisResponse[]> {
  return this.http.get<VehicleSaleListChasisResponse[]>(
    `${this.apiUrl}/VehicleSaleBill/ChassisList?dealerCode=${dealerCode}&ledgerId=${ledgerId}`
  );
}

getVehicleSaleBillById(id: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/VehicleSaleBill/${id}`);
}


//To be modified when SaleBill is created

confirmInvoice(saleBillNo: string) {
  return this.http.put<number>(
    `${this.apiUrl}/VehicleSaleBill/ConfirmInvoice?saleBillNo=${saleBillNo}`,
    null  
  );
}

updateRegistrationAndReserveChassis(
    saleBillNo: string,
    details: UpdateSaleDetailsVM[]
  ): Observable<any> {

    const params = new HttpParams().set('saleBillNo', saleBillNo);

    return this.http.put(
      `${this.apiUrl}/VehicleSaleBill/UpdateRegistrationAndReserveChassis`,
      details,
      { params }
    );
  }


  getForm22(chassisNo: string): Observable<Form22SlipViewModel> {
    const params = new HttpParams().set('chassisNo', chassisNo);

    return this.http.get<Form22SlipViewModel>(
      `${this.apiUrl}/VehicleSaleBill/Form22`,
      { params }
    );
  }

  downloadExcel(fromDate?: Date, toDate?: Date) {
     let params = new HttpParams();

   if (fromDate) {
    params = params.set('fromDate', fromDate.toISOString());
  }

  if (toDate) {
    params = params.set('toDate', toDate.toISOString());
  }
  
  return this.http.get(
    `${this.apiUrl}/VehicleSaleBill/download`,
    {params:params,
      responseType: 'blob' }
  );
}

getPolicyNo(chassisNo:string) : Observable<any>{
  return this.http.get<any>(`${this.apiUrl}/VehicleSaleBill/PolicyNos/${chassisNo}`)
}

}
