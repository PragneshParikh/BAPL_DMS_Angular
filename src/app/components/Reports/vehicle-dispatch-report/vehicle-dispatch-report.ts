// src\app\components\Reports\vehicle-dispatch-report\vehicle-dispatch-report.ts
// Vehicle Dispatch Report: OEM invoices to dealers (VehicleInward) - DMS / ERP dispatches and the
// Cogxim history imported from the Vehicle Dispatch Import page. SuperAdmin only.
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import {
  DispatchReportFilter, DispatchReportResponse, DispatchReportRow, VehicleDispatchService
} from '../../../core/services/vehicle-dispatch.service';

@Component({
  selector: 'app-vehicle-dispatch-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehicle-dispatch-report.html',
  providers: [ReportService]
})
export class VehicleDispatchReportComponent implements OnInit {
  private api = inject(VehicleDispatchService);
  private reportService = inject(ReportService);
  private storage = inject(StorageService);
  private fb = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];
  isSuperAdmin = false;

  reportData: DispatchReportRow[] = [];
  totals: DispatchReportResponse | null = null;
  isLoading = false;
  exporting = false;
  errorMessage: string | null = null;

  pageIndex = 1;
  pageSize = 100;
  readonly pageSizes = [50, 100, 250, 500];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: [''],
      invoiceNo: [''],
      chassisNo: [''],
      source: [''],
      status: [''],
      saleStatus: [''],
      search: ['']
    });

    this.isSuperAdmin = (this.storage.getRole() || '').toLowerCase().trim() === 'superadmin';
    if (!this.isSuperAdmin) return;

    this.initDates();
    this.reportService.getDealerDropdown().subscribe({
      next: res => { this.dealerList = res || []; },
      error: err => console.error('Dealer dropdown error', err)
    });
    this.loadReport();
  }

  initDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({ fromDate: this.toISO(firstDay), toDate: this.toISO(today) });
  }

  // local date (toISOString would shift the day back in IST before 05:30)
  toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private buildFilter(pageIndex: number, pageSize: number): DispatchReportFilter {
    const f = this.filterForm.value;
    return {
      dealerCode: f.dealerCode || undefined,
      fromDate: f.fromDate || undefined,
      toDate: f.toDate || undefined,
      invoiceNo: f.invoiceNo?.trim() || undefined,
      chassisNo: f.chassisNo?.trim() || undefined,
      source: f.source || '',
      status: f.status || '',
      saleStatus: f.saleStatus || '',
      search: f.search?.trim() || undefined,
      pageIndex,
      pageSize
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.api.getReport(this.buildFilter(this.pageIndex, this.pageSize)).subscribe({
      next: res => {
        this.totals = res;
        this.reportData = res?.data ?? [];
        this.isLoading = false;
      },
      error: err => {
        console.error('Vehicle dispatch report error', err);
        this.errorMessage = err?.status === 403 ? 'Only SuperAdmin can view this report.'
          : err?.status === 404 ? 'API endpoint not found - rebuild and restart the API.'
          : (err?.error?.message ?? 'Could not load the report.');
        this.reportData = [];
        this.totals = null;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void { this.pageIndex = 1; this.loadReport(); }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', invoiceNo: '', chassisNo: '',
      source: '', status: '', saleStatus: '', search: ''
    });
    this.initDates();
    this.pageIndex = 1;
    this.loadReport();
  }

  // ------------------------------------------------------------------ paging
  get totalPages(): number {
    return this.totals ? Math.max(1, Math.ceil(this.totals.totalRecords / this.pageSize)) : 1;
  }
  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageIndex) return;
    this.pageIndex = page;
    this.loadReport();
  }
  onPageSizeChange(): void { this.pageIndex = 1; this.loadReport(); }

  // ------------------------------------------------------------------ helpers
  formatDate(v: any): string {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }
  num(v: number | null | undefined): string { return v == null ? '0' : new Intl.NumberFormat('en-IN').format(v); }

  /** All rows matching the filter (not only this page) as CSV. */
  async exportToCSV(): Promise<void> {
    if (!this.totals?.totalRecords || this.exporting) return;
    this.exporting = true;
    try {
      const res = await firstValueFrom(this.api.getReport(this.buildFilter(1, 100000)));
      const rows = res?.data ?? [];
      const headers = [
        'Sr No', 'Invoice Date', 'Invoice No', 'Dealer Code', 'Dealer Name', 'Dealer City', 'Dealer State',
        'Loc Code', 'Location', 'Location City', 'Item Code', 'Model', 'Colour Code', 'Colour', 'Mfg Month', 'Mfg Year',
        'Chassis No', 'Motor No', 'Battery ID', 'Battery No', 'Battery No 2', 'Battery Capacity', 'Battery Chemistry', 'Battery Make',
        'Charger No', 'Controller No', 'Converter No', 'VCU', 'ECU Serial No', 'ECU IMEI', 'Immobilizer No', 'Bike SIM Id',
        'Voltage', 'Reg Number', 'Start Date', 'Tyre 1', 'Tyre 2', 'PO Number',
        'Received by Dealer', 'D2D', 'Source', 'Sale Bill No', 'Sale Date', 'Customer'
      ];
      const data = rows.map(x => [
        x.srNo, this.formatDate(x.invoiceDate), x.invoiceNo, x.dealerCode, x.dealerName, x.dealerCity, x.dealerState,
        x.locCode, x.locationName, x.locationCity, x.itemCode, x.modelName, x.colrCode, x.colourName, x.mfgMonth, x.mfgYear,
        x.chassisNo, x.motorNo, x.batteryId, x.batteryNo, x.batteryNo2, x.batteryCapacity, x.batteryChemistry, x.batteryMake,
        x.chargerNo, x.controllerNo, x.converter, x.vcu, x.ecuSerno, x.ecuImEi, x.immoblizerNo, x.bikeSimid,
        x.voltage, x.regNumber, x.startDate, x.tyreNo1, x.tyreNo2, x.poNumber,
        x.isAccepted ? 'YES' : 'NO', x.isD2d ? 'YES' : 'NO', x.source, x.saleBillNo, this.formatDate(x.saleDate), x.customerName
      ]);
      const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
      const csv = [headers, ...data].map(r => r.map(esc).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `VehicleDispatchReport_${this.toISO(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Vehicle dispatch export error', err);
    } finally {
      this.exporting = false;
    }
  }
}
