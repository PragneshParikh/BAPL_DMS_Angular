import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationMasterService {

  private apiUrl = "http://localhost:5215/api/LocationMaster/GetAllLocationMaster";

  constructor(private http: HttpClient) {}

  getAllLocationMaster(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}