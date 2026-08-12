import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WarrantyJCClaimService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertWarrantyJCClaim(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyJCClaim/InsertWarrantyJCClaim`, model);
  }

  // Deliberately narrow payload - only DealerObservation/RootCauseAnalysis
  // per line, matched by each line's DetailId. Every other field on this
  // form is read-only once a claim is already saved.
  updateWarrantyJCClaim(model: { claimId: number; lines: { detailId: number; dealerObservation: string; rootCauseAnalysis: string }[] }): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/WarrantyJCClaim/UpdateWarrantyJCClaim`, model);
  }

  // Powers the full-page Warranty Claim List (navigated to from the
  // hamburger icon on Warranty JobCard Claim).
  searchWarrantyJCClaims(filter: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyJCClaim/SearchWarrantyJCClaims`, filter);
  }

  // Generates a PDF of the claim list honoring the same filters as the
  // on-screen search - not just the current page.
  printWarrantyJCClaimList(filter: any): Observable<Blob> {
    return this.httpClient.post(`${this.baseUrl}/WarrantyJCClaim/PrintWarrantyJCClaimList`, filter, { responseType: 'blob' });
  }

  // Generates a PDF for a single claim (used by the grid's per-row print button).
  printWarrantyJCClaim(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/WarrantyJCClaim/PrintWarrantyJCClaim/${id}`, { responseType: 'blob' });
  }

  // Blocked server-side (400, with a descriptive message) if the claim is
  // still linked to a Warranty Order - delete or update that order first.
  deleteWarrantyJCClaim(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/WarrantyJCClaim/DeleteWarrantyJCClaim/${id}`);
  }

}