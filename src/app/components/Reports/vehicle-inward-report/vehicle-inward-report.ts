// src\app\components\Reports\vehicle-inward-report\vehicle-inward-report.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import {
  VehicleInwardReportFilterModel,
  VehicleInwardReportViewModel,
  VehicleInwardReportResponse
} from '../../../ViewModels/models/vehicle-inward-report.model';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-vehicle-inward-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehicle-inward-report.html',
  styleUrl: './vehicle-inward-report.scss'   // ← add this line
})
export class VehicleInwardReport implements OnInit, OnDestroy {
  readonly SUBMENU_ID = 78;
  canDownload = false; 

  filterForm!: FormGroup;
  reportData: VehicleInwardReportViewModel[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer: boolean = false;
  loggedInDealerCode: string = '';

  pageIndex: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  totalQuantity: number = 0;
  totalRate: number = 0;
  totalSubsidy: number = 0;
  totalSgst: number = 0;
  totalCgst: number = 0;
  totalIgst: number = 0;
  totalHst: number = 0;
  grandTotal: number = 0;

  isLoading: boolean = false;
  exporting: boolean = false;
  errorMessage: string = '';

  sortColumn: string = 'invoiceDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService,
    private menuAccess: MenuAccessService
  ) {
    // CHANGED — per explicit request, this now defaults fromDate/toDate to
    // the current month (1st of this month through today) on load, same
    // pattern as the other report components. This intentionally reverses
    // the earlier "keep dates blank" fix noted below; if the current-month
    // range turns out to hide records the way the old default once did
    // (per the Repair Bill Report precedent), that's the tradeoff being
    // made here — worth watching for after this ships.
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [this.getDefaultFromDate()],
      toDate: [this.getDefaultToDate()],
      locationCode: [''],
      invoiceNo: [''],
      chassisNo: [''],
      motorNo: [''],
      batteryNo: ['']
    });
  }

  ngOnInit(): void {
    const storedRole = (this.storageService.getRole() ?? '').trim().toLowerCase();
    this.loggedInDealerCode = this.storageService.getDealerCode() ?? '';

    const adminRoles = ['superadmin', 'admin', 'administrator'];
    this.isDealer = !adminRoles.includes(storedRole);

    if (this.isDealer) {
      this.filterForm.get('dealerCode')?.setValue(this.loggedInDealerCode);
      this.filterForm.get('dealerCode')?.disable();
    } else {
      // SuperAdmin/Admin — load the full dealer list for the dropdown.
      // ReportService.getDealerDropdown() has no dealer-scoping on the
      // backend, so it always returns every dealer regardless of caller.
      this.loadDealerDropdown();
    }

    this.loadReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================
  // DEFAULT DATE RANGE (current month)
  // NEW — same pattern as the other report components. Split into two
  // getters (rather than a single setDefaultDateRange() mutator) so they
  // can be used directly as FormBuilder initial values in the constructor,
  // and reused identically in onReset() below.
  // =========================================

  private getDefaultFromDate(): string {
    const now = new Date();
    return this.toDateInputString(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  private getDefaultToDate(): string {
    return this.toDateInputString(new Date());
  }

  // Formats a Date as 'YYYY-MM-DD' in LOCAL time (not UTC), so it binds
  // correctly to <input type="date"> and matches what the user's
  // clock/calendar says "today" is.
  private toDateInputString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadDealerDropdown(): void {
    this.reportService.getDealerDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DealerDropdownItem[]) => (this.dealerList = data),
        error: () => (this.dealerList = [])
      });
  }

  loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const filter = this.buildFilterModel();

    // Endpoint path confirmed as "vehicle-inward" (not "vehicle-inward-report")
    this.reportService.getVehicleInwardReport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: VehicleInwardReportResponse) => {
          this.reportData = response.data;
          this.totalRecords = response.totalRecords;
          this.pageIndex = response.pageIndex;
          this.pageSize = response.pageSize;
          this.totalQuantity = response.totalQuantity;
          this.totalRate = response.totalRate;
          this.totalSubsidy = response.totalSubsidy;
          this.totalSgst = response.totalSgst;
          this.totalCgst = response.totalCgst;
          this.totalIgst = response.totalIgst;
          this.totalHst = response.totalHst;
          this.grandTotal = response.grandTotal;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load vehicle inward report.';
          this.reportData = [];
          this.totalRecords = 0;
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    // CHANGED — filterForm.reset() alone would clear fromDate/toDate back
    // to '', not to the current-month default. Explicitly restoring them
    // here keeps Reset consistent with the constructor's initial state,
    // same as the other report components.
    this.filterForm.reset({
      dealerCode: '',
      fromDate: this.getDefaultFromDate(),
      toDate: this.getDefaultToDate(),
      locationCode: '',
      invoiceNo: '',
      chassisNo: '',
      motorNo: '',
      batteryNo: ''
    });

    if (this.isDealer) {
      this.filterForm.get('dealerCode')?.setValue(this.loggedInDealerCode);
      this.filterForm.get('dealerCode')?.disable();
    }

    this.pageIndex = 1;
    this.loadReport();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.reportData.sort((a, b) => {
      const aValue = (a as any)[this.sortColumn];
      const bValue = (b as any)[this.sortColumn];
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  exportToExcel(): void {
    this.exporting = true;
    this.errorMessage = '';

    const filter = this.buildFilterModel();

    this.reportService.exportVehicleInwardReport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.exporting = false;

          if (!data || data.length === 0) {
            this.errorMessage = 'No data available to export.';
            return;
          }

          this.generateCsv(data);
        },
        error: (error) => {
          this.exporting = false;
          this.errorMessage = error?.error?.message || 'Failed to export vehicle inward report.';
        }
      });
  }

  private generateCsv(data: VehicleInwardReportViewModel[]): void {
    const headers = [
      'Sr No', 'Receiving Date', 'Invoice Date', 'Dealer Code', 'Dealer Name',
      'BG Invoice No', 'Lot Inspection No', 'Party Name', 'Purchase Receiving Location',
      'Model Name', 'Quantity', 'Chassis No', 'Motor No', 'Colour', 'Mfg Year',
      'Battery No', 'Battery Make', 'Battery Capacity', 'Battery Chemical',
      'Charger No', 'Controller No', 'Rate', 'FAME2 Subsidy',
      'SGST', 'CGST', 'IGST', 'HST'
    ];

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN') : '';

    const csvRows = [
      headers,
      ...data.map(row => [
        row.srNo, fmt(row.receivingDate), fmt(row.invoiceDate), row.dealerCode, row.dealerName,
        row.bgInvoiceNo, row.lotInspectionNo, row.partyName, row.purchaseReceivingLocation,
        row.modelName, row.quantity, row.chassisNo, row.motorNo, row.colour, row.mfgYear,
        row.batteryNo, row.batteryMake, row.batteryCapacity, row.batteryChemical,
        row.chargerNo, row.controllerNo, row.rate, row.subsidyAmountFame2,
        row.sgst, row.cgst, row.igst, row.hst
      ])
    ];

    const csvString = csvRows
      .map(r => r.map(cell => `"${cell ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-inward-report-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.loadReport();
  }

  firstPage(): void { this.goToPage(1); }
  previousPage(): void { this.goToPage(this.pageIndex - 1); }
  nextPage(): void { this.goToPage(this.pageIndex + 1); }
  lastPage(): void { this.goToPage(this.totalPages); }

  private buildFilterModel(): VehicleInwardReportFilterModel {
    const raw = this.filterForm.getRawValue();
    return {
      dealerCode: raw.dealerCode || undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      locationCode: raw.locationCode || undefined,
      invoiceNo: raw.invoiceNo || undefined,
      chassisNo: raw.chassisNo || undefined,
      motorNo: raw.motorNo || undefined,
      batteryNo: raw.batteryNo || undefined,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value ?? 0);
  }
}