import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import {
  JobReportViewModel,
  JobReportPagedResponse,
  JobReportFilterModel,
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

  filterForm!: FormGroup;
  reportData: JobReportViewModel[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer: boolean = false;
  loggedInDealerCode: string = '';

  pageIndex: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  pageSizeOptions: number[] = [100];

  isLoading: boolean = false;
  sortColumn: string = 'jobInDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  displayColumns: string[] = [
    'srNo', 'dealerCode', 'dealerName', 'dealerLocation', 'city', 'state',
    'daysCount', 'jobInDate', 'estimatedDeliveryDate', 'jobStatus',
    'jobType', 'serviceHead', 'serviceType', 'kms',
    'partyName', 'partyMobileNo', 'chassisNo', 'regNo', 'motorNo',
    'batteryNo', 'chargerNo', 'customerVoice', 'customerCode',
    'observation', 'supervisorComment', 'supervisorName', 'mechanicName',
    'jobCreationSource', 'jobNo', 'saleDate'
  ];

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
      serviceLocation: [''],
      jobNo: [null],
      partyName: [''],
      chassisNo: [''],
      regNo: ['']
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
    }

    this.initializeFormWithDefaultDates();
    this.loadDealerDropdown();
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

  private handleReportResponse(response: JobReportPagedResponse): void {
    this.reportData = response.data;
    this.totalRecords = response.totalRecords;
    this.pageIndex = response.pageIndex;
    this.pageSize = response.pageSize;
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

  // Days = Job End Date − Job Start Date. Returns null if either date is
  // missing (rendered as '-' in the template).
  getDaysCount(item: JobReportViewModel): number | null {
    if (!item.jobInDate || !item.estimatedDeliveryDate) return null;

    const start = new Date(item.jobInDate);
    const end = new Date(item.estimatedDeliveryDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  exportToExcel(): void {
    const dealerCode = this.isDealer
      ? this.loggedInDealerCode
      : (this.filterForm.get('dealerCode')?.value || undefined);

    const fromDate = this.parseDate(this.filterForm.get('fromDate')?.value);
    const toDate = this.parseDate(this.filterForm.get('toDate')?.value);

    this.reportService.exportJobCardReport(dealerCode, fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            console.error('No data available to export for the current filters.');
            return;
          }
          this.generateExcel(data);
        },
        error: (error) => {
          console.error('Error exporting report:', error);
        }
      });
  }

  private generateExcel(data: JobReportViewModel[]): void {
    const headers = [
      'Sr.No', 'Dealer Code', 'Dealer Name', 'Dealer Location', 'City', 'State',
      'Days', 'Job Start Date', 'Job End Date', 'Job Status',
      'Job Type', 'Service Head', 'Service Type', 'Kms',
      'Customer Name', 'Customer Mobile No.', 'Chassis No.', 'Registration No.',
      'Motor No.', 'Battery No.', 'Charger No.', 'Customer Voice', 'Customer Code',
      'Observation', 'Supervisor Comment', 'Supervisor Name', 'Technician Name',
      'Job Creation Source', 'Job No.', 'Sale Date'
    ];

    const fmt = (d: any) => d ? new Date(d).toLocaleDateString() : '';

    const csvData = [
      headers,
      ...data.map(row => [
        row.srNo, row.dealerCode, row.dealerName, row.dealerLocation, row.city, row.state,
        this.getDaysCount(row) ?? '', fmt(row.jobInDate), fmt(row.estimatedDeliveryDate), row.jobStatus,
        row.jobType, row.serviceHead, row.serviceType, row.kms,
        row.partyName, row.partyMobileNo, row.chassisNo, row.regNo,
        row.motorNo, row.batteryNo, row.chargerNo, row.customerVoice, row.customerCode,
        row.observation, row.supervisorComment, row.supervisorName, row.mechanicName,
        row.jobCreationSource, row.jobNo, fmt(row.saleDate)
      ])
    ];

    const csvString = csvData
      .map(row => row.map(cell => `"${cell ?? ''}"`).join(','))
      .join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-report-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

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

  private buildFilterModel(): JobReportFilterModel {
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

  formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN');
  }
}