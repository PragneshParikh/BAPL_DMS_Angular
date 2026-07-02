import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ZoneViewModel, ZoneDealerViewModel } from '../../ViewModels/models/ZoneViewModel';

@Injectable({
  providedIn: 'root',
})
export class ZoneMasterService {

  private readonly baseUrl = `${environment.apiUrl}/ZoneMaster`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // ZONE MASTER CRUD (existing)
  // =====================================================

  /** Get all zones */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAll`);
  }

  /** Get zone by ID */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  /** Create a new zone */
  create(zone: { zone: string; isActive: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Save`, zone);
  }

  /** Update a zone */
  update(id: number, zone: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Update/${id}`, zone);
  }

  /** Delete a zone */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Delete/${id}`);
  }

  // =====================================================
  // NEW — DEALER-BY-ZONE LOOKUPS (used by BgEmployee form)
  // =====================================================

  /** Get all distinct active zones for dropdown */
  getZones(): Observable<ZoneViewModel[]> {
    return this.http.get<ZoneViewModel[]>(`${this.baseUrl}/GetAll`);
  }

  /** Get dealers mapped to a specific zone, with city/state info */
  getDealersByZone(zone: string): Observable<ZoneDealerViewModel[]> {
    return this.http.get<ZoneDealerViewModel[]>(
      `${this.baseUrl}/GetDealersByZone/${zone}`
    );
  }
}