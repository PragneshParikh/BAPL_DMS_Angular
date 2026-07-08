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
  
}
