import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class KitCreationService {

  private baseURL = environment.apiUrl;

  constructor(private httpclient: HttpClient) { }

  getKits(): Observable<any> {
    return this.httpclient.get(`${this.baseURL}/kit`);
  }

}
