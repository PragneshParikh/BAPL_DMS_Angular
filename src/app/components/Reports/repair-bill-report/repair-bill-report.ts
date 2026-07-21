import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import {
  RepairBillReportFilterModel,
  RepairBillReportRow,
  RepairBillReportPagedResponse
} from '../../../ViewModels/models/repair-billModel';
// Same shared constants module that supplies IssueTypes for the Material
// Transfer Report — adjust path if it differs.
import { IssueTypes } from '../../../constant';

@Component({
  selector: 'app-repair-bill-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './repair-bill-report.html'
})
export class RepairBillReportComponent implements OnInit, OnDestroy {

  filterForm!: FormGroup;
  reportData: RepairBillReportRow[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer: boolean = false;
  loggedInDealerCode: string = '';

  pageIndex: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  totalItemRate: number = 0;
  totalCgstAmount: number = 0;
  totalSgstAmount: number = 0;
  totalIgstAmount: number = 0;
  totalGstAmount: number = 0;
  totalDiscount: number = 0;

  isLoading: boolean = false;
  exporting: boolean = false;
  errorMessage: string = '';

  sortColumn: string = 'repairBillDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  jobStatusOptions = ['Open', 'Closed'];

  private issueTypeLabels: Record<number, string> = Object.fromEntries(
    IssueTypes.map((t: any) => [t.id, t.name])
  );

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      billNo: [null],
      jobNo: [null],
      chassisNo: [''],
      partyName: [''],
      partCode: [''],
      labourCode: [''],
      jobStatus: [''],
      search: ['']
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
      this.loadDealerDropdown();
    }

    this.initializeFormWithDefaultDates();
    this.loadReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFormWithDefaultDates(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: this.formatDateForInput(firstDayOfMonth),
      toDate: this.formatDateForInput(today)
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
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
    if (this.filterForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const filter = this.buildFilterModel();

    this.reportService.getRepairBillReport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RepairBillReportPagedResponse) => {
          this.reportData = response.data;
          this.totalRecords = response.totalRecords;
          this.pageIndex = response.pageIndex;
          this.pageSize = response.pageSize;
          this.totalItemRate = response.totalItemRate;
          this.totalCgstAmount = response.totalCgstAmount;
          this.totalSgstAmount = response.totalSgstAmount;
          this.totalIgstAmount = response.totalIgstAmount;
          this.totalGstAmount = response.totalGstAmount;
          this.totalDiscount = response.totalDiscount;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load repair bill report.';
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
    this.filterForm.reset();
    this.initializeFormWithDefaultDates();

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

  getIssueTypeLabel(issueType: number | null | undefined): string {
    if (issueType === null || issueType === undefined) return '-';
    return this.issueTypeLabels[issueType] ?? `Type ${issueType}`;
  }

  exportToExcel(): void {
    this.exporting = true;
    this.errorMessage = '';

    const filter: RepairBillReportFilterModel = {
      ...this.buildFilterModel(),
      pageIndex: 1,
      pageSize: 100000
    };

    this.reportService.exportRepairBillReport(filter)
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
          this.errorMessage = error?.error?.message || 'Failed to export repair bill report.';
        }
      });
  }

  private generateCsv(data: RepairBillReportRow[]): void {
    const headers = [
      'Sr No', 'Dealer Code', 'Dealer Name', 'Dealer Location', 'City', 'State',
      'Job Date', 'Job Type', 'Service Head', 'Service Type',
      'Customer Name', 'Customer Mobile', 'Chassis No', 'Model Details', 'Job Status',
      'Repair Bill No', 'Repair Bill Date',
      'Part Code', 'Part Code Description',
      'Issue Type',
      'Item Rate',
      'CGST %', 'CGST Amt', 'SGST %', 'SGST Amt', 'IGST %', 'IGST Amt', 'Total GST',
      'Discount', 'Discount Type',
      'Labour Code', 'Labour Description',
      'Technician Name'
    ];

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN') : '';

    const csvRows = [
      headers,
      ...data.map(row => [
        row.srNo, row.dealerCode, row.dealerName, row.dealerLocation, row.city, row.state,
        fmt(row.jobDate), row.jobType, row.serviceHead, row.serviceType,
        row.customerName, row.customerMobile, row.chassisNo, row.modelDetails, row.jobStatus,
        row.repairBillNo, fmt(row.repairBillDate),
        row.partCode, row.partCodeDescription,
        this.getIssueTypeLabel(row.issueType),
        row.itemRate,
        row.cgstPercent, row.cgstAmount, row.sgstPercent, row.sgstAmount, row.igstPercent, row.igstAmount, row.totalGstAmount,
        row.discount, row.discountType,
        row.labourCode, row.labourDescription,
        row.technicianName
      ])
    ];

    const csvString = csvRows
      .map(r => r.map(cell => `"${cell ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repair-bill-report-${new Date().getTime()}.csv`;
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

  private buildFilterModel(): RepairBillReportFilterModel {
    const raw = this.filterForm.getRawValue();
    return {
      dealerCode: raw.dealerCode || undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      billNo: raw.billNo,
      jobNo: raw.jobNo,
      chassisNo: raw.chassisNo,
      partyName: raw.partyName,
      partCode: raw.partCode,
      labourCode: raw.labourCode,
      jobStatus: raw.jobStatus || undefined,
      search: raw.search,
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