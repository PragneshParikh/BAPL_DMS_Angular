import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { DealerService } from '../../../core/services/dealer-service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-parts-stock-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbTooltip],
  templateUrl: './parts-stock-details.html',
  styleUrl: './parts-stock-details.scss',
})
export class PartsStockDetails implements OnInit {
  @ViewChild('stockReportFilterForm') stockReportFilterForm!: NgForm
  dealerCode: string = '';
  isSuperAdmin: boolean = false;

  partsStockData: any[] = [];
  dealerList: any[] = [];

  stockReportFilterFormData: any = {
    selectedDealerCode: '',
    fromDate: '',
    toDate: '',
  }

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private reportService: ReportService,
    private toaster: ToastService,
    private dealerMasterService: DealerService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

  }

  ngOnInit(): void {
    this.getDealerList();
    this.initDefaultDates();
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    this.stockReportFilterFormData.toDate = to.toISOString().split('T')[0];
    this.stockReportFilterFormData.fromDate = from.toISOString().split('T')[0];
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
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getPartsStockDetails() {
    this.loader.show();
    const dealerCode = this.stockReportFilterFormData.selectedDealerCode === "ALL" ? null : this.stockReportFilterFormData.selectedDealerCode;
    const fromDate = new Date(this.stockReportFilterFormData.fromDate);
    const toDate = new Date(this.stockReportFilterFormData.toDate);

    this.reportService.getPartsStockDetailsByDealer(1, fromDate, toDate, dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        console.log("stock repot data: ", res);
        this.partsStockData = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  resetForm() {
    this.stockReportFilterFormData = {
      selectedDealerCode: '',
      fromDate: '',
      toDate: '',
    }
    this.initDefaultDates();
    this.stockReportFilterForm.control.markAsUntouched();
  }

  onFilterRecords(form: any) {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return
    }

    this.getPartsStockDetails();
  }

  getTotalRate() {
    return this.partsStockData.reduce((sum, item) => sum + (Number(item.dlrprice) || 0), 0);
  }

}
