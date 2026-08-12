//BAPL_DMS_Angular\src\app\components\ebw-reports\ebw-reports.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { DealerService } from '../../core/services/dealer-service';
import { EbwInvoiceService } from '../../core/services/ebw-invoice-service';

@Component({
  selector: 'app-ebw-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPagination, NgbTooltip],
  templateUrl: './ebw-reports.html',
  styleUrl: './ebw-reports.scss',
})
export class EBWReports implements OnInit {
  @ViewChild('ebwFilterForm') ebwFilterForm!: NgForm;

  page = 1;
  pageSize = 10;

  dealerCode: string = '';
  isSuperAdmin: boolean = false;

  dealerList: any[] = [];
  gridData: any[] = [];

  filterFormData: any = {
    selectedDealerCode: '',
    fromDate: '',
    toDate: '',
  };

  focusedInvoiceNo: string | null = null;

  constructor(
    private loader: LoaderService,
    private dealerMasterService: DealerService,
    private ebwInvoiceService: EbwInvoiceService,   // FIXED — now injected
    private toast: ToastService,
    private storageService: StorageService,
    private route: ActivatedRoute
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
      this.filterFormData.selectedDealerCode = this.dealerCode;
    }

    this.initDefaultDates();
  }

  ngOnInit(): void {
    this.getDealerList();

    this.route.queryParams.subscribe((params) => {
      this.focusedInvoiceNo = params['invoiceNo'] || null;
    });
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    this.filterFormData.toDate = to.toISOString().split('T')[0];
    this.filterFormData.fromDate = from.toISOString().split('T')[0];
  }

  getDealerList() {
    this.loader.show();
    this.dealerMasterService.getDealerDropdown(this.dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        this.dealerList = res.data;

        if (!this.dealerCode) {
          this.dealerList.unshift({ dealerCode: 'ALL', dealerName: 'All' });
          this.filterFormData.selectedDealerCode = 'ALL';
        }

        this.getEbwReportDetails();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  /**
   * Now reads directly from EbwInvoiceHeader/Detail via a real backend
   * report endpoint — no more PartsInward-based derivation.
   */
  getEbwReportDetails() {
    this.loader.show();

    const dealerCode = this.filterFormData.selectedDealerCode === 'ALL' ? undefined : this.filterFormData.selectedDealerCode;

    this.ebwInvoiceService.getReportData(dealerCode, this.filterFormData.fromDate, this.filterFormData.toDate).subscribe({
      next: (res: any) => {
        const rows: any[] = res.data || [];

        const filtered = this.focusedInvoiceNo
          ? rows.filter((r) => String(r.invoiceNo) === this.focusedInvoiceNo)
          : rows;

        this.gridData = filtered.map((r) => ({
          dealerCode: r.dealerCode,
          locationCode: r.locationCode,
          locationName: r.locationName || '—',
          invoiceNo: r.invoiceNo,
          invoiceDate: r.invoiceDate,
          receivedDate: r.receivedDate,
          modelName: r.modelName || '—',
          chassisNo: r.chassisNo || '—',
          partNo: r.partNo,
          itemdesc: r.itemDesc,
          serialNo: r.serialNo || '—',
          rBillNo: r.rBillNo || '—',
          rBillDate: r.rBillDate,
          partyName: r.partyName || '—',
          partyState: r.partyState || '—',
        }));

        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  onPageChange(page: number) {
    this.page = page;
  }

  onFilterRecords() {
    if (this.ebwFilterForm.invalid) {
      this.ebwFilterForm.control.markAllAsTouched();
      return;
    }

    this.getEbwReportDetails();
  }

  resetForm() {
    this.focusedInvoiceNo = null;
    this.filterFormData = {
      selectedDealerCode: this.isSuperAdmin ? 'ALL' : this.dealerCode,
      fromDate: '',
      toDate: '',
    };
    this.initDefaultDates();
    this.ebwFilterForm.control.markAsUntouched();
    this.getEbwReportDetails();
  }

  clearFocusedInvoice() {
    this.focusedInvoiceNo = null;
    this.getEbwReportDetails();
  }

  onPageSizeChange() {
    this.page = 1;
  }

  downloadExcel() {
    this.toast.show('Excel export not yet available for EBW report.', {
      classname: 'bg-warning text-white',
      delay: 5000,
    });
  }
}