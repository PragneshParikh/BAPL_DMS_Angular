import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// import * as XLSX from 'xlsx';

import { VehicleInwardReportService, VehicleInwardReportFilter } from '../../../core/services/vehicle-inward-report.service';
import { DealerService } from '../../../core/services/dealer-service';

interface VehicleInwardReportItem {
  srNo: number;
  receivingDate: string | null;
  invoiceDate: string | null;
  dealerCode: string | null;
  dealerName: string | null;
  bgInvoiceNo: string | null;
  lotInspectionNo: number | null;
  partyName: string | null;
  purchaseReceivingLocation: string | null;
  modelName: string | null;
  quantity: number;
  chassisNo: string | null;
  motorNo: string | null;
  colour: string | null;
  mfgYear: number | null;
  batteryNo: string | null;
  batteryMake: string | null;
  batteryCapacity: string | null;
  batteryChemical: string | null;
  chargerNo: string | null;
  controllerNo: string | null;
  rate: number;
  subsidyAmountFame2: number;
  sgst: number;
  cgst: number;
  igst: number;
  hst: number;
}

@Component({
  selector: 'app-vehicle-inward-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-inward-report.html',
  styleUrl: './vehicle-inward-report.scss',
})
export class VehicleInwardReport implements OnInit {

  Math = Math;

  filterForm!: FormGroup;

  isLoading = false;
  isDealer = false;
  loggedInDealerCode = '';
  dealerList: any[] = [];

  reportData: VehicleInwardReportItem[] = [];

  pageIndex = 1;
  pageSize = 25;
  totalRecords = 0;

  totals = {
    quantity: 0, rate: 0, subsidy: 0, sgst: 0, cgst: 0, igst: 0, hst: 0, grandTotal: 0,
  };

  get averageRate(): number {
    return this.totalRecords > 0 ? this.totals.rate / this.totalRecords : 0;
  }

  constructor(
    private fb: FormBuilder,
    private inwardService: VehicleInwardReportService,
    private dealerService: DealerService,
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: [''],
      locationCode: [''],
      invoiceNo: [''],
      chassisNo: [''],
      motorNo: [''],
      batteryNo: [''],
    });

    // Assumes the same localStorage convention used elsewhere in this app
    // (see bgemployee-master.ts loadLoggedInDealer()) — adjust if the app
    // resolves the logged-in dealer/role differently.
    this.loggedInDealerCode = localStorage.getItem('dealerCode') || '';
    this.isDealer = !!this.loggedInDealerCode;

    if (!this.isDealer) {
      this.loadDealers();
    }

    this.loadReport();
  }

  loadDealers(): void {
    // NOTE: confirm the actual "get all dealers" method name on DealerService —
    // only getByDealerCode() is confirmed to exist on it elsewhere in this app.
    (this.dealerService as any).get?.().subscribe?.({
      next: (res: any[]) => (this.dealerList = res ?? []),
      error: (err: any) => console.error('Dealer list load error', err),
    });
  }

  private buildFilter(): VehicleInwardReportFilter {
    const f = this.filterForm.value;
    return {
      dealerCode: this.isDealer ? this.loggedInDealerCode : (f.dealerCode || undefined),
      fromDate: f.fromDate || undefined,
      toDate: f.toDate || undefined,
      locationCode: f.locationCode || undefined,
      invoiceNo: f.invoiceNo || undefined,
      chassisNo: f.chassisNo || undefined,
      motorNo: f.motorNo || undefined,
      batteryNo: f.batteryNo || undefined,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.inwardService.getInwardReport(this.buildFilter()).subscribe({
      next: (res: any) => {
        this.reportData = res?.data ?? [];
        this.totalRecords = res?.totalRecords ?? 0;
        this.totals = {
          quantity: res?.totalQuantity ?? 0,
          rate: res?.totalRate ?? 0,
          subsidy: res?.totalSubsidy ?? 0,
          sgst: res?.totalSgst ?? 0,
          cgst: res?.totalCgst ?? 0,
          igst: res?.totalIgst ?? 0,
          hst: res?.totalHst ?? 0,
          grandTotal: res?.grandTotal ?? 0,
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Vehicle Inward report load error', err);
        this.reportData = [];
        this.totalRecords = 0;
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', locationCode: '',
      invoiceNo: '', chassisNo: '', motorNo: '', batteryNo: '',
    });
    this.pageIndex = 1;
    this.loadReport();
  }

  firstPage(): void { this.pageIndex = 1; this.loadReport(); }
  previousPage(): void { if (this.pageIndex > 1) { this.pageIndex--; this.loadReport(); } }
  nextPage(): void { if (this.pageIndex * this.pageSize < this.totalRecords) { this.pageIndex++; this.loadReport(); } }
  lastPage(): void { this.pageIndex = Math.ceil(this.totalRecords / this.pageSize) || 1; this.loadReport(); }

  formatDate(value: any): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    if (value == null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value);
  }

  // Export fetches the FULL filtered set (not just the current page) by
  // requesting a large pageSize — there's no dedicated /export endpoint
  // for this report yet, unlike Job Card / Vehicle Sale Bill reports.
  exportToExcel(): void {
    const exportFilter: VehicleInwardReportFilter = { ...this.buildFilter(), pageIndex: 1, pageSize: 100000 };

    this.inwardService.getInwardReport(exportFilter).subscribe({
      next: (res: any) => {
        const data: VehicleInwardReportItem[] = res?.data ?? [];
        if (!data.length) return;

        const rows = data.map((r) => ({
          'Sr No': r.srNo,
          'Receving Date': this.formatDate(r.receivingDate),
          'Invoice Date': this.formatDate(r.invoiceDate),
          'Dealer Code': r.dealerCode,
          'Dealer Name': r.dealerName,
          'BG Invoice No': r.bgInvoiceNo,
          'Lot Inspection No': r.lotInspectionNo,
          'Party Name': r.partyName,
          'Purchase Receving Location': r.purchaseReceivingLocation,
          'Model Name (With Colour)': r.modelName,
          'Quantity': r.quantity,
          'Chassis No': r.chassisNo,
          'Motor No': r.motorNo,
          'Colour': r.colour,
          'Mfg Year': r.mfgYear,
          'Battery No': r.batteryNo,
          'Battery Make': r.batteryMake,
          'Battery Capacity': r.batteryCapacity,
          'Battery Chemical': r.batteryChemical,
          'Charger No': r.chargerNo,
          'Controller No': r.controllerNo,
          'Rate': r.rate,
          'Subsidy Amount Fame 2': r.subsidyAmountFame2,
          'SGST': r.sgst,
          'CGST': r.cgst,
          'IGST': r.igst,
          'HST': r.hst,
        }));

        // const ws = XLSX.utils.json_to_sheet(rows);
        // const wb = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Inwards Report');
        // XLSX.writeFile(wb, `vehicle-inward-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      },
      error: (err) => console.error('Export fetch error', err),
    });
  }
}