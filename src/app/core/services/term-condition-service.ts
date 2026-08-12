import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TermConditionService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getTermConditionMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/TermCondition/GetAllTermConditions`);
  }

  insertTermConditionMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/TermCondition/AddTermCondition`, model);
  }

  updateTermConditionMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/TermCondition/UpdateTermCondition`, model);
  }

  deleteTermConditionMaster(conditionId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/TermCondition/DeleteTermCondition/${conditionId}`);
  }

  getTermConditionMasterExcel():Observable<any>{
    return this.httpClient.get(`${this.baseUrl}/TermCondition/GetTermConditionMasterExcel`,{
       responseType: 'blob'
    });
  }

  getTermConditionsByModule(conditionModule: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/TermCondition/GetTermConditionsByModule/${conditionModule}`);
  }

}
