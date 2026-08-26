import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import {
  JobReportViewModel,
  JobReportPagedResponse,
  JobReportFilterModel,
  DealerDropdownItem
} from '../../../ViewModels/models/job-report.model';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

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

  // ── Chassis No. autosuggest ──
  chassisList: string[] = [];
  filteredChassisList: string[] = [];
  showChassisDropdown = false;
  private static readonly MAX_CHASSIS_SUGGESTIONS = 20;

  private destroy$ = new Subject<void>();

  // Debounce window for auto-search — long enough that a normal typist
  // doesn't fire a request per keystroke, short enough to feel instant.
  private static readonly AUTO_SEARCH_DEBOUNCE_MS = 500;
  grandTotal: any;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
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
    // Every user gets the full dealer dropdown, defaulting to "All Dealers";
    // the report returns every dealer's data unless one is explicitly picked.
    this.initializeFormWithDefaultDates();
    this.loadDealerDropdown();
    this.loadChassisList();
    this.loadReport();

    // AUTO-SEARCH — any change to any filter (Dealer dropdown, From/To Date,
    // Service Location, Job No, Party Name, Chassis No, Reg No) automatically
    // re-runs the search after a short pause. The explicit Search button
    // still works too, for anyone who doesn't want to wait for the debounce.
    this.filterForm.valueChanges
      .pipe(
        debounceTime(JobReportComponent.AUTO_SEARCH_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // From/To Date remain required — don't auto-fire while either has
        // been cleared out mid-edit (e.g. user is retyping the date).
        if (this.filterForm.invalid) return;
        this.pageIndex = 1;
        this.loadReport();
      });
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
    }, { emitEvent: false }); // initial setup — not a user-driven change
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

  // Loads every known chassis number once, up front — same source
  // (ReportService.getChassisList()) used by Estimate List's own chassis
  // autosuggest — then filtered client-side as the user types.
  private loadChassisList(): void {
    this.reportService.getChassisList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => this.chassisList = list,
        error: (err) => console.error('Failed to fetch chassis list', err)
      });
  }

  private handleReportResponse(response: JobReportPagedResponse): void {
    this.reportData = response.data;
    this.totalRecords = response.totalRecords;
    this.pageIndex = response.pageIndex;
    this.pageSize = response.pageSize;
  }

  onSearch(): void {
    // Explicit "search right now" action — bypasses the debounce for anyone
    // who clicks Search directly instead of waiting for auto-search to fire.
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '',
      fromDate: '',
      toDate: '',
      serviceLocation: '',
      jobNo: null,
      partyName: '',
      chassisNo: '',
      regNo: ''
    }, { emitEvent: false });

    this.initializeFormWithDefaultDates();
    this.showChassisDropdown = false;

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
    if (!item.jobInDate) return null;

    const start = new Date(item.jobInDate);
    if (isNaN(start.getTime())) return null;
    start.setHours(0, 0, 0, 0);

    let end: Date;
    if (item.jobStatus === 'Closed' && item.closedDate) {
      end = new Date(item.closedDate);
      if (isNaN(end.getTime())) return null;
    } else {
      end = new Date(); // "today" — this is what makes the count keep climbing
    }
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  exportToExcel(): void {
    const dealerCode = this.filterForm.get('dealerCode')?.value || undefined;

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
    const jobEndDate = (row: JobReportViewModel) =>
    row.jobStatus === 'Closed' && row.closedDate ? fmt(row.closedDate) : '';

    const csvData = [
      headers,
      ...data.map(row => [
        row.srNo, row.dealerCode, row.dealerName, row.dealerLocation, row.city, row.state,
        this.getDaysCount(row) ?? '', fmt(row.jobInDate), jobEndDate(row), row.jobStatus,
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

  // ═══════════════════════════════════════════════════════════════════
  // CHASSIS NO. AUTOSUGGEST
  // ═══════════════════════════════════════════════════════════════════

  onChassisInput(): void {
    this.updateChassisSuggestions();
  }

  onChassisFocus(): void {
    this.updateChassisSuggestions();
  }

  onChassisBlur(): void {
    // Delay so a click on a suggestion (mousedown, below) registers before
    // the dropdown is hidden by the input's blur.
    setTimeout(() => {
      this.showChassisDropdown = false;
    }, 150);
  }

  selectChassisSuggestion(chassis: string): void {
    // patchValue (not setValue) triggers the form's normal valueChanges,
    // so picking a suggestion auto-runs the search exactly like typing does.
    this.filterForm.patchValue({ chassisNo: chassis });
    this.showChassisDropdown = false;
  }

  private updateChassisSuggestions(): void {
    const text = (this.filterForm.get('chassisNo')?.value ?? '').toString().trim().toUpperCase();

    const source = text
      ? this.chassisList.filter(c => c.toUpperCase().includes(text))
      : this.chassisList;

    this.filteredChassisList = source.slice(0, JobReportComponent.MAX_CHASSIS_SUGGESTIONS);
    this.showChassisDropdown = true;
  }

    getJobEndDate(item: JobReportViewModel): string {
    if (item.jobStatus === 'Closed' && item.closedDate) {
      return this.formatDate(item.closedDate);
    }
    return '-'; // still open — there is no actual end date yet
  }
}