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

export interface PartsD2DLineRequest {
  partCode: string;
  transferQuantity: number;
}

export interface PartsD2DSaveRequest {
  prefix: string;
  date: string;
  fromLocationId: number;
  toLocationId: number;
  items: PartsD2DLineRequest[];
}

export interface PartsD2DLineResponse {
  partCode: string;
  description: string;
  transferQuantity: number;
  fromPreviousStock: number;
  fromClosingStock: number;
  toPreviousStock: number;
  toClosingStock: number;
  rate: number;
}

export interface PartsD2DSaveResponse {
  prefix: string;
  d2DBillNo: string;
  date: string;
  fromLocationCode: string;
  toLocationCode: string;
  items: PartsD2DLineResponse[];
}

export interface PartsD2DTransaction {
  transactionId: number;
  d2DBillNo: string;
  prefix: string;
  date: string;
  createdDate: string;
  receivedDate: string;
  fromLocationCode: string;
  fromLocationName: string;
  fromDealerCode: string;
  toLocationCode: string;
  toLocationName: string;
  toDealerCode: string;
  partCode: string;
  description: string;
  transferQuantity: number;
  fromPreviousStock: number;
  fromClosingStock: number;
  toPreviousStock: number;
  toClosingStock: number;
  rate: number;
  isIncomingForCaller: boolean;
  isReceived: boolean;
}

export interface PartsD2DNotification {
  d2DBillNo: string;
  prefix: string;
  invoiceDate: string;
  receivedDate: string;
  fromLocationName: string;
  fromDealerCode: string;
  numberOfItems: number;
  isReceived: boolean;
}

export interface PartsD2DReceiptItem {
  partCode: string;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
}

export interface PartsD2DReceipt {
  d2DBillNo: string;
  prefix: string;
  invoiceDate: string;
  receivedDate: string;
  fromLocationCode: string;
  fromLocationName: string;
  fromDealerCode: string;
  toLocationCode: string;
  toLocationName: string;
  isReceived: boolean;
  items: PartsD2DReceiptItem[];
}

export function formatPartsD2DBillNo(billNo: string | null | undefined): string {
  const value = String(billNo ?? '').trim();
  if (/^\d+$/.test(value)) {
    return value;
  }

  const previousGeneratedId = value.match(/^D2D-(\d{8})-([A-F0-9]{32})$/i);
  if (previousGeneratedId) {
    return `D2D-${previousGeneratedId[1].slice(2)}-${previousGeneratedId[2].slice(0, 6).toUpperCase()}`;
  }

  const compactGuid = value.replace(/-/g, '');
  if (/^[A-F0-9]{32}$/i.test(compactGuid)) {
    return `D2D-${compactGuid.slice(0, 12).toUpperCase()}`;
  }

  return value;
}

@Injectable({ providedIn: 'root' })
export class LocalPartsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getWorkshopLocations(): Observable<LocalPartsLocation[]> {
    return this.http.get<LocalPartsLocation[]>(`${this.baseUrl}/LocalParts/locations`);
  }

  getD2DWorkshopLocations(): Observable<LocalPartsLocation[]> {
    return this.http.get<LocalPartsLocation[]>(`${this.baseUrl}/LocalParts/d2d/locations`);
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

  savePartsD2D(request: PartsD2DSaveRequest): Observable<PartsD2DSaveResponse> {
    return this.http.post<PartsD2DSaveResponse>(`${this.baseUrl}/LocalParts/d2d`, request);
  }

  getNextPartsD2DBillNo(): Observable<{ d2DBillNo: string }> {
    return this.http.get<{ d2DBillNo: string }>(`${this.baseUrl}/LocalParts/d2d/next-bill-no`);
  }

  getPartsD2DTransactions(
    fromLocationId: number,
    toLocationId: number
  ): Observable<PartsD2DTransaction[]> {
    const params = new HttpParams()
      .set('fromLocationId', fromLocationId)
      .set('toLocationId', toLocationId);
    return this.http.get<PartsD2DTransaction[]>(`${this.baseUrl}/LocalParts/d2d/transactions`, { params });
  }

  getPartsD2DHistory(): Observable<PartsD2DTransaction[]> {
    return this.http.get<PartsD2DTransaction[]>(`${this.baseUrl}/LocalParts/d2d/history`);
  }

  getPartsD2DNotifications(): Observable<PartsD2DNotification[]> {
    return this.http.get<PartsD2DNotification[]>(`${this.baseUrl}/LocalParts/d2d/notifications`);
  }

  getPartsD2DReceipt(d2dBillNo: string): Observable<PartsD2DReceipt> {
    return this.http.get<PartsD2DReceipt>(
      `${this.baseUrl}/LocalParts/d2d/receipt/${encodeURIComponent(d2dBillNo)}`
    );
  }

  acceptPartsD2DReceipt(d2dBillNo: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/LocalParts/d2d/receipt/${encodeURIComponent(d2dBillNo)}/accept`,
      {}
    );
  }

  rejectPartsD2DReceipt(d2dBillNo: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/LocalParts/d2d/receipt/${encodeURIComponent(d2dBillNo)}`
    );
  }

  updatePartsD2DTransaction(
    transactionId: number,
    transferQuantity: number
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/LocalParts/d2d/transactions/${transactionId}`,
      { transferQuantity }
    );
  }

  deletePartsD2DTransaction(transactionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/LocalParts/d2d/transactions/${transactionId}`);
  }
}
