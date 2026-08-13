import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { WarrantyInvoiceService } from '../../../core/services/warranty-invoice-service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-warranty-invoice-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-invoice-list.html',
  styleUrl: './warranty-invoice-list.scss',
})
export class WarrantyInvoiceList implements OnInit {

  invoices: any[] = [];
  supplierList: any[] = [];
  locationList: any[] = [];

  totalCount: number = 0;
  totalPages: number = 0;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    invoiceNo: '',
    location: null,
    claimType: '',
    supplierId: null,
    isApproved: true,   // approved invoices only - unapproved (freshly auto-created) invoices stay hidden until Save is clicked
    pageNumber: 1,
    pageSize: 25
  };

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private locationService: LocationMasterService,
    private warrantyInvoiceService: WarrantyInvoiceService
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadLocations();
    this.search();
  }

  loadSuppliers(): void {
    this.ledgerService.getCompanyLedgers().subscribe({
      next: (res: any) => this.supplierList = res,
      error: (err) => console.error(err)
    });
  }

  loadLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (res: any) => this.locationList = res,
      error: (err) => console.error(err)
    });
  }

  search(): void {
    this.loader.show();
    // isApproved: true is always enforced regardless of the dropdown -
    // this page only ever shows confirmed/approved invoices. An
    // auto-created invoice that hasn't been explicitly approved yet stays
    // correctly invisible here. Same reasoning as warranty-order-list.ts's
    // own search().
    // dateFrom/dateTo must be null (not '') when empty - an empty string
    // fails to deserialize as DateTime? on the backend and takes down the
    // whole request body, not just that one field.
    const payload = {
      ...this.filter,
      dateFrom: this.filter.dateFrom || null,
      dateTo: this.filter.dateTo || null,
      isApproved: true
    };

    this.warrantyInvoiceService.searchWarrantyInvoices(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.invoices = res?.items || [];
        this.totalCount = res?.totalCount || 0;
        this.totalPages = res?.totalPages || 0;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Invoices.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetFilter(): void {
    this.filter = {
      dateFrom: '', dateTo: '', invoiceNo: '',
      location: null, claimType: '', supplierId: null,
      isApproved: true, pageNumber: 1, pageSize: 25
    };
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageNumber = page;
    this.search();
  }

  view(id: number): void {
    // No /warranty-invoice/edit/:id route exists (single flat route by
    // design) - same sessionStorage handoff pattern already used for the
    // order/claim redirects.
    sessionStorage.setItem('viewWarrantyInvoiceId', String(id));
    this.router.navigate(['/warranty-invoice']);
  }

  goToCreate(): void {
    sessionStorage.removeItem('viewWarrantyInvoiceId');
    this.router.navigate(['/warranty-invoice']);
  }

  deleteInvoice(id: number, event: Event): void {
    // Prevent this click from also bubbling up as the row's dblclick
    // navigation.
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this Warranty Invoice? This cannot be undone from this screen.')) {
      return;
    }

    this.loader.show();
    this.warrantyInvoiceService.deleteWarrantyInvoice(id).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Invoice deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });

        // Remove locally for immediate feedback instead of a full re-search.
        this.invoices = this.invoices.filter(i => i.id !== id);
        this.totalCount = Math.max(0, this.totalCount - 1);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to delete the Warranty Invoice.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  back(): void {
    this.router.navigate(['/warranty-invoice']);
  }
}