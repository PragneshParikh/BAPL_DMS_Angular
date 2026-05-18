import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import {
  JobReportViewModel,
  JobReportPagedResponse,
  JobReportFilterModel,
  DealerWiseJobReportSummary,
  JobReportSummaryStats,
  DealerDropdownItem
} from '../../../ViewModels/models/job-report.model';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-job-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule
  ],
  templateUrl: './job-report.html'
})
export class JobReportComponent implements OnInit, OnDestroy {

  // ==================== PROPERTIES ====================
  filterForm!: FormGroup;
  reportData: JobReportViewModel[] = [];
  dealerWiseData: DealerWiseJobReportSummary[] = [];
  summaryStats: JobReportSummaryStats | null = null;
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  // Dealer restriction
  isDealer: boolean = false;
  loggedInDealerCode: string = '';

  // Pagination
  pageIndex: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  pageSizeOptions: number[] = [100];

  // Totals
  totalSpares: number = 0;
  totalAcsr: number = 0;
  totalOil: number = 0;
  totalLabour: number = 0;
  totalOutsideWork: number = 0;
  totalTaxable: number = 0;
  totalSGST: number = 0;
  totalCGST: number = 0;
  grandTotal: number = 0;

  // UI States
  isLoading: boolean = false;
  isDealerWiseView: boolean = false;
  expandedDealerCode: string | null = null;
  sortColumn: string = 'invoiceDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  displayColumns: string[] = [
    'srNo', 'invoiceNo', 'invoiceDate', 'jobNo', 'partyName',
    'partyMobileNo', 'regNo', 'mechanicName', 'invoiceType', 'invoiceMode',
    'sparesAmount', 'acsrAmount', 'oilAmount', 'labourAmount',
    'outsideWorkAmount', 'taxableAmount', 'sgstAmount', 'cgstAmount'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService  // ← injected
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      serviceLocation: [''],
      jobNo: [null],
      partyName: [''],
      chassisNo: [''],
      regNo: ['']
    });
  }

 ngOnInit(): void {
  const storedRole        = this.storageService.getRole();
  this.loggedInDealerCode = this.storageService.getDealerCode() ?? '';

  // SuperAdmin/Admin = sees all dealers
  // Any other role   = treated as a dealer user, locked to their own code
  const adminRoles = ['superadmin', 'admin', 'administrator'];
  this.isDealer = !adminRoles.includes(storedRole?.toLowerCase());

  console.table({ storedRole, loggedInDealerCode: this.loggedInDealerCode, isDealer: this.isDealer });

  if (this.isDealer) {
    this.filterForm.get('dealerCode')?.setValue(this.loggedInDealerCode);
    this.filterForm.get('dealerCode')?.disable();
  }

  this.initializeFormWithDefaultDates();
  this.loadDealerDropdown();
  this.loadReport();
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== INITIALIZATION ====================

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

  // ==================== DATA LOADING ====================

  loadReport(): void {
    if (this.filterForm.invalid) {
      console.error('Form is invalid');
      return;
    }

    this.isLoading = true;
    const filter = this.buildFilterModel();

    this.reportService.getJobReport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JobReportPagedResponse) => {
          this.handleReportResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading report:', error);
          this.isLoading = false;
        }
      });
  }

  loadDealerDropdown(): void {
    // Dealers don't need the dropdown — skip the API call
    if (this.isDealer) return;

    this.reportService.getDealerDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DealerDropdownItem[]) => {
          this.dealerList = data;
        },
        error: (error) => {
          console.error('Error loading dealer dropdown:', error);
        }
      });
  }

  loadDealerWiseReport(): void {
    this.isLoading = true;

    // Dealers always use their own code, admins use the form value
    const dealerCode = this.isDealer
      ? this.loggedInDealerCode
      : this.filterForm.get('dealerCode')?.value;

    const fromDate = this.parseDate(this.filterForm.get('fromDate')?.value);
    const toDate = this.parseDate(this.filterForm.get('toDate')?.value);

    this.reportService.getDealerWiseJobReport(dealerCode, fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DealerWiseJobReportSummary[]) => {
          this.dealerWiseData = response;
          this.isDealerWiseView = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dealer wise report:', error);
          this.isLoading = false;
        }
      });
  }

  loadSummaryStats(): void {
    const dealerCode = this.isDealer
      ? this.loggedInDealerCode
      : this.filterForm.get('dealerCode')?.value;

    if (!dealerCode) return;

    const fromDate = this.parseDate(this.filterForm.get('fromDate')?.value);
    const toDate = this.parseDate(this.filterForm.get('toDate')?.value);

    this.reportService.getJobReportSummaryStats(dealerCode, fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JobReportSummaryStats) => {
          this.summaryStats = response;
        },
        error: (error) => {
          console.error('Error loading summary stats:', error);
        }
      });
  }

  private handleReportResponse(response: JobReportPagedResponse): void {
    this.reportData = response.data;
    this.totalRecords = response.totalRecords;
    this.pageIndex = response.pageIndex;
    this.pageSize = response.pageSize;
    this.totalSpares = response.totalSpares;
    this.totalAcsr = response.totalAcsr;
    this.totalOil = response.totalOil;
    this.totalLabour = response.totalLabour;
    this.totalOutsideWork = response.totalOutsideWork;
    this.totalTaxable = response.totalTaxable;
    this.totalSGST = response.totalSGST;
    this.totalCGST = response.totalCGST;
    this.grandTotal = response.grandTotal;
  }

  // ==================== FILTERING & SEARCH ====================

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset();
    this.initializeFormWithDefaultDates();

    // Re-lock dealer field after reset if dealer user
    if (this.isDealer) {
      this.filterForm.get('dealerCode')?.setValue(this.loggedInDealerCode);
      this.filterForm.get('dealerCode')?.disable();
    }

    this.pageIndex = 1;
    this.loadReport();
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReport();
  }

  // ==================== SORTING ====================

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  private sortData(): void {
    this.reportData.sort((a, b) => {
      const aValue = (a as any)[this.sortColumn];
      const bValue = (b as any)[this.sortColumn];
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // ==================== VIEW MODES ====================

  toggleDealerWiseView(): void {
    this.isDealerWiseView = !this.isDealerWiseView;
    if (this.isDealerWiseView) {
      this.loadDealerWiseReport();
    }
  }

  expandDealer(dealerCode: string): void {
    this.expandedDealerCode = this.expandedDealerCode === dealerCode ? null : dealerCode;
  }

  getDealerJobs(dealerCode: string): JobReportViewModel[] {
    const dealer = this.dealerWiseData.find(d => d.dealerCode === dealerCode);
    return dealer ? dealer.jobDetails : [];
  }

  // ==================== EXPORT ====================

  exportToExcel(): void {
    // Dealers always export their own data; admins use the form value
    const dealerCode = this.isDealer
      ? this.loggedInDealerCode
      : this.filterForm.get('dealerCode')?.value;

    if (!dealerCode) {
      console.error('Please select a dealer');
      return;
    }

    const fromDate = this.parseDate(this.filterForm.get('fromDate')?.value);
    const toDate = this.parseDate(this.filterForm.get('toDate')?.value);

    this.reportService.exportJobCardReport(dealerCode, fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.generateExcel(data);
        },
        error: (error) => {
          console.error('Error exporting report:', error);
        }
      });
  }

  private generateExcel(data: JobReportViewModel[]): void {
    const headers = [
      'Sr.No', 'Invoice No.', 'Invoice Date', 'Job No.', 'Party Name',
      'Party Mobile No.', 'Reg No.', 'Mechanic Name', 'Invoice Type',
      'Invoice Mode', 'Spares Amount', 'ACSR Amount', 'Oil Amount',
      'Labour Amount', 'Outside Work Amount', 'Taxable Amount',
      'SGST Amount', 'CGST Amount'
    ];

    const csvData = [
      headers,
      ...data.map(row => [
        row.srNo, row.invoiceNo,
        new Date(row.invoiceDate).toLocaleDateString(),
        row.jobNo, row.partyName, row.partyMobileNo, row.regNo,
        row.mechanicName, row.invoiceType, row.invoiceMode,
        row.sparesAmount, row.acsrAmount, row.oilAmount,
        row.labourAmount, row.outsideWorkAmount, row.taxableAmount,
        row.sgstAmount, row.cgstAmount
      ]),
      [
        '', 'TOTAL', '', '', '', '', '', '', '', '',
        this.totalSpares, this.totalAcsr, this.totalOil, this.totalLabour,
        this.totalOutsideWork, this.totalTaxable, this.totalSGST, this.totalCGST
      ]
    ];

    const csvString = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-report-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ==================== PAGINATION ====================

  firstPage(): void {
    if (this.pageIndex > 1) { this.pageIndex = 1; this.loadReport(); }
  }

  previousPage(): void {
    if (this.pageIndex > 1) { this.pageIndex--; this.loadReport(); }
  }

  nextPage(): void {
    if (this.pageIndex * this.pageSize < this.totalRecords) {
      this.pageIndex++; this.loadReport();
    }
  }

  lastPage(): void {
    const totalPages = Math.ceil(this.totalRecords / this.pageSize);
    if (this.pageIndex < totalPages) { this.pageIndex = totalPages; this.loadReport(); }
  }

  // ==================== UTILITY ====================

  private buildFilterModel(): JobReportFilterModel {
    // getRawValue() includes disabled controls (dealerCode when locked)
    const raw = this.filterForm.getRawValue();
    return {
      dealerCode: raw.dealerCode,
      fromDate: this.parseDate(raw.fromDate),
      toDate: this.parseDate(raw.toDate),
      serviceLocation: raw.serviceLocation,
      jobNo: raw.jobNo,
      partyName: raw.partyName,
      chassisNo: raw.chassisNo,
      regNo: raw.regNo,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
  }

  private parseDate(dateString: string): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }
}