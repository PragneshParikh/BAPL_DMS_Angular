// src\app\components\Reports\part-dispatch-kit-report\part-dispatch-kit-report.ts
import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  ReportService
} from '../../../core/services/report.service';

import {
  PartDispatchKitReportViewModel
} from '../../../ViewModels/models/part-dispatch-kit-report.model';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-part-dispatch-kit-report',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './part-dispatch-kit-report.html',

  styleUrls:
    ['./part-dispatch-kit-report.scss']
})
export class PartDispatchKitReport
implements OnInit {
  readonly SUBMENU_ID = 51;
  canDownload = false;

  loading = false;

  reportData:
    PartDispatchKitReportViewModel[] = [];

  dealerList: any[] = [];

  poTypeList: string[] = [];

  dealerCode = '';

  poType = '';

  fromDate = '';

  toDate = '';

  isSuperAdmin = false;

  constructor(private reportService: ReportService, private menuAccess: MenuAccessService) { }

  ngOnInit(): void {
    this.isSuperAdmin = this.checkIsSuperAdmin();
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);

    if (this.isSuperAdmin) {
      this.loadDealers();
    }

    this.loadPOType();
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

    this.reportService
      .getDealerList()
      .subscribe({

        next: (response) => {

          this.dealerList =
            response || [];
        },

        error: (error) => {

          console.error(error);
        }
      });
  }

  // =========================================
  // LOAD PO TYPES
  // =========================================

  loadPOType(): void {

    this.reportService
      .getPartDispatchKitPOTypeDropdown()
      .subscribe({

        next: (response) => {

          this.poTypeList =
            response || [];
        },

        error: (error) => {

          console.error(error);
        }
      });
  }

  // =========================================
  // GET REPORT
  // =========================================

  getReport(): void {

    this.loading = true;

    this.reportService
      .getPartDispatchKitReport(

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

          let data =
            Array.isArray(response)
              ? response
              : [];

          if (this.poType) {

            data = data.filter(x =>
              x.poType === this.poType
            );
          }

          this.reportData = data;

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

    this.poType = '';

    this.setDefaultDateRange();

    this.getReport();
  }

  // =========================================
  // EXPORT CSV
  // NEW — mirrors the on-screen table exactly, one row per record. The
  // PO Type filter is applied client-side inside getReport() above, so
  // reportData already reflects it by the time this runs — no separate
  // "export" API call needed, unlike reports whose export hits its own
  // backend endpoint.
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
      'Sr No', 'PO Number', 'PO Date', 'Submit To ERP Date', 'PO Type',
      'Company Name', 'Mobile No', 'Dealer Code', 'Dealer City', 'Dealer State',
      'Location Code', 'Location Name', 'Location City'
    ];

    const rows = this.reportData.map(item => [
      item.srNo,
      item.poNumber,
      this.formatDateForExport(item.poDate),
      this.formatDateForExport(item.submitToERPDate),
      item.poType,
      item.companyName,
      item.mobileNo,
      item.dealerCode,
      item.dealerCity,
      item.dealerState,
      item.locationCode,
      item.locationName,
      item.locationCity
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `part-dispatch-kit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}