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
    private router: Router
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
    this.initDefaultDates();
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
        console.log('part inward: ', res);
        this.partsInwardData = res;
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
    alert("Excel download");
  }
}
