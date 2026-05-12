import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import {
  VehicleSaleReportService,
  VehicleSaleReportViewModel,
  DealerDropdownItem
} from '../../../core/services/vehicle-sale-report.service';

@Component({
  selector: 'app-vehicle-sale-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule
  ],
  templateUrl:'./vehicle-sale-report.html',
})
export class VehicleSaleReportComponent
  implements OnInit {

  filterForm!: FormGroup;

  reportData: VehicleSaleReportViewModel[] = [];

  dealerList: DealerDropdownItem[] = [];

  isLoading: boolean = false;

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private vehicleSaleReportService:
      VehicleSaleReportService
  ) {

    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {

    this.initializeDates();

    this.loadDealerDropdown();

    this.loadReport();
  }

  initializeDates(): void {

    const today = new Date();

    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.filterForm.patchValue({
      fromDate: this.formatDateForInput(firstDay),
      toDate: this.formatDateForInput(today)
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadDealerDropdown(): void {

    this.vehicleSaleReportService
      .getDealerDropdown()
      .subscribe({
        next: (data) => {
          this.dealerList = data;
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  loadReport(): void {

    this.isLoading = true;

    const dealerCode =
      this.filterForm.get('dealerCode')?.value;

    const fromDate =
      this.parseDate(
        this.filterForm.get('fromDate')?.value
      );

    const toDate =
      this.parseDate(
        this.filterForm.get('toDate')?.value
      );

    this.vehicleSaleReportService
      .getVehicleSaleReport(
        dealerCode,
        fromDate,
        toDate
      )
      .subscribe({
        next: (response) => {

          this.reportData = response;

          this.isLoading = false;
        },
        error: (error) => {

          console.error(error);

          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.loadReport();
  }

  onReset(): void {

    this.filterForm.reset();

    this.initializeDates();

    this.loadReport();
  }

  parseDate(dateString: string): Date | undefined {

    return dateString
      ? new Date(dateString)
      : undefined;
  }

  formatDate(date: any): string {

    if (!date) return '';

    return new Date(date)
      .toLocaleDateString('en-IN');
  }

  exportToCSV(): void {

    const headers = [
      'SR.NO',
      'MODEL CODE',
      'MODEL DESCRIPTION',
      'CHASSIS NO',
      'REG NO',
      'DEALER CODE',
      'DEALER NAME',
      'CUSTOMER NAME',
      'MOBILE NO',
      'SALE DATE',
      'INVOICE NO',
      'BATTERY NO',
      'TOTAL AMOUNT'
    ];

    const rows = this.reportData.map(x => [
      x.srNo,
      x.modelCode,
      x.modelDescription,
      x.chasisNo,
      x.regNo,
      x.dealerCode,
      x.dealerName,
      x.name,
      x.mobileNo,
      this.formatDate(x.saleDate),
      x.invoiceNo,
      x.batteryNo,
      x.totalAmount
    ]);

    const csvContent = [
      headers,
      ...rows
    ]
    .map(e => e.join(','))
    .join('\n');

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute(
      'download',
      'vehicle-sale-report.csv'
    );

    link.click();
  }
}
