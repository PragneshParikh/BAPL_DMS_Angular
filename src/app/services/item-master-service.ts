import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ItemMasterService {
  protected baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getItems(grpidno:number){
  return this.http.get(`${this.baseUrl}/ItemMaster?grpidno=${grpidno}`);
}


}
