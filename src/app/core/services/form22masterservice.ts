import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class Form22masterservice {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) {

  }

  getForm22masterdetails(): Observable<any> {
    return this.httpClient.get<any[]>(`${this.baseUrl}/Form22Master`);
  }

  insertForm22Master(data: any) {
    return this.httpClient.post(
      `${this.baseUrl}/Form22Master`,
      data,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  updateForm22Master(id: number, data: any) {
    return this.httpClient.put(
      `${this.baseUrl}/Form22Master/${id}`,
      data, {
      headers: { 'Content-Type': 'application/json' }
    }

    );
  }

  downloadForm22MasterExcel() {
  return this.httpClient.get(`${this.baseUrl}/Form22Master/download`, {
    responseType: 'blob'
  });
}



}
