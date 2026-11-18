// src\app\components\Reports\parts-stock-details\parts-stock-details.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { DealerService } from '../../../core/services/dealer-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  PartsStockDetailsReportRow,
  ReportDealerOption,
  ReportLocationOption
} from '../../../ViewModels/models/stock-reports.model';
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
  readonly SUBMENU_ID = 93;
  canDownload = false; 

  partsStockData: PartsStockDetailsReportRow[] = [];
  dealerList: ReportDealerOption[] = [];
  locationList: ReportLocationOption[] = [];

  stockReportFilterFormData: {
    selectedDealerCode: string;
    selectedLocation: ReportLocationOption | null;
    fromDate: string;
    toDate: string;
  } = {
    selectedDealerCode: '',
    selectedLocation: null,
    fromDate: '',
    toDate: '',
  }

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private reportService: ReportService,
    private toaster: ToastService,
    private dealerMasterService: DealerService,
    private locationMasterService: LocationMasterService,
    private menuAccess: MenuAccessService,
    private router: Router
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);

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
        this.dealerList = res.data ?? [];

        if (!this.dealerCode) {
          this.dealerList.unshift({ dealerCode: 'ALL', dealerName: 'All' });
        }
        this.stockReportFilterFormData.selectedDealerCode =
          this.dealerCode || (this.isSuperAdmin ? 'ALL' : '');
        this.loadLocationList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onDealerChange(): void {
    this.stockReportFilterFormData.selectedLocation = null;
    this.loadLocationList();
  }

  private loadLocationList(): void {
    const selectedDealerCode = this.stockReportFilterFormData.selectedDealerCode;
    const dealerCode = selectedDealerCode && selectedDealerCode !== 'ALL'
      ? selectedDealerCode
      : null;

    this.locationList = [];
    this.loader.show();
    this.locationMasterService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (locations: ReportLocationOption[]) => {
        this.loader.hide();
        this.locationList = (locations ?? [])
         .filter(location => location.locareaidno === 2).map(location => ({
          ...location,
          dealerName: this.dealerList.find(dealer => dealer.dealerCode === location.dealercode)?.dealerName
        }));
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Unable to load locations.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  getLocationLabel(location: ReportLocationOption): string {
    const name = location.locname || location.loccode || 'Unknown location';
    return this.stockReportFilterFormData.selectedDealerCode === 'ALL'
      ? `${location.dealerName || location.dealercode} - ${name}`
      : name;
  }

  getPartsStockDetails() {
    this.loader.show();
    const dealerCode = this.stockReportFilterFormData.selectedDealerCode === "ALL" ? null : this.stockReportFilterFormData.selectedDealerCode;
    const selectedLocation = this.stockReportFilterFormData.selectedLocation;
    const fromDate = new Date(this.stockReportFilterFormData.fromDate);
    const toDate = new Date(this.stockReportFilterFormData.toDate);

    this.reportService.getPartsStockDetailsByDealer(
      1,
      fromDate,
      toDate,
      dealerCode,
      selectedLocation?.loccode ?? null,
      selectedLocation?.dealercode ?? null
    ).subscribe({
      next: (res) => {
        this.loader.hide();
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
      selectedDealerCode: this.dealerCode || (this.isSuperAdmin ? 'ALL' : ''),
      selectedLocation: null,
      fromDate: this.stockReportFilterFormData.fromDate,
      toDate: this.stockReportFilterFormData.toDate,
    }
    this.initDefaultDates();
    this.stockReportFilterForm?.control.markAsUntouched();
    this.loadLocationList();
  }

  onFilterRecords(form: any) {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return
    }

    this.getPartsStockDetails();
  }

  getTotalRate(): number {
    return this.partsStockData.reduce((sum, item) => sum + (Number(item.dlrprice) || 0), 0);
  }

  exportExcel(): void {
    if (!this.partsStockData.length) {
      this.toaster.show('No data available to export.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    const rows = this.partsStockData.map(item => ({
      'Sr No': item.srNo,
      'Dealer Name': item.dealerName || 'Unknown',
      'Dealer Code': item.vendorCode || '',
      'Location Name': item.locname || 'Unknown',
      'Location Code': item.dealerLocation,
      'Part Code': item.itemcode,
      'Part Description': item.itemdesc,
      'Item Type': item.groupType,
      'Pur.Qty': item.purchaseCount,
      'MT': item.saleCount,
      'Sale Qty': item.saleCount,
      'Sdj.': item.stockAdjustmentQty,
      'Bal.Qty': item.batchClosingQty,
      'HSN Code': item.hsncode,
      'Rate': item.dlrprice,
      'NDP': item.mrp,
      'MRP': item.custprice,
      'GST': item.gst
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Parts Stock Details');
    XLSX.writeFile(workbook, 'PartsStockDetails.xlsx');
  }
}
