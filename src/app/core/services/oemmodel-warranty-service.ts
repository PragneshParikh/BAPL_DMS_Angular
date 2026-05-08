import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { OemModelWarranty } from '../../ViewModels/OemModelWarranty';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OemmodelWarrantyService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

 getAll(filter: any) {
  let params: any = {};

  if (filter.searchTerm)
    params.searchTerm = filter.searchTerm;

  if (filter.effectiveDateFrom)
    params.effectiveDateFrom = filter.effectiveDateFrom;

  if (filter.effectiveDateTo)
    params.effectiveDateTo = filter.effectiveDateTo;

  return this.http.get<any[]>(`${this.apiUrl}/oemmodelwarranty`, { params });
}

  //   GET BY ID
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/OEMModelWarranty/${id}`);
  }

  //   CREATE
  create(data: OemModelWarranty): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/OEMModelWarranty`, data);
  }

  // UPDATE
  update(id: number, data: OemModelWarranty): Observable<any> {
    return this.http.put(`${this.apiUrl}/OEMModelWarranty/${id}`, data);
  }

  //  DELETE
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/OEMModelWarranty/${id}`);
  }

  getLastEffectiveDate(oemmodelId: number) {
  return this.http.get(
    `${this.apiUrl}/OEMModelWarranty/last-effective-date`,
    { params: { oemmodelId } ,
  responseType:'text'}
  );
}

 downloadExcel() {
    return this.http.get(
      `${this.apiUrl}/OEMModelWarranty/download`,
      { responseType: 'blob' }
    );
  }
}
