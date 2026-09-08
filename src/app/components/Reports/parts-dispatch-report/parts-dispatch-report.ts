// src\app\components\Reports\parts-dispatch-report\parts-dispatch-report.ts
import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ReportService }
from '../../../core/services/report.service';

@Component({
  selector: 'app-parts-dispatch-report',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './parts-dispatch-report.html',

  styleUrls:
    ['./parts-dispatch-report.scss']
})
export class PartsDispatchReport
implements OnInit {

  loading = false;

  dropdownLoading = false;

  reportData: any[] = [];

  dealerList: any[] = [];

  dealerCode = '';

  fromDate = '';

  toDate = '';

  isSuperAdmin = false;

  constructor(
    private reportService: ReportService
  ) { }

  ngOnInit(): void {

    this.isSuperAdmin = this.checkIsSuperAdmin();

    if (this.isSuperAdmin) {
      this.loadDealers();
    }

    this.setDefaultDateRange();

    this.getReport();

  }

  private checkIsSuperAdmin(): boolean {
    const role = localStorage.getItem('role');
    return role === 'SuperAdmin';
  }

  // =========================================
  // DEFAULT DATE RANGE (current month)
  // =========================================

  private setDefaultDateRange(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.fromDate = this.toDateInputString(firstDayOfMonth);
    this.toDate = this.toDateInputString(now);
  }

  private toDateInputString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // =========================================
  // LOAD DEALERS
  // =========================================

  loadDealers(): void {

    this.dropdownLoading = true;

    this.reportService
      .getDealerList()
      .subscribe({

        next: (response) => {

          this.dealerList =
            response || [];

          this.dropdownLoading = false;
        },

        error: (error) => {

          console.error(error);

          this.dropdownLoading = false;
        }
      });
  }

  // =========================================
  // GET REPORT
  // =========================================

  getReport(): void {

  this.loading = true;

  this.reportService
    .getPartsDispatchReport(

      this.dealerCode,

      this.fromDate
        ? new Date(this.fromDate)
        : undefined,

      this.toDate
        ? new Date(this.toDate)
        : undefined
    )
    .subscribe({

      next: (response) => {

        this.reportData =
          Array.isArray(response)
            ? response
            : [];

        this.loading = false;
      },

      error: (error) => {

        console.error(error);

        this.reportData = [];

        this.loading = false;
      }
    });
}

  // =========================================
  // RESET
  // =========================================

  resetFilters(): void {

    this.dealerCode = '';

    this.setDefaultDateRange();

    this.getReport();
  }

  // =========================================
  // EXPORT CSV
  // NEW — mirrors the on-screen table exactly, one row per record,
  // including the three warranty-status columns as plain text (the
  // colored badges are a display-only affordance; CSV has no styling).
  // =========================================

  private formatDateForExport(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
  }

  exportToCSV(): void {
    if (!this.reportData || this.reportData.length === 0) {
      return;
    }

    const headers = [
      'SR NO', 'Dealer Name', 'Dealer Code', 'Customer Name', 'Mobile No',
      'City', 'State', 'Vehicle Model', 'Vehicle VIN', 'Battery Master Name',
      'Date Of Sale', 'Part Name', 'Device Group', 'Device Type', 'Item Description',
      'Std Warranty (Months)', 'Std Warranty (ODO)', 'Ext Warranty (Months)', 'Ext Warranty (ODO)',
      'Std Warranty Expiry', 'Ext Warranty Expiry', 'Last ODO Reading Date', 'ODO Reading',
      'Warranty Status (Date)', 'Warranty Status (ODO)', 'Final Warranty Status'
    ];

    const rows = this.reportData.map(item => [
      item.srNo,
      item.dealerName,
      item.dealerCode,
      item.customerName,
      item.mobileNo,
      item.city,
      item.state,
      item.vehicleModel,
      item.vehicleVIN,
      item.batteryMasterName,
      this.formatDateForExport(item.dateOfSale),
      item.partName,
      item.deviceGroup,
      item.deviceType,
      item.itemDescription,
      item.vehicleStandardWarrantyMonths,
      item.vehicleStandardWarrantyODOReading,
      item.vehicleExtendedWarrantyMonths,
      item.vehicleExtendedWarrantyODOReading,
      this.formatDateForExport(item.standardWarrantyExpiryDate),
      this.formatDateForExport(item.extendedWarrantyExpiryDate),
      this.formatDateForExport(item.lastODOReadingDate),
      item.odoReadingLastDate,
      item.currentWarrantyStatusDate,
      item.currentWarrantyStatusODO,
      item.finalWarrantyStatus
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parts-dispatch-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}