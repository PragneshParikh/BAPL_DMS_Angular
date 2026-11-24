//src\app\core\services\jobcard-photo.service.ts
// Job card photos - used by the B2C job card form (/job-card-addForm) and the B2B job card form (/b2bjobcards/add).
// 25.11.2026: photos are uploaded to the DMS API, which stores them on its own disk the same way JobCardScanner does
// (wwwroot/uploads/jobcard-photos/...) - no Azure Blob storage / keys needed.
//   B2C -> POST api/jobcard-photo/{jobCardHeaderId}   (BAPLDMSvad dbo.JobCardPhoto, see docs/JobCardPhoto_B2C.sql)
//   B2B -> POST api/b2b-jobcard/{id}/photos           (JobCardScanner dbo.JobCardPhotos - existing table, Stage = CheckIn)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PendingPhoto {
  file: File;
  previewUrl: string;
  caption: string;
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
  static readonly MAX_BYTES = 10 * 1024 * 1024;   // 10 MB per photo (same limit as the API)
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

  /** multipart body: files + captions in the same order */
  static formData(list: PendingPhoto[]): FormData {
    const fd = new FormData();
    list.forEach(p => {
      fd.append('files', p.file, p.file.name);
      fd.append('captions', (p.caption || '').trim());
    });
    return fd;
  }

  // ---------------- B2C (BAPLDMSvad dbo.JobCardPhoto) ----------------
  getB2CPhotos(jobCardHeaderId: number): Observable<JobCardPhotoRow[]> {
    return this.http.get<JobCardPhotoRow[]>(`${this.apiUrl}/jobcard-photo/${jobCardHeaderId}`);
  }

  uploadB2CPhotos(jobCardHeaderId: number, list: PendingPhoto[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobcard-photo/${jobCardHeaderId}`, JobcardPhotoService.formData(list));
  }

  deleteB2CPhoto(photoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobcard-photo/photo/${photoId}`);
  }
}
