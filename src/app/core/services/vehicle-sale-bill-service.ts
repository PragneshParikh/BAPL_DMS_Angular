//src\app\core\services\vehicle-sale-bill-service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateSaleDetailsVM, VehicleSaleChasisRequest, VehicleSaleChasisResponse } from '../../ViewModels/VehicleSaleBill';
import { VehicleSaleListChasisResponse } from '../../ViewModels/VehicleSaleChasisResponse';
import { Form22SlipViewModel } from '../../ViewModels/Form22SlipViewModel';

// ---------- Cogxim (old DMS) sale register Excel import ----------
export interface ImportField {
  key: string; label: string; group: 'Header' | 'Detail'; required: boolean; target: string; aliases: string[];
}
export interface ImportPreview {
  fileName: string;
  sheets: { name: string; rows: number }[];
  sheetName: string;
  headerRow: number;
  totalRows: number;
  headers: string[];
  suggestedMapping: { [key: string]: string };
  sampleRows: { [header: string]: string | null }[];
  fields: ImportField[];
}
export interface ImportOptions {
  sheetName?: string | null;
  headerRow: number;
  mapping: { [key: string]: string };
  defaultDealerCode?: string | null;
  defaultLocation?: string | null;
  prefixDealerCodeOnBillNo: boolean;
  createMissingCustomers: boolean;
  updateExisting: boolean;
  generateSaleBillNo: boolean;
  createMissingMasters: boolean;
  dryRun: boolean;
}
export interface ImportIssue { rowNo: number; saleBillNo?: string; chassisNo?: string; level: 'Error' | 'Skipped' | 'Warning' | 'Info'; message: string; }
export interface ImportResult {
  dryRun: boolean; fileName: string; sheetName: string; totalRows: number;
  billsInFile: number; billsReady: number; vehiclesReady: number;
  billsImported: number; vehiclesImported: number; customersCreated: number;
  billsToUpdate: number; billsUpdated: number; vehiclesUpdated: number; customersUpdated: number;
  oemModelsCreated: number; itemModelsCreated: number; financiersCreated: number; citiesCreated: number; occupationsCreated: number;
  mastersCreated: string[]; engine?: string;
  rowsSkipped: number; rowsWithErrors: number; warnings: number; totalAmount: number;
  fromDate?: string; toDate?: string;
  dealers: { dealerCode: string; bills: number; vehicles: number; amount: number }[];
  issues: ImportIssue[]; issuesTruncated: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleSaleBillService {
  private apiUrl = environment.apiUrl;
  private erpBaseUrl = environment.ERPApiUrl;

  constructor(private http: HttpClient) { }

  getNextSaleBillNo(): Observable<string> {
    return this.http.get(`${this.apiUrl}/VehicleSaleBill/getNextSaleBillNo`, {
      responseType: 'text'
    });
  }

  createVehicleSaleBill(data: any) {
    return this.http.post(`${this.apiUrl}/VehicleSaleBill`, data);
  }

  deleteVehicleSaleBill(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/VehicleSaleBill/${id}`);
  }

  getAllVehicleSaleBills(dealerCode?: string, search?: string, fromDate?: Date, toDate?: Date, erpStatus?: string): Observable<any[]> {
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
    if (dealerCode) {
      params = params.set('dealerCode', dealerCode)
    }

    return this.http.get<any[]>(`${this.apiUrl}/VehicleSaleBill`, { params });
  }

  updateVehicleSaleBill(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/VehicleSaleBill/${id}`, data);
  }

  sendToERP(dealerCode: string, saleBillId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/VehicleSaleBill/SendToERP?dealerCode=${dealerCode}&id=${saleBillId}`,
      {}
    );
  }

  getChassisListPDIOK(dealerCode: string, ledgerId: number): Observable<VehicleSaleListChasisResponse[]> {
    return this.http.get<VehicleSaleListChasisResponse[]>(
      `${this.apiUrl}/VehicleSaleBill/ChassisListPDIOK?dealerCode=${dealerCode}&ledgerId=${ledgerId}`
    );
  }

  getAllChassisWithPDIStatus(dealerCode: string, ledgerId: number,locCode:string): Observable<VehicleSaleListChasisResponse[]> {
    return this.http.get<VehicleSaleListChasisResponse[]>(
      `${this.apiUrl}/VehicleSaleBill/ChassisList?dealerCode=${dealerCode}&ledgerId=${ledgerId}&locCode=${locCode}`
    );
  }

  getVehicleSaleBillById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/VehicleSaleBill/${id}`);
  }

   getVehicleDeletionPrerequisites(saleBillId: number): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/VehicleSaleBill/PreCheckDelete?saleBillId=${saleBillId}`
  );
}
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
      {
        params: params,
        responseType: 'blob'
      }
    );
  }

  getPolicyNo(chassisNo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/VehicleSaleBill/PolicyNos/${chassisNo}`)
  }

  sendSaleBillToERP(saleBill: any): Observable<any> {
    return this.http.post<any>(`${this.erpBaseUrl}/BAPLregistration`, JSON.stringify(saleBill), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  downloadSaleBillPdf(id: number) {

    return this.http.get(
      `${this.apiUrl}/VehicleSaleBill/Download/${id}`,
      {
        responseType: 'blob'
      }
    );
  }

  downloadMultipleSaleBills(ids: number[]) {

    return this.http.post(
      `${this.apiUrl}/VehicleSaleBill/DownloadMultiple`,
      ids,
      {
        responseType: 'blob'
      }
    );


  }
  downloadMultipleForm22(ids: number[]) {
    return this.http.post(
      `${this.apiUrl}/VehicleSaleBill/DownloadMultipleForm22`,
      ids,
      { responseType: 'blob' }
    );
  }

  downloadMultipleCombined(form22Ids: number[], invoiceIds: number[]) {
    return this.http.post(
      `${this.apiUrl}/VehicleSaleBill/DownloadMultipleCombined`,
      { form22Ids, invoiceIds },
      { responseType: 'blob' }
    );
  }

  // ---------- Cogxim sale register import (Admin / SuperAdmin) ----------
  getCogximImportFields(): Observable<ImportField[]> {
    return this.http.get<ImportField[]>(`${this.apiUrl}/VehicleSaleBill/import/fields`);
  }

  previewCogximImport(file: File, sheetName?: string | null, headerRow = 1): Observable<ImportPreview> {
    const fd = new FormData();
    fd.append('file', file);
    if (sheetName) fd.append('sheetName', sheetName);
    fd.append('headerRow', String(headerRow || 1));
    return this.http.post<ImportPreview>(`${this.apiUrl}/VehicleSaleBill/import/preview`, fd);
  }

  importCogximSales(file: File, options: ImportOptions): Observable<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('options', JSON.stringify(options));
    return this.http.post<ImportResult>(`${this.apiUrl}/VehicleSaleBill/import`, fd);
  }
}
