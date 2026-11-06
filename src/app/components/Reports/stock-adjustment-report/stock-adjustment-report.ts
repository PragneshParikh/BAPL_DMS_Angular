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
import { ReportDealerOption, ReportLocationOption, StockAdjustmentReportRow } from '../../../ViewModels/models/stock-reports.model';


@Component({
  selector: 'app-stock-adjustment-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbTooltip
  ],
  templateUrl: './stock-adjustment-report.html',
  styleUrl: './stock-adjustment-report.scss'
})
export class StockAdjustmentReport implements OnInit {

  @ViewChild('reportFilterForm')
  reportFilterForm!: NgForm;

  dealerCode = '';
  isSuperAdmin = false;

  readonly SUBMENU_ID = 136;

  canDownload = false;

  stockAdjustmentData: StockAdjustmentReportRow[] = [];

  dealerList: ReportDealerOption[] = [];
  locationList: ReportLocationOption[] = [];

  reportFilterFormData: {
    selectedDealerCode: string;
    selectedLocation: ReportLocationOption | null;
    fromDate: string;
    toDate: string;
  } = {
      selectedDealerCode: '',
      selectedLocation: null,
      fromDate: '',
      toDate: ''
    };

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

    this.isSuperAdmin =
      this.storageService.getRole().toLowerCase() === 'superadmin';

    this.canDownload =
      this.menuAccess.canDownload(this.SUBMENU_ID);

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.getDealerList();
    this.initDefaultDates();
  }

  initDefaultDates(): void {
    const to = new Date();
    const from = new Date();

    from.setDate(to.getDate() - 30);

    this.reportFilterFormData.toDate =
      to.toISOString().split('T')[0];

    this.reportFilterFormData.fromDate =
      from.toISOString().split('T')[0];
  }

  getDealerList(): void {

    this.loader.show();

    this.dealerMasterService
      .getDealerDropdown(this.dealerCode)
      .subscribe({
        next: (res: any) => {

          this.loader.hide();

          this.dealerList = res.data ?? [];

          if (!this.dealerCode) {
            this.dealerList.unshift({
              dealerCode: 'ALL',
              dealerName: 'All'
            });
          }
          this.reportFilterFormData.selectedDealerCode =
            this.dealerCode || (this.isSuperAdmin ? 'ALL' : '');
          this.loadLocationList();
        },
        error: (err) => {

          this.loader.hide();
          console.error(err);

          this.toaster.show(
            'Something went wrong.',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }
      });
  }

  onDealerChange(): void {
    this.reportFilterFormData.selectedLocation = null;
    this.loadLocationList();
  }

  private loadLocationList(): void {
    const selectedDealerCode = this.reportFilterFormData.selectedDealerCode;
    const dealerCode = selectedDealerCode && selectedDealerCode !== 'ALL'
      ? selectedDealerCode
      : null;

    this.locationList = [];
    this.loader.show();
    this.locationMasterService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (locations: ReportLocationOption[]) => {
        this.loader.hide();
        this.locationList = (locations ?? [])
          .filter(location => Number(location.locareaidno) === 2)
          .map(location => ({
            ...location,
            dealerName: this.dealerList.find(dealer => dealer.dealerCode === location.dealercode)?.dealerName
          }));
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Unable to load locations.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  getLocationLabel(location: ReportLocationOption): string {
    const name = location.locname || location.loccode || 'Unknown location';
    return this.reportFilterFormData.selectedDealerCode === 'ALL'
      ? `${location.dealerName || location.dealercode} - ${name}`
      : name;
  }

  getStockAdjustmentReport(): void {

    const dealerCode =
      this.reportFilterFormData.selectedDealerCode === 'ALL'
        ? null
        : this.reportFilterFormData.selectedDealerCode;
    const selectedLocation = this.reportFilterFormData.selectedLocation;

    const fromDate = new Date(
      this.reportFilterFormData.fromDate
    );

    const toDate = new Date(
      this.reportFilterFormData.toDate
    );

    this.loader.show();

    this.reportService
      .getStockAdjustmentReport(
        fromDate,
        toDate,
        dealerCode,
        selectedLocation?.loccode ?? null,
        selectedLocation?.dealercode ?? null
      )
      .subscribe({
        next: (res: any) => {

          this.loader.hide();

          console.log(
            'STOCK ADJUSTMENT REPORT =>',
            res
          );

          this.stockAdjustmentData = (res ?? [])
            .filter((x: any) => Number(x.locareaidno) === 2);
        },


        error: (err: any) => {

          this.loader.hide();

          console.error(err);

          this.toaster.show(
            'Unable to load report.',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }

      });
  }

  onFilterRecords(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.getStockAdjustmentReport();
  }

  resetForm(): void {

    this.reportFilterFormData = {
      selectedDealerCode: this.dealerCode || (this.isSuperAdmin ? 'ALL' : ''),
      selectedLocation: null,
      fromDate: this.reportFilterFormData.fromDate,
      toDate: this.reportFilterFormData.toDate
    };

    this.initDefaultDates();

    this.reportFilterForm?.control.markAsUntouched();
    this.loadLocationList();
  }

  openReportList(): void {

    this.router.navigate(
      ['/stock-bill-list']
    );
  }

  exportExcel(): void {

    if (!this.stockAdjustmentData ||
      this.stockAdjustmentData.length === 0) {

      this.toaster.show(
        'No data available to export.',
        {
          classname: 'bg-warning text-dark',
          delay: 3000
        }
      );

      return;
    }

    const excelData = this.stockAdjustmentData.map(
      (item: any, index: number) => ({
        'Sr No': index + 1,
        'Dealer Name': item.dealerName || 'Unknown',
        'Dealer Code': item.dealerCode || '',
        'Prefix No': item.prefixNo,
        'Date': item.adjustmentDate,
        'Location Name': item.locationName || 'Unknown',
        'Location Code': item.locationCode || '',
        'Part No': item.partNo,
        'Description': item.description,
        'Rate': item.rateStock,
        'Current Stock': item.currentStock,
        'Update Stock': item.updateStock,
        'Adjustment Qty': item.upQuantityStg,
        'Final Qty': item.finalQty
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Stock Adjustment Report'
    );

    XLSX.writeFile(
      workbook,
      'StockAdjustmentReport.xlsx'
    );
  }


  formatPrefix(prefixNo: string): string {
    if (!prefixNo) {
      return '';
    }

    const parts = prefixNo.split('/');

    if (parts.length > 0) {
      parts[parts.length - 1] = String(Number(parts[parts.length - 1]));
    }

    return parts.join('/');
  }


}
