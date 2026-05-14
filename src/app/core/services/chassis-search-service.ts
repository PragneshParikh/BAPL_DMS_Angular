import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChassisSearchService {
  protected baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getChassisDetails(chassisNumber: string) {
    return this.httpClient.get(`${this.baseUrl}/chassis/${chassisNumber}`);
  }
}
