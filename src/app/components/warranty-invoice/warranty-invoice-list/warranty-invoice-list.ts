// src\app\components\warranty-invoice\warranty-invoice-list\warranty-invoice-list.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { WarrantyInvoiceService } from '../../../core/services/warranty-invoice-service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { StorageService } from '../../../core/services/storage';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-warranty-invoice-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-invoice-list.html',
  styleUrl: './warranty-invoice-list.scss',
})
export class WarrantyInvoiceList implements OnInit {
  readonly SUBMENU_ID = 113;
  canDelete = false;
  canDownload = false;

  invoices: any[] = [];
  supplierList: any[] = [];
  locationList: any[] = [];

  totalCount: number = 0;
  totalPages: number = 0;

  // Tracks which row's Print dropdown is currently open - only one at a
  // time, matching the same single-menu-open convention already used
  // elsewhere in this app (e.g. UW Line Item's editingId).
  // Which invoice's Print modal is currently open, if any. Switched from
  // a dropdown to a modal - the dropdown's position:absolute was clipped
  // by .table-responsive's overflow-x:auto, which implicitly forces
  // overflow-y away from "visible" too (a CSS quirk: setting either
  // overflow axis to non-visible forces the other axis non-visible as
  // well) - a modal sits outside that scrollable container entirely, so
  // it isn't affected by this at all.
  printModalInvoiceId: number | null = null;

  // Disables the Print button on a row while its own PDF request is in
  // flight, so a second click can't fire a duplicate request.
  printingId: number | null = null;

  // Batch No / Invoice No typeahead suggestions, per explicit request -
  // mirrors the same pattern already applied on warranty-order-list.ts.
  batchNoSuggestions: string[] = [];
  showBatchNoSuggestions: boolean = false;
  private batchNoDebounceHandle: any = null;

  invoiceNoSuggestions: string[] = [];
  showInvoiceNoSuggestions: boolean = false;
  private invoiceNoDebounceHandle: any = null;

