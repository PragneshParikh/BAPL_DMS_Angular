import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { debug } from 'console';

@Injectable({
  providedIn: 'root',
})
export class PdiChecklistmasterService {
  private baseUrl = environment.apiUrl

  constructor(private httpClient: HttpClient) { }
  getPdiChecklistMasterList(pdicheckName?: string): Observable<any> {
    //debugger;
    let params: any = {};

    if (pdicheckName) params.pdiCheckName = pdicheckName;

    return this.httpClient.get<any[]>(`${this.baseUrl}/PdiCheclistMaster/GetPdiChecklistMasterList`, { params });
  }
  insertPdiChecklistMaster(payload:any):Observable<any>{
    return this.httpClient.post<any[]>(`${this.baseUrl}/PdiCheclistMaster/InsertPdiChecklistMaster`,payload)
  }
  updatePdiChecklistMaster(payload: any): Observable<any> {
  return this.httpClient.put<any>(
    `${this.baseUrl}/PdiCheclistMaster/UpdatePdiChecklistMaster`,
    payload
  );
}

deletePdiChecklistMaster(pdicheckId: number): Observable<any> {
  return this.httpClient.delete<any>(
    `${this.baseUrl}/PdiCheclistMaster/DeletePdiChecklistMaster/${pdicheckId}`
  );
}

}
