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

import {
  NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';

import {
  ReportService
} from '../../../core/services/report.service';

import {
  VehicleSaleReportViewModel
} from '../../../ViewModels/models/vehicle-sale-report.model';

import {
  DealerDropdownItem
} from '../../../ViewModels/models/job-report.model';

@Component({
  selector: 'app-vehicle-sale-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule
  ],
  templateUrl: './vehicle-sale-report.html',
})

export class VehicleSaleReportComponent
  implements OnInit {

  filterForm!: FormGroup;

  reportData:
    VehicleSaleReportViewModel[] = [];

  dealerList:
    DealerDropdownItem[] = [];

  isLoading = false;

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
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
      fromDate:
        this.formatDateForInput(firstDay),
      toDate:
        this.formatDateForInput(today)
    });
  }

  formatDateForInput(
    date: Date
  ): string {

    return date
      .toISOString()
      .split('T')[0];
  }

  loadDealerDropdown(): void {

    this.reportService
      .getDealerDropdown()
      .subscribe({
        next: (response) => {

          this.dealerList = response;
        },
        error: (error) => {

          console.error(
            'Dealer dropdown error',
            error
          );
        }
      });
  }

  loadReport(): void {

    this.isLoading = true;

    const dealerCode =
      this.filterForm
        .get('dealerCode')
        ?.value;

    const fromDate =
      this.parseDate(
        this.filterForm
          .get('fromDate')
          ?.value
      );

    const toDate =
      this.parseDate(
        this.filterForm
          .get('toDate')
          ?.value
      );

    this.reportService
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

          console.error(
            'Vehicle sale report error',
            error
          );

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

  parseDate(
    dateString: string
  ): Date | undefined {

    return dateString
      ? new Date(dateString)
      : undefined;
  }

  formatDate(date: any): string {

    if (!date) {

      return '';
    }

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
      .map(row =>
        row.map(value =>
          `"${value ?? ''}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob(
      [csvContent],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

    const link =
      document.createElement('a');

    const url =
      URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute(
      'download',
      'vehicle-sale-report.csv'
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }
}