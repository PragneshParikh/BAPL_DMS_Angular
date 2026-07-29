import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChassisSearchService {

  protected baseUrl =
    environment.apiUrl;

  constructor(
    private httpClient: HttpClient
  ) { }

  // ============================================
  // GET CHASSIS DETAILS
  // ============================================

  getChassisDetails(
    chassisNumber: string
  ) {

    return this.httpClient.get(
      `${this.baseUrl}/chassis/${chassisNumber}`
    );
  }

  // ============================================
  // IMPORT CHASSIS EXCEL
  // ============================================

  importChassisExcel(
    file: File
  ) {

    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    return this.httpClient.post(
      `${this.baseUrl}/chassis/import`,
      formData
    );
  }

  getChassisDetailsByLocationCode(locationCode: string) {
    return this.httpClient.get<any[]>(`${this.baseUrl}/chassis-details/chassisList?locationCode=${locationCode}`);
  }
   getAllSoldChassis() {
    return this.httpClient.get<any[]>(`${this.baseUrl}/chassis-details/soldChassis`);
  }
}