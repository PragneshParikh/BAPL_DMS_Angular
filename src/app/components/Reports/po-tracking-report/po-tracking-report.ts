import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import {
  POTrackingReportViewModel,
  POTrackingFilterModel,
  PagedResponse,
  DealerDropdownItem
} from '../../../ViewModels/models/po-tracking-report.model';

@Component({
  selector: 'app-po-tracking-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './po-tracking-report.html'
})
export class POTrackingReportComponent implements OnInit {

  filterForm!: FormGroup;

  reportData: POTrackingReportViewModel[] = [];

  isLoading        : boolean = false;
  dropdownsLoading : boolean = false;

  totalRecords: number = 0;
  pageIndex   : number = 1;
  pageSize    : number = 20;

  // ── Dropdown lists ──────────────────────────────────────
  dealerList  : DealerDropdownItem[] = [];
  poTypeList  : string[]             = [];

  // ✅ Fixed — always exactly Active / Inactive (bool field)
  poStatusList: string[] = ['Active', 'Inactive'];

  constructor(
    private fb           : FormBuilder,
    private reportService: ReportService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate  : [''],
      toDate    : [''],
      poType    : [''],
      poStatus  : ['']   // '' = All, 'Active', 'Inactive'
    });
  }

  ngOnInit(): void {
    this.initializeDates();
    this.loadAllDropdowns();
    this.loadReport();

    // ✅ Watch poStatus change → reload report immediately
    this.filterForm
      .get('poStatus')!
      .valueChanges
      .subscribe(() => {
        this.pageIndex = 1;
        this.loadReport();
      });
  }

  // ── Fetch dealer + poType from API in parallel ──────────
  loadAllDropdowns(): void {

    this.dropdownsLoading = true;

    forkJoin({
      dealers: this.reportService.getDealerDropdown(),
      poTypes: this.reportService.getPOTypeDropdown()
    }).subscribe({

      next: ({ dealers, poTypes }) => {
        this.dealerList       = dealers;
        this.poTypeList       = poTypes;
        this.dropdownsLoading = false;
      },

      error: (err) => {
        console.error('Error loading dropdowns', err);
        this.dropdownsLoading = false;
      }
    });
  }

  initializeDates(): void {

    const today    = new Date();
    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.filterForm.patchValue({
      fromDate: this.formatDateForInput(firstDay),
      toDate  : this.formatDateForInput(today)
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadReport(): void {

    this.isLoading = true;

    const filter: POTrackingFilterModel = {
      dealerCode: this.filterForm.get('dealerCode')?.value || '',
      fromDate  : this.parseDate(this.filterForm.get('fromDate')?.value),
      toDate    : this.parseDate(this.filterForm.get('toDate')?.value),
      poType    : this.filterForm.get('poType')?.value || '',
      poStatus  : this.filterForm.get('poStatus')?.value || '',  // ✅ "Active" | "Inactive" | ""
      pageIndex : this.pageIndex,
      pageSize  : this.pageSize
    };

    this.reportService
      .getPOTrackingReport(filter)
      .subscribe({

        next: (response: PagedResponse<POTrackingReportViewModel>) => {
          this.reportData   = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading    = false;
        },

        error: (error) => {
          console.error(error);
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {

    this.filterForm.reset({
      dealerCode: '',
      fromDate  : '',
      toDate    : '',
      poType    : '',
      poStatus  : ''
    });

    this.initializeDates();
    this.pageIndex = 1;
    this.loadReport();
  }

  parseDate(dateString: string): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN');
  }

  firstPage(): void {
    if (this.pageIndex !== 1) {
      this.pageIndex = 1;
      this.loadReport();
    }
  }

  previousPage(): void {
    if (this.pageIndex > 1) {
      this.pageIndex--;
      this.loadReport();
    }
  }

  nextPage(): void {
    if (this.pageIndex * this.pageSize < this.totalRecords) {
      this.pageIndex++;
      this.loadReport();
    }
  }

  lastPage(): void {
    const last = Math.ceil(this.totalRecords / this.pageSize);
    if (this.pageIndex !== last) {
      this.pageIndex = last;
      this.loadReport();
    }
  }

    exportToCSV(): void {

      const headers = [
        'SR NO',
        'DEALER NAME',
        'DEALER CODE',
        'LOCATION NAME',
        'ORDER NUMBER',
        'ORDER DATE',
        'SUBMIT TO ERP DATE',
        'PO TYPE',
        'PO QTY',
        'BILLED QTY',
        'PENDING QTY',
        'ARCHIVED',
        'PO PRICE',
        'BILLED PRICE',
        'PENDING PO PRICE',
        'ARCHIVED PRICE EXCL GST',
        'PO STATUS',
        'UNIQUE ID',
        'DEALER PO NO',
        'WALLET DEBIT',
        'PG DEBIT',
        'PG STATUS',
        'PAYMENT LINK',
        'PAYMENT TYPE',
        'TEMP PO NO',
        'MERCHANT ORDER NO',
        'MERCHANT ORDER STATUS'
      ];

      const rows = this.reportData.map(x => [
        x.srNo,
        x.dealerName        ?? '',
        x.dealerCode        ?? '',
        x.locationName      ?? '',
        x.orderNumber       ?? '',
        this.formatDate(x.orderDate),
        this.formatDate(x.submitToERPDate),
        x.poType            ?? '',
        x.poQty,
        x.billedQty,
        x.pendingQty,
        x.archived,
        x.poPrice,
        x.billedPrice,
        x.pendingPOPrice,
        x.archivedPriceExclGST,
        x.poStatus          ?? '',
        x.uniqueId          ?? '',
        x.dealerPONo        ?? '',
        x.walletDebit,
        x.pgDebit,
        x.pgStatus          ?? '',
        x.paymentLink       ?? '',
        x.paymentType       ?? '',
        x.tempPONo          ?? '',
        x.merchantOrderNo   ?? '',
        x.merchantOrderStatus ?? ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row =>
          row.map(cell => {
            // ✅ Wrap in quotes if cell contains comma, quote, or newline
            const val = String(cell ?? '');
            return val.includes(',') || val.includes('"') || val.includes('\n')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          }).join(',')
        )
        .join('\n');

      const blob = new Blob(
        [csvContent],
        { type: 'text/csv;charset=utf-8;' }
      );

      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', 'po-tracking-report.csv');
      link.click();
    }
}