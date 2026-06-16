import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OccupationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getOccupationMasters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/OccupationMaster/GetOccupationMasters`);
  }

   getActiveOccupations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/OccupationMaster/GetActiveOccupation`);
  }

  addOccupationMaster(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/OccupationMaster/AddOccupationMaster`, data);
  }

  updateOccupationMaster(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/OccupationMaster/UpdateOccupationMaster/${id}`, data);
  }

  getPaginatedOccupationMasters(occupationName?: string, page: number = 1, pageSize: number = 10): Observable<any>
   {
    let url = `${this.apiUrl}/OccupationMaster/GetPaginatedOccupationMasters?page=${page}&pageSize=${pageSize}`;
    if (occupationName) {
      url += `&occupationName=${encodeURIComponent(occupationName)}`;
    }
    return this.http.get(url);
  }
}

