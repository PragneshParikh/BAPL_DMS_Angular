import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import { IssueTypes } from '../../../constant';
import {
  MaterialTransferReportFilterModel,
  MaterialTransferReportRow,
  MaterialTransferReportPagedResponse
} from '../../../ViewModels/models/material-transferModel';

@Component({
  selector: 'app-material-transfer-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './material-transfer-report.html'
})
export class MaterialTransferReportComponent implements OnInit, OnDestroy {

  filterForm!: FormGroup;
  reportData: MaterialTransferReportRow[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer: boolean = false;
  loggedInDealerCode: string = '';

  pageIndex: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  totalQuantity: number = 0;
  totalAmount: number = 0;

  isLoading: boolean = false;
  exporting: boolean = false;
  errorMessage: string = '';

  sortColumn: string = 'transferDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // TODO: no Issue Type master/lookup table exists anywhere in the backend
  // codebase — MaterialTransfer.IssueType is a bare int with no confirmed
  // meaning. Populate this map with real code→label pairs once known;
  // until then, getIssueTypeLabel() falls back to showing the raw code.
    private issueTypeLabels: Record<number, string> = Object.fromEntries(
        IssueTypes.map(t => [t.id, t.name])
    )
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
      jobNo: [null],
      chassisNo: [''],
      partyName: [''],
      itemCode: [''],
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

    this.reportService.getMaterialTransferReport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MaterialTransferReportPagedResponse) => {
          this.reportData = response.data;
          this.totalRecords = response.totalRecords;
          this.pageIndex = response.pageIndex;
          this.pageSize = response.pageSize;
          this.totalQuantity = response.totalQuantity;
          this.totalAmount = response.totalAmount;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load material transfer report.';
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

  // Falls back to "Type {n}" for any code not yet mapped in issueTypeLabels.
  getIssueTypeLabel(issueType: number | null | undefined): string {
    if (issueType === null || issueType === undefined) return '-';
    return this.issueTypeLabels[issueType] ?? `Type ${issueType}`;
  }

  exportToExcel(): void {
    this.exporting = true;
    this.errorMessage = '';

    const filter: MaterialTransferReportFilterModel = {
      ...this.buildFilterModel(),
      pageIndex: 1,
      pageSize: 100000
    };

    this.reportService.exportMaterialTransferReport(filter)
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
          this.errorMessage = error?.error?.message || 'Failed to export material transfer report.';
        }
      });
  }

  private generateCsv(data: MaterialTransferReportRow[]): void {
    const headers = [
      'Sr No', 'Dealer Code', 'Dealer Name', 'Dealer City', 'Dealer State',
      'Job No', 'Job Invoice No', 'Chassis No', 'Registration No',
      'Customer Name', 'Customer Mobile', 'Service Location',
      'Material Prefix', 'Material Issue No', 'Transfer Date',
      'Item Code', 'Item Name', 'Item Description', 'HSN Code',
      'Quantity', 'Item Rate', 'Amount',
      'Issue Type',
      'Serial No', 'Remarks', 'Item Received', 'Valid Days', 'Rack No', 'Bin',
      'Job Card Status', 'Prepared By (Dealer Code)', 'Modified By (Dealer Code)'
    ];

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN') : '';

    const csvRows = [
      headers,
      ...data.map(row => [
        row.srNo, row.dealerCode, row.dealerName, row.dealerCity, row.dealerState,
        row.jobNo, row.jobInvoiceNo, row.chassisNo, row.registerNo,
        row.customerName, row.customerMobile, row.serviceLocationName,
        row.materialPrefix, row.materialIssueNumber, fmt(row.transferDate),
        row.itemCode, row.itemName, row.itemDesc, row.hsncode,
        row.quantity, row.itemRate, row.amount,
        this.getIssueTypeLabel(row.issueType),
        row.serialNo, row.remarks, row.itemReceived, row.validDays, row.rackNo, row.bin,
        row.jobCardStatus, row.preparedByDealerCode, row.modifiedByDealerCode
      ])
    ];

    const csvString = csvRows
      .map(r => r.map(cell => `"${cell ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-transfer-report-${new Date().getTime()}.csv`;
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

  private buildFilterModel(): MaterialTransferReportFilterModel {
    const raw = this.filterForm.getRawValue();
    return {
      dealerCode: raw.dealerCode || undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      jobNo: raw.jobNo,
      chassisNo: raw.chassisNo,
      partyName: raw.partyName,
      itemCode: raw.itemCode,
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