import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LocalPartsLocation {
  locationId: number;
  locationCode: string;
  locationName: string;
  dealerCode: string;
}

export interface LocalPartOption {
  partCode: string;
  partName: string;
  description: string;
  displayName: string | null;
  modelName: string | null;
  hsnCode: string;
  uom: number | null;
  purchaseRate: number;
  currentStock: number;
}

export interface LocalPartsSaveRequest {
  prefix: string;
  date: string;
  locationId: number;
  items: Array<{
    partCode: string;
    purchaseQuantity: number;
  }>;
}

export interface LocalPartsSaveResponse {
  prefix: string;
  date: string;
  locationId: number;
  locationName: string;
  items: Array<{
    partCode: string;
    description: string;
    previousStock: number;
    purchaseQuantity: number;
    totalStock: number;
  }>;
}

export interface LocalPartsTransactionUpdateRequest {
  prefix: string;
  purchaseQuantity: number;
}

export interface LocalPartsTransaction {
  id: number;
  receiptNumber: string;
  date: string;
  dealerCode: string;
  dealerName: string;
  locationId: number;
  locationCode: string;
  locationName: string;
  partCode: string;
  partName: string;
  description: string;
  previousStock: number;
  purchaseQuantity: number;
  totalStock: number;
}

@Injectable({ providedIn: 'root' })
export class LocalPartsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getWorkshopLocations(): Observable<LocalPartsLocation[]> {
    return this.http.get<LocalPartsLocation[]>(`${this.baseUrl}/LocalParts/locations`);
  }

  getParts(locationId: number): Observable<LocalPartOption[]> {
    return this.http.get<LocalPartOption[]>(`${this.baseUrl}/LocalParts/parts`, {
      params: { locationId }
    });
  }

  save(request: LocalPartsSaveRequest): Observable<LocalPartsSaveResponse> {
    return this.http.post<LocalPartsSaveResponse>(`${this.baseUrl}/LocalParts`, request);
  }

  getTransactions(fromDate: string, toDate: string, locationId: number | null): Observable<LocalPartsTransaction[]> {
    let params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate);

    if (locationId !== null) {
      params = params.set('locationId', locationId);
    }

    return this.http.get<LocalPartsTransaction[]>(`${this.baseUrl}/LocalParts/transactions`, { params });
  }

  getTransaction(id: number): Observable<LocalPartsTransaction> {
    return this.http.get<LocalPartsTransaction>(`${this.baseUrl}/LocalParts/transactions/${id}`);
  }

  updateTransaction(id: number, request: LocalPartsTransactionUpdateRequest): Observable<LocalPartsTransaction> {
    return this.http.put<LocalPartsTransaction>(`${this.baseUrl}/LocalParts/transactions/${id}`, request);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/LocalParts/transactions/${id}`);
  }
}
