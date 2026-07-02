import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProformaInvoiceService } from '../../core/services/proforma-invoice-service';
import { NgbPaginationModule, NgbHighlight } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-proforma-invoice',
  imports: [CommonModule, FormsModule, NgbPaginationModule,
    NgbHighlight, FlatpickrModule, RouterOutlet],
  templateUrl: './proforma-invoice.html',
  styleUrl: './proforma-invoice.scss',
  providers: [FlatpickrDefaults]
})
export class ProformaInvoice implements OnInit {

  invoices: any[] = [];
  filteredInvoices: any[] = [];
  paginatedInvoices: any[] = [];

  searchTerm: string = '';

  page = 1;
  pageSize = 10;

  filter = {
    fromDate: null,
    toDate: null,
    documentNo: '',
    customerName: ''
  };

  constructor(private invoiceService: ProformaInvoiceService) { }

  ngOnInit() {
    this.loadInvoices();
  }

  //    API CALL
  loadInvoices() {
    this.invoiceService.getAll().subscribe({
      next: (res: any) => {
        this.invoices = res;
        this.filteredInvoices = res;
        this.updatePagination();
      },
      error: (err) => {
        console.error(err);                 // full object
      }
    });
  }

  //    FILTER BUTTON
  onSearch() {
    this.filteredInvoices = this.invoices.filter(x =>
      (!this.filter.documentNo || x.documentNo?.includes(this.filter.documentNo)) &&
      (!this.filter.customerName || x.customerName?.toLowerCase().includes(this.filter.customerName.toLowerCase()))
    );
    this.page = 1;
    this.updatePagination();
  }

  //    GLOBAL SEARCH
  onSearchChange() {
    const term = this.searchTerm.toLowerCase();

    this.filteredInvoices = this.invoices.filter(x =>
      Object.values(x).some(val =>
        val?.toString().toLowerCase().includes(term)
      )
    );

    this.page = 1;
    this.updatePagination();
  }

  //    SORTING
  onSort(field: string) {
    this.filteredInvoices.sort((a, b) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      return valA > valB ? 1 : -1;
    });

    this.updatePagination();
  }

  //    PAGINATION
  updatePagination() {
    const start = (this.page - 1) * this.pageSize;
    this.paginatedInvoices = this.filteredInvoices.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePagination();
  }

  //    ROW CLICK
  editInvoice(item: any) {
    // TODO: navigate to edit page
  }

  //    ADD BUTTON
  navigateToAddInvoice() {
    // TODO: router navigation
  }

  //    EXPORT
  exportExcel() {
    // TODO: implement export
  }
}