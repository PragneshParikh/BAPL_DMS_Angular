import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RolewiseMenuService {
  protected baseURL = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getByRoleId(roleId: string | null): Observable<any> {
    if (roleId) {
      return this.httpClient.get(`${this.baseURL}/role-wise-menu/${roleId}`);
    }
    return this.httpClient.get(`${this.baseURL}/role-wise-menu/GetByRoleId`);
  }

}
