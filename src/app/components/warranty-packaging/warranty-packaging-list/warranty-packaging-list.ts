import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { WarrantyPackingSlipService } from '../../../core/services/warranty-packaging-service';
import { DealerService } from '../../../core/services/dealer-service';

@Component({
  selector: 'app-warranty-packaging-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-packaging-list.html',
  styleUrl: './warranty-packaging-list.scss',
})
export class WarrantyPackagingList implements OnInit {

  lines: any[] = [];
  totalCount: number = 0;
  totalPages: number = 0;

  dealerList: any[] = [];

  financialYears: { label: string; startDate: string; endDate: string }[] = [];
  selectedFinancialYear: string;

  topSearchText: string = '';

  viewSlipData: any = null;
  viewingId: number | null = null;

  invoiceNoSuggestions: string[] = [];
  showInvoiceNoSuggestions: boolean = false;
  private invoiceNoDebounceHandle: any = null;

  slipNoSuggestions: string[] = [];
  showSlipNoSuggestions: boolean = false;
  private slipNoDebounceHandle: any = null;
  printingId: number | null = null;

  filter: any = {
    dealerCode: null,
    dateFrom: '',       // Slip Date range
    dateTo: '',
    invoiceNo: '',
    invoiceDateFrom: '',
    invoiceDateTo: '',
    slipNo: '',
    searchText: '',
    pageNumber: 1,
    pageSize: 25
  };

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private dealerService: DealerService,
    private warrantyPackingService: WarrantyPackingSlipService
  ) { }

  ngOnInit(): void {
    this.buildFinancialYears();
    this.loadDealers();
  }

  buildFinancialYears(): void {
    const today = new Date();
    const currentStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

    this.financialYears = [0, 1, 2].map(offset => {
      const startYear = currentStartYear - offset;
      return {
        label: `01 Apr ${startYear} to 31 Mar ${startYear + 1}`,
        startDate: `${startYear}-04-01`,
        endDate: `${startYear + 1}-03-31`
      };
    });

    this.selectedFinancialYear = this.financialYears[0].label;
    const fy = this.financialYears[0];
    this.filter.dateFrom = fy.startDate;
    this.filter.dateTo = fy.endDate;
  }

  onFinancialYearChange(): void {
    const fy = this.financialYears.find(f => f.label === this.selectedFinancialYear);
    this.filter.dateFrom = fy?.startDate ?? '';
    this.filter.dateTo = fy?.endDate ?? '';
    this.filter.pageNumber = 1;
    this.search();
  }

  loadDealers(): void {
    this.loader.show();
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.dealerList = res?.data || [];

        const currentDealerCode = this.storageService.getDealerCode();
        if (currentDealerCode && this.dealerList.some((d: any) => d.dealerCode === currentDealerCode)) {
          this.filter.dealerCode = currentDealerCode;
        }

        this.search();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load dealer list.', { classname: 'bg-danger text-white', delay: 3000 });
        this.search();
      }
    });
  }

  applyTopSearch(): void {
    this.filter.searchText = this.topSearchText;
    this.filter.pageNumber = 1;
    this.search();
  }

  search(): void {
    this.loader.show();

    const payload = {
      ...this.filter,
      dateFrom: this.filter.dateFrom || null,
      dateTo: this.filter.dateTo || null,
      invoiceDateFrom: this.filter.invoiceDateFrom || null,
      invoiceDateTo: this.filter.invoiceDateTo || null
    };

    this.warrantyPackingService.searchWarrantyPackingSlipLines(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.lines = res?.items || [];
        this.totalCount = res?.totalCount || 0;
        this.totalPages = res?.totalPages || 0;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Packing Slip lines.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetFilter(): void {
    const currentDealerCode = this.storageService.getDealerCode();
    const fy = this.financialYears[0];
    this.selectedFinancialYear = fy.label;
    this.topSearchText = '';

    this.filter = {
      dealerCode: this.dealerList.some((d: any) => d.dealerCode === currentDealerCode) ? currentDealerCode : null,
      dateFrom: fy.startDate,
      dateTo: fy.endDate,
      invoiceNo: '',
      invoiceDateFrom: '',
      invoiceDateTo: '',
      slipNo: '',
      searchText: '',
      pageNumber: 1,
      pageSize: 25
    };
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageNumber = page;
    this.search();
  }

  goToCreate(): void {
    this.router.navigate(['/warranty-packaging']);
  }

  viewSlip(warrantyPackingSlipHeaderId: number): void {
    this.viewingId = warrantyPackingSlipHeaderId;
    this.loader.show();
    this.warrantyPackingService.getWarrantyPackingSlipById(warrantyPackingSlipHeaderId).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.viewSlipData = res;
      },
      error: (err) => {
        this.loader.hide();
        this.viewingId = null;
        console.error(err);
        this.toaster.show('Failed to load this Packing Slip.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  closeView(): void {
    this.viewSlipData = null;
    this.viewingId = null;
  }

  // Deletes the WHOLE slip (a slip can span many rows in this flattened
  // view), then re-runs search() rather than locally removing rows -
  // simpler and correct given pagination/totals span multiple rows per
  // slip here.
  deleteSlip(warrantyPackingSlipHeaderId: number, event: Event): void {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this Warranty Packing Slip? This cannot be undone from this screen.')) {
      return;
    }

    this.loader.show();
    this.warrantyPackingService.deleteWarrantyPackingSlip(warrantyPackingSlipHeaderId).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Packing Slip deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
        this.search();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to delete the Warranty Packing Slip.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }
  // --- Invoice No typeahead ------------------------------------------
    onInvoiceNoInput(): void {
        if (this.invoiceNoDebounceHandle) clearTimeout(this.invoiceNoDebounceHandle);

        const text = (this.filter.invoiceNo || '').trim();
        if (!text) {
          this.invoiceNoSuggestions = [];
          this.showInvoiceNoSuggestions = false;
          return;
        }

        this.invoiceNoDebounceHandle = setTimeout(() => {
          this.warrantyPackingService.searchPackingInvoiceNos(this.filter.dealerCode, text).subscribe({
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

    // --- Slip No typeahead -----------------------------------------------
    onSlipNoInput(): void {
        if (this.slipNoDebounceHandle) clearTimeout(this.slipNoDebounceHandle);

        const text = (this.filter.slipNo || '').trim();
        if (!text) {
          this.slipNoSuggestions = [];
          this.showSlipNoSuggestions = false;
          return;
        }

        this.slipNoDebounceHandle = setTimeout(() => {
          this.warrantyPackingService.searchPackingSlipNos(this.filter.dealerCode, text).subscribe({
            next: (res: string[]) => {
              this.slipNoSuggestions = res || [];
              this.showSlipNoSuggestions = true;
            },
            error: (err) => console.error('Slip No search failed:', err)
          });
        }, 300);
    }
    
    private openPdfBlob(blob: Blob): void {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    printSlip(warrantyPackingSlipHeaderId: number, event: Event): void {
        event.stopPropagation();
        if (this.printingId) return;

        this.printingId = warrantyPackingSlipHeaderId;
        this.loader.show();

        this.warrantyPackingService.printWarrantyPackingSlip(warrantyPackingSlipHeaderId).subscribe({
          next: (blob: Blob) => {
            this.loader.hide();
            this.printingId = null;
            this.openPdfBlob(blob);
          },
          error: (err) => {
            this.loader.hide();
            this.printingId = null;
            console.error(err);
            this.toaster.show('Failed to generate the Packing Slip PDF.', { classname: 'bg-danger text-white', delay: 3000 });
          }
        });
    }

    selectSlipNo(value: string): void {
        this.filter.slipNo = value;
        this.showSlipNoSuggestions = false;
        this.slipNoSuggestions = [];
    }

    onSlipNoBlur(): void {
        setTimeout(() => { this.showSlipNoSuggestions = false; }, 150);
    }
}