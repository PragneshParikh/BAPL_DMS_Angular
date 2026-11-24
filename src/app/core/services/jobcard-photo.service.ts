//src\app\core\services\jobcard-photo.service.ts
// Job card photos (25.11.2026) - used by the B2C job card form (/job-card-addForm) and the B2B job card form (/b2bjobcards/add).
// Files go straight to Azure Blob with a one-hour write SAS from the existing api/files/generate-upload-url (same as other
// DMS uploads); only the blob URL + file details are then saved:
//   B2C -> api/jobcard-photo/{jobCardHeaderId}       (BAPLDMSvad dbo.JobCardPhoto, see docs/JobCardPhoto_B2C.sql)
//   B2B -> api/b2b-jobcard/{id}/photos              (JobCardScanner dbo.JobCardPhotos, Stage = CheckIn)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PendingPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

export interface UploadedPhoto {
  fileName: string;
  blobUrl: string;
  contentType: string;
  fileSize: number;
  caption?: string | null;
}

export interface JobCardPhotoRow {
  id: number;
  jobCardHeaderId: number;
  fileName: string;
  blobUrl: string;
  contentType?: string | null;
  fileSize?: number | null;
  caption?: string | null;
  createdBy?: string | null;
  createdDate: string;
}

@Injectable({ providedIn: 'root' })
export class JobcardPhotoService {
  static readonly MAX_PHOTOS = 10;
  static readonly MAX_BYTES = 10 * 1024 * 1024;   // 10 MB per photo
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** picked files -> pending list; returns an error text for files that were skipped */
  static addFiles(list: PendingPhoto[], files: FileList | File[] | null, existingCount = 0): string {
    const skipped: string[] = [];
    for (const f of Array.from(files || [])) {
      if (!f.type.startsWith('image/')) { skipped.push(`${f.name} (not an image)`); continue; }
      if (f.size > JobcardPhotoService.MAX_BYTES) { skipped.push(`${f.name} (over 10 MB)`); continue; }
      if (list.length + existingCount >= JobcardPhotoService.MAX_PHOTOS) { skipped.push(`${f.name} (max ${JobcardPhotoService.MAX_PHOTOS} photos)`); continue; }
      list.push({ file: f, previewUrl: URL.createObjectURL(f), caption: '' });
    }
    return skipped.length ? 'Skipped: ' + skipped.join(', ') : '';
  }

  static release(list: PendingPhoto[]): void {
    list.forEach(p => { try { URL.revokeObjectURL(p.previewUrl); } catch { /* ignore */ } });
  }

  /** uploads one file to Azure Blob (write SAS from the API) and returns its blob URL */
  async uploadToBlob(p: PendingPhoto): Promise<UploadedPhoto> {
    const safeName = p.file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-120) || 'photo.jpg';
    const sas: any = await firstValueFrom(this.http.get(`${this.apiUrl}/files/generate-upload-url`, { params: { fileName: `jobcard_${safeName}` } }));
    const sasUri: string = sas?.sasUri || sas?.SasUri;
    const blobUrl: string = sas?.blobUrl || sas?.BlobUrl;
    if (!sasUri || !blobUrl) throw new Error('Upload URL could not be created.');
    // plain fetch: the app's auth interceptor must not add the DMS token to the Azure request
    const res = await fetch(sasUri, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': p.file.type || 'application/octet-stream' },
      body: p.file
    });
    if (!res.ok) throw new Error(`Photo ${p.file.name} could not be uploaded (${res.status}).`);
    return { fileName: p.file.name, blobUrl, contentType: p.file.type, fileSize: p.file.size, caption: p.caption?.trim() || null };
  }

  async uploadAll(list: PendingPhoto[]): Promise<UploadedPhoto[]> {
    const out: UploadedPhoto[] = [];
    for (const p of list) out.push(await this.uploadToBlob(p));
    return out;
  }

  // ---------------- B2C (BAPLDMSvad dbo.JobCardPhoto) ----------------
  getB2CPhotos(jobCardHeaderId: number): Observable<JobCardPhotoRow[]> {
    return this.http.get<JobCardPhotoRow[]>(`${this.apiUrl}/jobcard-photo/${jobCardHeaderId}`);
  }

  saveB2CPhotos(jobCardHeaderId: number, photos: UploadedPhoto[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobcard-photo/${jobCardHeaderId}`, { photos });
  }

  deleteB2CPhoto(photoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobcard-photo/photo/${photoId}`);
  }
}
