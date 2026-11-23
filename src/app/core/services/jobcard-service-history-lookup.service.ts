//src\app\core\services\jobcard-service-history-lookup.service.ts
// Job card creation: search the imported service history (JobCardServiceHistory) by Chassis No / Reg No.
// API: DMS_BAPL/Controllers/JobCardServiceHistoryLookupController.cs (any logged-in user).
// scope 'dealer' = only the logged-in dealer's jobs (the API takes the dealer from the token), 'all' = every dealer.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** One type-ahead hit (JcshSuggestion) */
export interface ShSuggestion {
  value: string;
  kind: 'Chassis No' | 'Reg No' | string;
  chassisNo?: string | null;
  regNo?: string | null;
  model?: string | null;
  dealerCode?: string | null;
  jobs: number;
  lastJobDate?: string | null;
}

/** One vehicle of the history card (JcshCardVehicle). Job rows keep the DB column names (PascalCase). */
export interface ShVehicle {
  chassisNo?: string | null;
  regNo?: string | null;
  model?: string | null;
  saleSource?: string | null;   // "DMS" = DMS sale bill, "Import" = imported history only
  soldThrough?: string | null;
  saleInvoiceNo?: string | null;
  saleDate?: string | null;
  colour?: string | null;
  bookingId?: string | null;
  jobs: Record<string, any>[];
}

export interface ShHistoryCard {
  vehicles: ShVehicle[];
  totalJobs: number;
  truncated: boolean;
  limit: number;
}

export type ShScope = 'dealer' | 'all';

@Injectable({ providedIn: 'root' })
export class JobcardServiceHistoryLookupService {
  private readonly baseUrl = `${environment.apiUrl}/jobcard-servicehistory-lookup`;

  constructor(private http: HttpClient) {}

  /** Chassis / Reg numbers starting with term (letters/digits only, min 2). */
  suggest(term: string, scope: ShScope = 'dealer'): Observable<ShSuggestion[]> {
    return this.http.get<ShSuggestion[]>(`${this.baseUrl}/suggest`, { params: new HttpParams().set('term', term).set('scope', scope) });
  }

  /** Exact Chassis No or Reg No → vehicle(s) with their jobs, newest first. */
  vehicle(value: string, scope: ShScope = 'dealer'): Observable<ShHistoryCard> {
    return this.http.get<ShHistoryCard>(`${this.baseUrl}/vehicle`, { params: new HttpParams().set('value', value).set('scope', scope) });
  }
}
