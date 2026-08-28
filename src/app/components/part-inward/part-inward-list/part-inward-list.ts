// src\app\components\part-inward\part-inward-list\part-inward-list.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, viewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../../core/services/loader';
import { PartsInwardService } from '../../../core/services/partsinwardservice';
import { error } from 'console';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { DealerService } from '../../../core/services/dealer-service';
import { Router } from '@angular/router';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-part-inward-list',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPagination, NgbTooltip],
  templateUrl: './part-inward-list.html',
  styleUrl: './part-inward-list.scss',
})
export class PartInwardList implements OnInit {
  @ViewChild('partInwardfilterForm') partInwardfilterForm!: NgForm;

  page = 1;
  pageSize = 10;
  collectionSize = 0;
  readonly SUBMENU_ID = 99;
  canDownload = false;

  dealerCode: string = '';
  isSuperAdmin: boolean = false;

  dealerList: any[] = [];
  partsInwardData: any[] = [];

  filterFormData: any = {
    selectedDealerCode: '',
    fromDate: '',
    toDate: '',
  }

  constructor(
    private loader: LoaderService,
    private partsInwardService: PartsInwardService,
    private dealerMasterService: DealerService,
    private toast: ToastService,
    private storageService: StorageService,
    private router: Router,
    private menuAccess: MenuAccessService   // ADDED
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
    this.initDefaultDates();

    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);   // ADDED
}

  ngOnInit(): void {
    this.getDealerList();
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
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getPartsInwardDetails() {
    this.loader.show();
    const dealerCode = this.filterFormData.selectedDealerCode === 'ALL' ? null : this.filterFormData.selectedDealerCode;
    const fromDate = new Date(this.filterFormData.fromDate);
    const toDate = new Date(this.filterFormData.toDate);

    this.partsInwardService.getInwardDetailsByDealer(this.page, this.pageSize, fromDate, toDate, dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        // ADDED: ensure descending order by invoice date, newest first
        this.partsInwardData = (res || []).sort(
          (a: any, b: any) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
        );
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onPageChange(page: number) {
    this.page = page;
    this.getPartsInwardDetails();
  }

  onPageSizeChange() {
    this.page = 1;
    this.getPartsInwardDetails();
  }

  goToInvoice(item: any) {
    const invoiceNo = item?.invoiceNo || '0';
    const value = Date.now() + '|' + invoiceNo;
    const encClaim = btoa(value);
    this.router.navigate(['parts-inward', encClaim])
  }

  resetForm() {
    this.filterFormData = {
      selectedDealerCode: '',
      fromDate: '',
      toDate: '',
    }
    this.initDefaultDates();
    this.partInwardfilterForm.control.markAsUntouched();
  }

  onFilterRecords() {
    if (this.partInwardfilterForm.invalid) {
      this.partInwardfilterForm.control.markAllAsTouched();
      return
    }

    this.getPartsInwardDetails();
  }

  downloadExcel() {
    this.loader.show();

    const dealerCode = this.filterFormData.selectedDealerCode === 'ALL' ? null : this.filterFormData.selectedDealerCode;
    const fromDate = new Date(this.filterFormData.fromDate);
    const toDate = new Date(this.filterFormData.toDate);

    this.partsInwardService.getExcelDownload(fromDate, toDate, dealerCode).subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const downloadURL = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'PartsInwardList.xlsx';

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadURL);
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to download file', { classname: 'bg-danger text-white', delay: 5000 });
      },
      complete: () => {
        this.loader.hide();
      }
    });
  }
}
