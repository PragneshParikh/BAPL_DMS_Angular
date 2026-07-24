import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import {
  MaterialTransferReportFilterModel,
  MaterialTransferReportRow,
  MaterialTransferReportPagedResponse
} from '../../../ViewModels/models/material-transferModel';
// Same shared constants module used by Repair Bill Report — adjust path
// if it differs.
import { IssueTypes } from '../../../constant';

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
  totalMrp: number = 0;
  totalCgstAmount: number = 0;
  totalSgstAmount: number = 0;
  totalIgstAmount: number = 0;
  totalGstAmount: number = 0;

  isLoading: boolean = false;
  exporting: boolean = false;
  errorMessage: string = '';

  sortColumn: string = 'transferDate';
  sortDirection: 'asc' | 'desc' = 'desc';

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
      fromDate: [''],
      toDate: [''],
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

    this.loadReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.totalMrp = response.totalMrp;
          this.totalCgstAmount = response.totalCgstAmount;
          this.totalSgstAmount = response.totalSgstAmount;
          this.totalIgstAmount = response.totalIgstAmount;
          this.totalGstAmount = response.totalGstAmount;
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
      'Sr No', 'Dealer Code', 'Dealer Name', 'Dealer Location', 'Location Name', 'Dealer City', 'Dealer State',
      'Job No', 'Chassis No', 'Customer Name', 'Customer Mobile',
      'Material Prefix', 'Material Issue No', 'Transfer Date',
      'Item Code', 'Item Name', 'Item Description', 'HSN Code',
      'Quantity', 'Item Rate', 'MRP',
      'CGST %', 'CGST Amt', 'SGST %', 'SGST Amt', 'IGST %', 'IGST Amt', 'Total GST',
      'Amount',
      'Serial No', 'Remarks', 'Rack No', 'Bin',
      'Issue Type', 'Job Card Status', 'Prepared By (Dealer Code)', 'Modified By (Dealer Code)'
    ];

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN') : '';

    const csvRows = [
      headers,
      ...data.map(row => [
        row.srNo, row.dealerCode, row.dealerName, row.dealerLocation, row.locationName, row.dealerCity, row.dealerState,
        row.jobNo, row.chassisNo, row.customerName, row.customerMobile,
        row.materialPrefix, row.materialIssueNumber, fmt(row.transferDate),
        row.itemCode, row.itemName, row.itemDesc, row.hsncode,
        row.quantity, row.itemRate, row.mrp,
        row.cgstPercent, row.cgstAmount, row.sgstPercent, row.sgstAmount, row.igstPercent, row.igstAmount, row.totalGstAmount,
        row.amount,
        row.serialNo, row.remarks, row.rackNo, row.bin,
        this.getIssueTypeLabel(row.issueType), row.jobCardStatus, row.preparedByDealerCode, row.modifiedByDealerCode
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