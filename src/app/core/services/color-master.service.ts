import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ColorMasterService {
  protected baseUrl = environment.apiUrl;
  /**
   *
   */
  constructor(private httpClient: HttpClient) { }

  getColor(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/color`);
  }

  getColorByPaged(searchTerm: string = null, pageIndex: number, pageSize: number): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/color/paged?searchTerm=${searchTerm}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }
}
