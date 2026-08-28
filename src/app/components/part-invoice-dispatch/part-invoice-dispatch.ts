// src\app\components\part-invoice-dispatch\part-invoice-dispatch.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import {
  InvoiceDispatchService,
  InvoiceDispatchFilter
} from '../../core/services/invoice-dispatchservice';

@Component({
  selector: 'app-part-invoice-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule],
  templateUrl: './part-invoice-dispatch.html'
})
export class PartInvoiceDispatch implements OnInit {
  dispatchList: any[] = [];
  totalCount = 0;

  page = 1;
  pageSize = 25;

  dealerCode: string | null = null;
  fromDate: string | null = null;
  toDate: string | null = null;

  isLoading = false;
  errorMessage: string | null = null;

  constructor(private invoiceDispatchService: InvoiceDispatchService) { }

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const filter: InvoiceDispatchFilter = {
      dealerCode: this.dealerCode,
      fromDate: this.fromDate ? new Date(this.fromDate) : null,
      toDate: this.toDate ? new Date(this.toDate) : null,
      pageIndex: this.page,
      pageSize: this.pageSize
    };

    this.invoiceDispatchService.getPartDispatchList(filter).subscribe({
      next: (res) => {
        this.dispatchList = res?.data ?? [];
        this.totalCount = res?.totalCount ?? 0;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load part dispatch list.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadList();
  }

  onReset(): void {
    this.dealerCode = null;
    this.fromDate = null;
    this.toDate = null;
    this.page = 1;
    this.loadList();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadList();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadList();
  }
}