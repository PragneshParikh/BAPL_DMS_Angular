import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DealerService } from '../../../core/services/dealer-service';
import { FFIRService } from '../../../core/services/ffirservice';
import { StorageService } from '../../../core/services/storage';

interface VerificationAttachment {
  id: number;
  fileName: string;
  url: string;
  contentType: string;
  fileSize: number;
  mediaType: 'Image' | 'Video';
}

@Component({
  selector: 'app-ffir-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ffir-verification.html',
  styleUrl: './ffir-verification.scss'
})
export class FFIRVerification implements OnInit {
  dealers: any[] = [];
  rows: any[] = [];
  pagedRows: any[] = [];
  filters = {
    fromDate: '',
    toDate: '',
    dealerCode: '',
    status: 'All'
  };
  page = 1;
  pageSize = 10;
  loading = false;
  attachmentLoading = false;
  attachmentModalOpen = false;
  activeRow: any = null;
  attachments: VerificationAttachment[] = [];
  savingStatusForId: number | null = null;

  constructor(
    private readonly ffirService: FFIRService,
    private readonly dealerService: DealerService,
    private readonly storageService: StorageService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (!this.isAuthorizedRole(this.storageService.getRole())) {
      void Swal.fire('Access denied', 'FFIR Verification is available only to BG Employees, Admins, and Superadmins.', 'error');
      void this.router.navigate(['/']);
      return;
    }

    const today = new Date();
    this.filters.fromDate = this.formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
    this.filters.toDate = this.formatDate(today);
    this.loadDealers();
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  loadDealers(): void {
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (response: any) => {
        this.dealers = response?.data ?? [];
      },
      error: (error) => {
        console.error('Failed to load dealers for FFIR verification', error);
        void Swal.fire('Error', error?.error?.message || 'Could not load dealer list.', 'error');
      }
    });
  }

  search(): void {
    if (this.filters.fromDate && this.filters.toDate && this.filters.fromDate > this.filters.toDate) {
      void Swal.fire('Invalid date range', 'Date From cannot be after Date To.', 'warning');
      return;
    }

    this.loading = true;
    this.ffirService.getVerificationList(this.filters).subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
        this.page = 1;
        this.refreshPage();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to load FFIR verification records', error);
        void Swal.fire('Error', error?.error?.message || 'Could not load FFIR verification records.', 'error');
      }
    });
  }

  refreshPage(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pagedRows = this.rows.slice(start, start + this.pageSize);
  }

  changePage(direction: -1 | 1): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + direction));
    this.refreshPage();
  }

  async decide(row: any, status: 'Approved' | 'Rejected'): Promise<void> {
    const isApproval = status === 'Approved';
    const result = await Swal.fire({
      title: `${isApproval ? 'Accept' : 'Reject'} FFIR ${row.ffirNumber}?`,
      ...(isApproval
        ? { text: 'This will mark the verification as approved.' }
        : {
          input: 'textarea',
          inputLabel: 'Remarks (required)',
          inputPlaceholder: 'Enter the reason for rejection',
          inputAttributes: { 'aria-label': 'Rejection remarks' },
          inputValidator: (value: string) => value.trim() ? undefined : 'Remarks are required.'
        }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isApproval ? 'Accept' : 'Reject',
      confirmButtonColor: isApproval ? '#198754' : '#dc3545',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    const remarks = isApproval ? null : String(result.value).trim();
    this.savingStatusForId = row.id;
    this.ffirService.setVerificationStatus(row.id, status, remarks).subscribe({
      next: () => {
        row.status = status;
        row.remarks = remarks;
        this.savingStatusForId = null;
        this.search();
        void Swal.fire('Saved', `FFIR marked ${status.toLowerCase()}.`, 'success');
      },
      error: (error) => {
        this.savingStatusForId = null;
        console.error(`Failed to mark FFIR ${status.toLowerCase()}`, error);
        void Swal.fire('Error', error?.error?.message || `Could not ${status.toLowerCase()} this FFIR.`, 'error');
      }
    });
  }

  openAttachments(row: any): void {
    this.activeRow = row;
    this.attachments = [];
    this.attachmentModalOpen = true;
    this.attachmentLoading = true;
    this.ffirService.getVerificationAttachments(row.id).subscribe({
      next: (attachments) => {
        this.attachments = attachments ?? [];
        this.attachmentLoading = false;
      },
      error: (error) => {
        this.attachmentLoading = false;
        console.error('Failed to load FFIR attachments', error);
        void Swal.fire('Error', error?.error?.message || 'Could not load FFIR attachments.', 'error');
      }
    });
  }

  closeAttachments(): void {
    this.attachmentModalOpen = false;
    this.activeRow = null;
    this.attachments = [];
  }

  isVideo(attachment: VerificationAttachment): boolean {
    return attachment.mediaType?.toLowerCase() === 'video' || attachment.contentType?.startsWith('video/');
  }

  private isAuthorizedRole(role: string): boolean {
    const normalized = (role || '').toLowerCase().replace(/[^a-z]/g, '');
    return normalized === 'bgemployee' || normalized === 'admin' || normalized === 'superadmin';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
