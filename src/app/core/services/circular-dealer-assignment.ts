import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CircularDealerAssignmentService {
  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getAssignmentsByCircularAndDealer(circularId: number) {
    return this.httpClient.get(`${this.baseUrl}/circular-dealer-assignment/${circularId}`);
  }

  addDealerPermissions(circularId: number, selectedDealers: any[]) {
    return this.httpClient.post(`${this.baseUrl}/circular-dealer-assignment/${circularId}/dealer-permissions`, selectedDealers);
  }

  deleteDealerPermissions(circularId: number, selectedDealers: any[]) {
    return this.httpClient.delete(`${this.baseUrl}/circular-dealer-assignment/${circularId}/dealer-permissions`, { body: selectedDealers });
  }

}