  // Claim Invoice No typeahead - searches the invoice number recorded on
  // the claim itself (WarrantyOrderGridDetail.InvoiceNo, the original
  // service/repair invoice captured against the claim), NOT this batch
  // invoice's own InvoiceNo above (that one is filter.invoiceNo).
  claimInvoiceNoSuggestions: string[] = [];
  showClaimInvoiceNoSuggestions: boolean = false;
  private claimInvoiceNoDebounceHandle: any = null;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    batchNo: '',
    invoiceNo: '',
    claimInvoiceNo: '',
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
    private warrantyInvoiceService: WarrantyInvoiceService,
    private menuAccess: MenuAccessService
  ) {
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
   }

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

  // Now loads only the locations actually used in this dealer's saved
  // invoices (via WarrantyInvoiceGridDetail), per explicit request -
  // replaces the earlier dealer-wide getLocationDropdownByDealerCode
  // lookup, same fix already applied on warranty-order-list.ts.
  loadLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.warrantyInvoiceService.getDistinctInvoiceLocations(dealerCode).subscribe({
      next: (res: any) => this.locationList = res || [],
      error: (err) => console.error(err)
    });
  }

  // --- Batch No typeahead --------------------------------------------
  onBatchNoInput(): void {
    if (this.batchNoDebounceHandle) clearTimeout(this.batchNoDebounceHandle);

    const text = (this.filter.batchNo || '').trim();
    if (!text) {
      this.batchNoSuggestions = [];
      this.showBatchNoSuggestions = false;
      return;
    }

    this.batchNoDebounceHandle = setTimeout(() => {
      const dealerCode = this.storageService.getDealerCode();
      this.warrantyInvoiceService.searchInvoiceBatchNos(dealerCode, text).subscribe({
        next: (res: string[]) => {
          this.batchNoSuggestions = res || [];
          this.showBatchNoSuggestions = true;
        },
        error: (err) => console.error('Batch No search failed:', err)
      });
    }, 300);
  }

  selectBatchNo(value: string): void {
    this.filter.batchNo = value;
    this.showBatchNoSuggestions = false;
    this.batchNoSuggestions = [];
  }

  onBatchNoBlur(): void {
    setTimeout(() => { this.showBatchNoSuggestions = false; }, 150);
  }

  // --- Invoice No typeahead (this batch invoice's own number) -----------
  onInvoiceNoInput(): void {
    if (this.invoiceNoDebounceHandle) clearTimeout(this.invoiceNoDebounceHandle);

    const text = (this.filter.invoiceNo || '').trim();
    if (!text) {
      this.invoiceNoSuggestions = [];
      this.showInvoiceNoSuggestions = false;
      return;
    }

    this.invoiceNoDebounceHandle = setTimeout(() => {
      const dealerCode = this.storageService.getDealerCode();
      this.warrantyInvoiceService.searchInvoiceNos(dealerCode, text).subscribe({
        next: (res: string[]) => {
          this.invoiceNoSuggestions = res || [];
          this.showInvoiceNoSuggestions = true;
        },
        error: (err) => console.error('Invoice No search failed:', err)
      });
    }, 300);
  }

  selectInvoiceNo(value: string): void {
    this.filter.invoiceNo = value;
    this.showInvoiceNoSuggestions = false;
    this.invoiceNoSuggestions = [];
  }

  onInvoiceNoBlur(): void {
    setTimeout(() => { this.showInvoiceNoSuggestions = false; }, 150);
  }

  // --- Claim Invoice No typeahead (the claim's own service invoice) -----
  onClaimInvoiceNoInput(): void {
    if (this.claimInvoiceNoDebounceHandle) clearTimeout(this.claimInvoiceNoDebounceHandle);

    const text = (this.filter.claimInvoiceNo || '').trim();
    if (!text) {
      this.claimInvoiceNoSuggestions = [];
      this.showClaimInvoiceNoSuggestions = false;
      return;
    }

    this.claimInvoiceNoDebounceHandle = setTimeout(() => {
      const dealerCode = this.storageService.getDealerCode();
      this.warrantyInvoiceService.searchClaimInvoiceNos(dealerCode, text).subscribe({
        next: (res: string[]) => {
          this.claimInvoiceNoSuggestions = res || [];
          this.showClaimInvoiceNoSuggestions = true;
        },
        error: (err) => console.error('Claim Invoice No search failed:', err)
      });
    }, 300);
  }

  selectClaimInvoiceNo(value: string): void {
    this.filter.claimInvoiceNo = value;
    this.showClaimInvoiceNoSuggestions = false;
    this.claimInvoiceNoSuggestions = [];
  }

  onClaimInvoiceNoBlur(): void {
    setTimeout(() => { this.showClaimInvoiceNoSuggestions = false; }, 150);
  }

  search(): void {
    this.loader.show();

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
      dateFrom: '', dateTo: '', batchNo: '', invoiceNo: '', claimInvoiceNo: '',
      location: null, claimType: '', supplierId: null,
      isApproved: true, pageNumber: 1, pageSize: 25
    };
    this.batchNoSuggestions = [];
    this.showBatchNoSuggestions = false;
    this.invoiceNoSuggestions = [];
    this.showInvoiceNoSuggestions = false;
    this.claimInvoiceNoSuggestions = [];
    this.showClaimInvoiceNoSuggestions = false;
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageNumber = page;
    this.search();
  }

  view(id: number): void {

    sessionStorage.setItem('viewWarrantyInvoiceId', String(id));
    this.router.navigate(['/warranty-invoice']);
  }

  goToCreate(): void {
    sessionStorage.removeItem('viewWarrantyInvoiceId');
    this.router.navigate(['/warranty-invoice']);
  }

  // --- Print -------------------------------------------------------------

  openPrintModal(invoiceId: number, event: Event): void {
    event.stopPropagation();
    this.printModalInvoiceId = invoiceId;
  }

  closePrintModal(): void {
    this.printModalInvoiceId = null;
  }


  private openPdfBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Deliberately not revoking the object URL immediately - the new tab
    // still needs it to load. The browser cleans this up when the tab/
    // blob URL's lifetime ends naturally.
  }

  printPart(id: number, event: Event): void {
    event.stopPropagation();
    if (this.printingId) return;

    this.printingId = id;
    this.printModalInvoiceId = null;
    this.loader.show();

    this.warrantyInvoiceService.printWarrantyInvoicePart(id).subscribe({
      next: (blob: Blob) => {
        this.loader.hide();
        this.printingId = null;
        this.openPdfBlob(blob);
      },
      error: (err) => {
        this.loader.hide();
        this.printingId = null;
        console.error(err);
        this.toaster.show('This invoice has no part lines to print, or the PDF could not be generated.', {
          classname: 'bg-danger text-white',
          delay: 4000
        });
      }
    });
  }

  printLabour(id: number, event: Event): void {
    event.stopPropagation();
    if (this.printingId) return;

    this.printingId = id;
    this.printModalInvoiceId = null;
    this.loader.show();

    this.warrantyInvoiceService.printWarrantyInvoiceLabour(id).subscribe({
      next: (blob: Blob) => {
        this.loader.hide();
        this.printingId = null;
        this.openPdfBlob(blob);
      },
      error: (err) => {
        this.loader.hide();
        this.printingId = null;
        console.error(err);
        this.toaster.show('This invoice has no labour lines to print, or the PDF could not be generated.', {
          classname: 'bg-danger text-white',
          delay: 4000
        });
      }
    });
  }

  printTag(id: number, event: Event): void {
    event.stopPropagation();
    if (this.printingId) return;

    this.printingId = id;
    this.printModalInvoiceId = null;
    this.loader.show();

    this.warrantyInvoiceService.printWarrantyClaimTag(id).subscribe({
      next: (blob: Blob) => {
        this.loader.hide();
        this.printingId = null;
        this.openPdfBlob(blob);
      },
      error: (err) => {
        this.loader.hide();
        this.printingId = null;
        console.error(err);
        this.toaster.show('This invoice has no part lines to generate a Warranty Tag for, or the PDF could not be generated.', {
          classname: 'bg-danger text-white',
          delay: 4000
        });
      }
    });
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