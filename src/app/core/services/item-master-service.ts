import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemMasterService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getItems(grpidno: number, search: string = '', itemtype?: number): Observable<any> {

    let params = new HttpParams()
      .set('grpidno', grpidno.toString())
      .set('search', search ?? '');

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    if (itemtype !== undefined) {
      params = params.set('itemtype', itemtype.toString());
    }

    return this.http.get<any>(`${this.baseUrl}/ItemMaster`, { params });
  }

  getPurchaseDetailsByModelNo(modelNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetPurchaseDetailsByModelNo/${modelNo}`);
  }

  downloadItemMasterExcel() {
    return this.http.get(`${this.baseUrl}/ItemMaster/download`, {
      responseType: 'blob'
    });
  }

  getItemsByItemType(itemtype: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetByItemType/${itemtype}`);
  }

  getPurchaseDetailsWithHsnTaxByModelNo(modelNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetPurchaseDetailsWithHsnTaxByModelNo/${modelNo}`);
  }

  fetchItemsByHsnTaxAndGroupId(groupId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/ItemMaster/GetItemsWithHsnTaxGroupId?groupId=${groupId}`);
  }

  getItemsByOEMModel(id: Number): Observable<any> {
    return this.http.get(`${this.baseUrl}/ItemMaster/GetItemsByOEMModel/${id}`)
  }

  updateItem(item: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/ItemMaster/${item.id}`, item);
  }

  getItemsByLocation(dealerLocation:string,customerLocation:string): Observable<any> {

    let params = new HttpParams()
      .set('dealerLocation', dealerLocation)
      .set('customerLocation', customerLocation);

    if (dealerLocation && dealerLocation.trim() !== '') {
      params = params.set('dealerLocation', dealerLocation.trim());
    }

    if (customerLocation && customerLocation.trim() !== '') {
      params = params.set('customerLocation', customerLocation.trim());
    }

    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetItemsByLocation`, { params });
  }

}