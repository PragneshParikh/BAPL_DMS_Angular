import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  LocalPartsLocation,
  LocalPartsService,
  PartsD2DTransaction,
  formatPartsD2DBillNo
} from '../../core/services/local-parts.service';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-parts-d2d-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parts-d2d-transactions.html'
})
export class PartsD2DTransactions implements OnInit {
  fromDate = '';
  toDate = '';
  locationId: number | null = null;
  locations: LocalPartsLocation[] = [];
  transactions: PartsD2DTransaction[] = [];
  filteredTransactions: PartsD2DTransaction[] = [];
  isLoading = false;
  hasSearched = false;
  private hasLoadedTransactions = false;
  deletingTransactionId: number | null = null;
  errorMessage = '';
  currentPage = 1;
  readonly pageSize = 10;

  constructor(
    private readonly localPartsService: LocalPartsService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.toDate = this.formatDate(today);
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    this.fromDate = this.formatDate(from);
    this.localPartsService.getD2DWorkshopLocations().subscribe({
      next: locations => {
        this.locations = locations || [];
        this.applyFilters();
      },
      error: error => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load warehouse locations.');
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
  }

  get paginatedTransactions(): PartsD2DTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.localPartsService.getPartsD2DHistory().subscribe({
      next: transactions => {
        this.transactions = transactions || [];
        this.isLoading = false;
        this.hasLoadedTransactions = true;
        this.applyFilters();
      },
      error: error => {
        this.transactions = [];
        this.filteredTransactions = [];
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load D2D transactions.');
      }
    });
  }

  search(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'Date From cannot be later than Date To.';
      return;
    }
    this.errorMessage = '';
    this.hasSearched = true;
    if (!this.hasLoadedTransactions) {
      this.loadTransactions();
      return;
    }
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredTransactions = this.transactions.filter(transaction => {
      const date = transaction.date.slice(0, 10);
      if (this.fromDate && date < this.fromDate) return false;
      if (this.toDate && date > this.toDate) return false;
      if (this.locationId === null) return true;

      const location = this.locations.find(item => item.locationId === this.locationId);
      if (!location) return false;
      const matchesFrom = transaction.fromDealerCode.toLowerCase() === location.dealerCode.toLowerCase() &&
        transaction.fromLocationCode.toLowerCase() === location.locationCode.toLowerCase();
      const matchesTo = transaction.toDealerCode.toLowerCase() === location.dealerCode.toLowerCase() &&
        transaction.toLocationCode.toLowerCase() === location.locationCode.toLowerCase();
      return matchesFrom || matchesTo;
    });
    this.currentPage = 1;
  }

  getClosingStock(transaction: PartsD2DTransaction): number {
    return transaction.isIncomingForCaller ? transaction.toClosingStock : transaction.fromClosingStock;
  }

  formatBillNo(billNo: string): string {
    return formatPartsD2DBillNo(billNo);
  }

  getPreviousStock(transaction: PartsD2DTransaction): number {
    return transaction.isIncomingForCaller ? transaction.toPreviousStock : transaction.fromPreviousStock;
  }

  editTransaction(transaction: PartsD2DTransaction): void {
    if (transaction.isIncomingForCaller) {
      this.errorMessage = 'Incoming transfers are confirmed from the notification bell.';
      return;
    }
    this.router.navigate(['/parts-d2d'], {
      queryParams: { transactionId: transaction.transactionId }
    });
  }

  deleteTransaction(transaction: PartsD2DTransaction): void {
    if (transaction.isIncomingForCaller) {
      this.errorMessage = 'Incoming transfers are deleted from the notification receipt page.';
      return;
    }
    if (!window.confirm(
      `Delete part ${transaction.partCode} from D2D bill ${formatPartsD2DBillNo(transaction.d2DBillNo)}?`
    )) {
      return;
    }

    this.deletingTransactionId = transaction.transactionId;
    this.errorMessage = '';
    this.localPartsService.deletePartsD2DTransaction(transaction.transactionId).subscribe({
      next: () => {
        this.deletingTransactionId = null;
        this.toast.show('D2D transfer line deleted and stock restored.', {
          classname: 'bg-success text-white',
          delay: 5000
        });
        this.loadTransactions();
      },
      error: error => {
        this.deletingTransactionId = null;
        this.errorMessage = this.getErrorMessage(error, 'Unable to delete D2D transfer.');
      }
    });
  }

  exportExcel(): void {
    if (this.filteredTransactions.length === 0) return;

    const rows = this.filteredTransactions.map((transaction, index) => ({
      'Sr. No.': index + 1,
      'D2D Bill No.': formatPartsD2DBillNo(transaction.d2DBillNo),
      Prefix: transaction.prefix,
      Date: transaction.date,
      'From Dealer / Location': `${transaction.fromDealerCode} / ${transaction.fromLocationName}`,
      'To Dealer / Location': `${transaction.toDealerCode} / ${transaction.toLocationName}`,
      'Part No.': transaction.partCode,
      Description: transaction.description,
      Rate: transaction.rate,
      'C.Stock': this.getPreviousStock(transaction),
      'Up.Stock': transaction.transferQuantity
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts D2D');
    XLSX.writeFile(workbook, 'Parts_D2D_Transactions.xlsx');
  }

  openEntryPage(): void {
    this.router.navigate(['/parts-d2d']);
  }

  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
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
      return error.error?.message || fallback;
    }
    return fallback;
  }
}
