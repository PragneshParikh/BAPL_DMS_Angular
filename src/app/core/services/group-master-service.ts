import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class GroupMasterService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  insertGroupMaster(model: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/GroupMaster/InsertGroup`, model);
  }

  updateGroupMaster(model: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/GroupMaster/UpdateGroupName`, model);
  }

  deleteGroupMaster(groupId: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/GroupMaster/DeleteGroup/${groupId}`);
  }
  getGroupMasterList(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/GroupMaster/GetAllGroups`);
  }
  getGroupMasterExcel(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/GroupMaster/GetGroupMasterExcel`, {
      responseType: 'blob'
    });
  }

}
