import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DealerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // getDealers(): Observable<any[]> {
  //   return this.http.get<any[]>(this.apiUrl + '/DealerMaster/list');
  // }

   getDealers(search?: string): Observable<any> {

    let params = new HttpParams();

    if (search && search.trim()) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.apiUrl}/DealerMaster/list`, { params });
  }


  downloadDealerExcel() {
  return this.http.get(
    `${this.apiUrl}/DealerMaster/download`,
    { responseType: 'blob' }
  );
}
}
