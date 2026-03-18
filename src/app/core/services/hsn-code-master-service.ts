import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HsnCodeMasterViewModel } from '../../ViewModels/HSNCodeMaster/HSNCodeMaterViewModel';

@Injectable({
  providedIn: 'root',
})
export class HsnCodeMasterService {
   private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

getHSNCodeMasterList(search?: string): Observable<any> {

    let params = new HttpParams();

    if (search && search.trim()) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.apiUrl}/HSNCodeMaster/list`, { params });
  }


  updateHSNCodeMaster(id: number, data: any): Observable<any> {

    return this.http.put(`${this.apiUrl}/HSNCodeMaster/update/${id}`, data);
  }

  addHSNCodeMaster(data: any): Observable<any> {
   return this.http.post(`${this.apiUrl}/HSNCodeMaster/create`, data);
  }
 
  downloadHSNCodeMasterExcel() {
    return this.http.get(`${this.apiUrl}/HSNCodeMaster/download`,
      {
        responseType: 'blob'
      }
    );
  }
}
