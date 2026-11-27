import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DealerService } from '../../../core/services/dealer-service';
import { FFIRService } from '../../../core/services/ffirservice';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-ffir-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ffir-report.html',
  styleUrl: './ffir-report.scss'
})
export class FFIRReport implements OnInit {
  dealers: any[] = [];
  rows: any[] = [];
  page = 1;
  readonly pageSize = 25;
  searched = false;
  loading = false;
  isDealerUser = false;
  filters = {
    fromDate: '',
    toDate: '',
    dealerCode: ''
  };

  constructor(
    private readonly ffirService: FFIRService,
    private readonly dealerService: DealerService,
    private readonly storageService: StorageService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if (!this.isAuthorizedRole(this.storageService.getRole())) {
      void Swal.fire('Access denied', 'FFIR Reports is available only to dealers, BG Employees, Admins, and Superadmins.', 'error');
      void this.router.navigate(['/']);
      return;
    }

    this.isDealerUser = this.isDealerRole(this.storageService.getRole());
    if (this.isDealerUser) {
      this.filters.dealerCode = this.storageService.getDealerCode().trim();
      if (!this.filters.dealerCode) {
        void Swal.fire('Access denied', 'No dealer code is associated with this account.', 'error');
        void this.router.navigate(['/']);
        return;
      }
    }

    const today = new Date();
    this.filters.fromDate = this.formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
    this.filters.toDate = this.formatDate(today);
    if (this.isDealerUser) {
      this.dealers = [{ dealerCode: this.filters.dealerCode, dealerName: this.filters.dealerCode }];
    } else {
      this.loadDealers();
    }
  }

  get pagedRows(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  loadDealers(dealerCode: string | null = null): void {
    this.dealerService.getDealerDropdown(dealerCode).subscribe({
      next: (response: any) => this.dealers = response?.data ?? [],
      error: (error) => {
        console.error('Failed to load dealers for FFIR report', error);
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
    this.searched = true;
    this.ffirService.getVerificationList({
      ...this.filters,
      status: 'All'
    }).subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
        this.page = 1;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to load FFIR report', error);
        void Swal.fire('Error', error?.error?.message || 'Could not load FFIR report.', 'error');
      }
    });
  }

  changePage(direction: -1 | 1): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + direction));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isAuthorizedRole(role: string): boolean {
    const normalized = (role || '').toLowerCase().replace(/[^a-z]/g, '');
    return this.isDealerRole(role) || normalized === 'bgemployee' || normalized === 'admin' || normalized === 'superadmin';
  }

  private isDealerRole(role: string): boolean {
    return (role || '').toLowerCase().replace(/[^a-z]/g, '') === 'dealer';
  }
}
