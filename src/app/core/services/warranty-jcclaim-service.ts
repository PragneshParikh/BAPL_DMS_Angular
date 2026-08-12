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

}