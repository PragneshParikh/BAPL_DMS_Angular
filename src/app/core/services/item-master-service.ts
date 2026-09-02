import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ItemMasterService {


  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  insertItem(itemObj: any) {
    return this.http.post<any>(
      `${this.baseUrl}/ItemMaster`,
      itemObj
    );
  }

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

  // NEW — uploads an .xlsx file for bulk insert/update of spares/parts.
  importItemMasterExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/ItemMaster/import`, formData);
  }

  getItemsByItemType(itemtype: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetByItemType/${itemtype}`);
  }

  getPurchaseDetailsWithHsnTaxByModelNo(modelNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetPurchaseDetailsWithHsnTaxByModelNo/${modelNo}`);
  }

  fetchItemsByHsnTaxAndGroupId(groupId: number,dealerCode?:string): Observable<any> {
    return this.http.get(`${this.baseUrl}/ItemMaster/GetItemsWithHsnTaxGroupId?groupId=${groupId}&dealerCode=${dealerCode}`);
  }

  getItemsByOEMModel(id: Number): Observable<any> {
    return this.http.get(`${this.baseUrl}/ItemMaster/GetItemsByOEMModel/${id}`)
  }

  // CHANGED —
  // 1) Guards against a missing/falsy item.id so we never silently PUT to
  //    ".../ItemMaster/undefined".
  // 2) No longer trusts a 2xx status alone as proof the row was saved. The
  //    backend can return 200 with a null/empty body when its lookup finds
  //    no matching row (e.g. duplicate Itemcode values, a stale id) — that
  //    previously looked identical to a successful save from here. Now an
  //    empty response is turned into an error so the component's existing
  //    error handler (and its "something went wrong" toast) actually fires.
  updateItem(item: any): Observable<any> {
    if (!item?.id) {
      return throwError(() => new Error('updateItem: item.id is missing — cannot update.'));
    }

    return this.http.put<any>(`${this.baseUrl}/ItemMaster/${item.id}`, item).pipe(
      map(res => {
        if (!res) {
          throw new Error('Update did not return the saved item — it may not have been applied.');
        }
        return res;
      })
    );
  }

  getItemsByLocation(dealerLocation: string, customerLocation: string): Observable<any> {

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

  getItemModelist(){
    return this.http.get<any>(`${this.baseUrl}/ItemMaster/GetItemModelist`);
  }

}