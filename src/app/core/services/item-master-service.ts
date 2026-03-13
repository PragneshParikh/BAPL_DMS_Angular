import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemMasterService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getItems(grpidno: number, search: string=''): Observable<any> {

    let params = new HttpParams()
      .set('grpidno', grpidno.toString())
      .set('search',search ?? '');

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<any>(`${this.baseUrl}/ItemMaster`, { params });
  }

  downloadItemMasterExcel() {
    return this.http.get(`${this.baseUrl}/ItemMaster/download`, {
      responseType: 'blob'
    });
  }

}