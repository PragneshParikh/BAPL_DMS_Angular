import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { StorageService } from '../../core/services/storage';
import {
  LocalPartsLocation,
  LocalPartsService,
  LocalPartsTransaction
} from '../../core/services/local-parts.service';

@Component({
  selector: 'app-local-parts-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './local-parts-transactions.html'
})
export class LocalPartsTransactions implements OnInit {
  fromDate = '';
  toDate = '';
  locationId: number | null = null;
  locations: LocalPartsLocation[] = [];
  transactions: LocalPartsTransaction[] = [];
  isLoading = false;
  errorMessage = '';
  isDealer = false;
  currentPage = 1;
  readonly pageSize = 10;

  constructor(
    private readonly localPartsService: LocalPartsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly storageService: StorageService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.toDate = this.formatDate(today);
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    this.fromDate = this.formatDate(from);
    const role = this.storageService.getRole().trim().toLowerCase().replace(/[\s_-]/g, '');
    this.isDealer = role === 'dealer';

    const requestedLocationId = Number(this.route.snapshot.queryParamMap.get('locationId'));
    this.localPartsService.getWorkshopLocations().subscribe({
      next: locations => {
        this.locations = locations;
        if (requestedLocationId && locations.some(location => location.locationId === requestedLocationId)) {
          this.locationId = requestedLocationId;
          if (!this.isDealer) {
            this.search();
          }
        }
      },
      error: error => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load workshop locations.');
      }
    });

  }

  onLocationChange(locationId: number | null): void {
    this.locationId = locationId;
    this.transactions = [];
    this.currentPage = 1;
    this.errorMessage = '';
    if (locationId !== null && !this.isDealer) {
      this.search();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.transactions.length / this.pageSize) || 1;
  }

  get paginatedTransactions(): LocalPartsTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.transactions.slice(start, start + this.pageSize);
  }

  search(): void {
    if (this.locationId === null) {
      this.transactions = [];
      this.currentPage = 1;
      return;
    }

    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'From date cannot be later than to date.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.localPartsService.getTransactions(this.fromDate, this.toDate, this.locationId).subscribe({
      next: transactions => {
        this.transactions = transactions;
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: error => {
        this.transactions = [];
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load local-parts transactions.');
      }
    });
  }

  exportExcel(): void {
    if (this.transactions.length === 0) {
      return;
    }

    const rows = this.transactions.map((transaction, index) => ({
      'Sr. No.': index + 1,
      'Prefix / Receipt No.': transaction.receiptNumber,
      Date: transaction.date,
      'Part Code': transaction.partCode,
      'Part Name': transaction.partName,
      Description: transaction.description,
      Dealer: transaction.dealerName,
      'Dealer Code': transaction.dealerCode,
      'Workshop Location': transaction.locationName,
      'Location Code': transaction.locationCode,
      'Current Stock': transaction.previousStock,
      'Purchase Qty': transaction.purchaseQuantity,
      'Total Qty': transaction.totalStock
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Local Parts');
    XLSX.writeFile(workbook, 'LocalPartsTransactions.xlsx');
  }

  openEntryPage(): void {
    this.router.navigate(['/add-local-parts']);
  }

  editTransaction(transaction: LocalPartsTransaction): void {
    this.router.navigate(['/add-local-parts'], {
      queryParams: { transactionId: transaction.id }
    });
  }

  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (typeof body?.message === 'string' && body.message.trim()) {
        return body.message;
      }
      return error.message || fallback;
    }
    return fallback;
  }
}
