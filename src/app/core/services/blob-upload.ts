import { Injectable } from '@angular/core';
import { BlobClient, BlockBlobClient } from '@azure/storage-blob';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BlobUploadService {

  private baseUrl = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getUploadSasUrl(fileName: string) {
    return this.httpClient.get(`${this.baseUrl}/files/generate-upload-url`, { params: { fileName: fileName } });
  }


}
