import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service'; // adjust to your actual path
import {
  ComparisonReportFilterModel,
  ComparisonReportRow
} from '../../../ViewModels/models/Comaprision-reportModel';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';

@Component({
  selector: 'app-comparison-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comparision-report.html',
  styleUrls: ['./comparision-report.scss']
})
export class ComparisonReportComponent implements OnInit {

  Math = Math;

  filterForm: FormGroup;

  isDealer = false;
  loggedInDealerCode = '';

  dealerList: DealerDropdownItem[] = [];

  reportData: ComparisonReportRow[] = [];

  totalRecords = 0;
  totalWithPerforma = 0;
  totalSaleBillCreated = 0;

  pageIndex = 1;
  pageSize = 20;
  totalPages = 1;

  isLoading = false;
  exporting = false;
  errorMessage = '';

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: [''],
      chassisNo: [''],
      customerName: [''],
      performaStatus: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadDealers();
    this.loadReport();
  }

  loadDealers(): void {
    this.reportService.getDealerDropdown().subscribe({
      next: (data) => (this.dealerList = data ?? []),
      error: () => (this.dealerList = [])
    });
  }

  private buildFilter(): ComparisonReportFilterModel {
    const fv = this.filterForm.value;

    return {
      dealerCode: fv.dealerCode || null,
      fromDate: fv.fromDate || null,
      toDate: fv.toDate || null,
      chassisNo: fv.chassisNo?.trim() || null,
      customerName: fv.customerName?.trim() || null,
      performaCreated:
        fv.performaStatus === 'yes' ? true :
        fv.performaStatus === 'no' ? false : null,
      search: fv.search?.trim() || null,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reportService.getComparisonReport(this.buildFilter()).subscribe({
      next: (res) => {
        this.reportData = res.data ?? [];
        this.totalRecords = res.totalRecords;
        this.totalWithPerforma = res.totalWithPerforma;
        this.totalSaleBillCreated = res.totalSaleBillCreated;
        this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load comparison report. Please try again.';
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
    this.filterForm.reset({
      dealerCode: '',
      fromDate: '',
      toDate: '',
      chassisNo: '',
      customerName: '',
      performaStatus: '',
      search: ''
    });
    this.pageIndex = 1;
    this.loadReport();
  }

  firstPage(): void {
    if (this.pageIndex !== 1) {
      this.pageIndex = 1;
      this.loadReport();
    }
  }

  previousPage(): void {
    if (this.pageIndex > 1) {
      this.pageIndex--;
      this.loadReport();
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages) {
      this.pageIndex++;
      this.loadReport();
    }
  }

  lastPage(): void {
    if (this.pageIndex !== this.totalPages) {
      this.pageIndex = this.totalPages;
      this.loadReport();
    }
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.reportData = [...this.reportData].sort((a: any, b: any) => {
      const valA = a[column];
      const valB = b[column];

      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  exportToExcel(): void {
    this.exporting = true;
    const filter = this.buildFilter();

    this.reportService.exportComparisonReport(filter).subscribe({
      next: (rows) => {
        this.downloadCsv(rows);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = 'Export failed. Please try again.';
        this.exporting = false;
      }
    });
  }

  private downloadCsv(rows: ComparisonReportRow[]): void {
    if (!rows || rows.length === 0) return;

    const headers = [
      'Sr No', 'Dealer Code', 'Dealer Name', 'Location', 'City', 'State',
      'Customer Name', 'Customer Mobile', 'Chassis No',
      'Performa Created', 'Performa Date',
      'Sale Bill Created', 'Sale Bill Date'
    ];

    const csvRows = rows.map(r => [
      r.srNo, r.dealerCode, r.dealerName, r.dealerLocation, r.city, r.state,
      r.customerName, r.customerMobile, r.chassisNo,
      r.isPerformaCreated ? 'Yes' : 'No',
      r.performaCreatedDate ? new Date(r.performaCreatedDate).toLocaleDateString() : '',
      r.isSaleBillCreated ? 'Yes' : 'No',
      r.saleBillCreatedDate ? new Date(r.saleBillCreatedDate).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ComparisonReport_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  }
}