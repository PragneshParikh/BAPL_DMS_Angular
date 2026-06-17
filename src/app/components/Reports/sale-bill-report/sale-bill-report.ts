import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs/operators';

import { ReportService } from '../../../core/services/report.service';

import {
  VehicleSaleBillReportViewModel,
  VehicleSaleBillReportFilterModel,
  VehicleSaleBillReportPagedResponse
} from '../../../ViewModels/models/sale-bill-report.model';

interface DropdownItem {
  code: string;
  name: string;
}

@Component({
  selector: 'app-sale-bill-report',
  standalone: true,
  templateUrl: './sale-bill-report.html',
  styleUrl: './sale-bill-report.scss',
  imports: [
    CommonModule,            // *ngIf, *ngFor, number & date pipes
    ReactiveFormsModule,     // [formGroup], formControlName
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,     // date adapter the datepickers need
    MatTableModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSnackBarModule
  ]
})
export class SaleBillReportComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  filterForm!: FormGroup;

  // ─── Data ──────────────────────────────────────────────
  data: VehicleSaleBillReportViewModel[] = [];

  // ─── Server-side paging (backend PageIndex is 1-based) ──
  pageIndex = 1;
  pageSize = 20;
  totalRecords = 0;
  pageSizeOptions = [10, 20, 50, 100];

  // ─── Aggregate totals (over the full filtered set) ──────
  totalVehicles = 0;
  totalSaleAmount = 0;
  totalGstAmount = 0;
  totalSubsidyAmount = 0;
  totalNetAmount = 0;

  // ─── UI state ───────────────────────────────────────────
  isLoading = false;
  isExporting = false;

  // ─── Dropdown sources ───────────────────────────────────
  dealers: DropdownItem[] = [];
  models: DropdownItem[] = [];
  saleTypes: string[] = [];
  statuses: string[] = [];

  // ─── 43 report columns (+ status) in Excel order ────────
  displayedColumns: string[] = [
    'srNo', 'billNo', 'billDate', 'bookingId', 'partyName',
    'contactPerson', 'partyAddress', 'location', 'partyMobile',
    'partyEmail', 'executiveName', 'gstnNo', 'itemModel',
    'description', 'oemModelName', 'hsnSacCode', 'salesType',
    'itemRate', 'insuAmnt', 'regnAmnt', 'acsryAmnt', 'finAmnt',
    'processingFee', 'hypAmnt', 'otherCharge', 'smartCardAmnt',
    'postGstDiscAmnt', 'preGstDiscAmnt', 'sgstper', 'sgstamnt',
    'cgstper', 'cgstamnt', 'igstper', 'igstamnt', 'subsidyAmnt',
    'stateSubsidyAmnt', 'numPlateAmnt', 'handlingCharges',
    'netAmnt', 'regNo', 'chasisNo', 'color', 'financerName', 'status'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.wireSearchDebounce();
    this.loadDropdowns();
    this.loadReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ────────────────────────────────────────────────────────
  //  Setup
  // ────────────────────────────────────────────────────────
  private buildForm(): void {
    this.filterForm = this.fb.group({
      dealerCode: [null],
      itemCode: [null],
      saleType: [null],
      status: [null],
      fromDate: [null],
      toDate: [null],
      location: [null],
      search: [null]
    });
  }

  private wireSearchDebounce(): void {
    this.filterForm.get('search')!.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.resetToFirstPageAndLoad());
  }

  private loadDropdowns(): void {
    this.reportService.getDealerList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => this.dealers = (rows || []).map(r => ({
          code: r.dealerCode, name: r.dealerName
        })),
        error: () => this.notify('Could not load dealer list')
      });

    this.reportService.getModelList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => this.models = (rows || []).map(r => ({
          code: r.modelCode, name: r.modelName
        })),
        error: () => { /* non-blocking */ }
      });

    this.reportService.getSaleTypeDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => this.saleTypes = rows || [],
        error: () => { /* non-blocking */ }
      });

    this.reportService.getSaleBillStatusDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => this.statuses = rows || [],
        error: () => { /* non-blocking */ }
      });
  }

  // ────────────────────────────────────────────────────────
  //  Load + paging
  // ────────────────────────────────────────────────────────
  private buildFilter(): VehicleSaleBillReportFilterModel {
    const f = this.filterForm.value;
    return {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      dealerCode: f.dealerCode || null,
      itemCode: f.itemCode || null,
      saleType: f.saleType || null,
      status: f.status || null,
      fromDate: this.toApiDate(f.fromDate),
      toDate: this.toApiDate(f.toDate),
      location: f.location ? String(f.location).trim() : null,
      search: f.search ? String(f.search).trim() : null
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.reportService.getVehicleSaleBillReport(this.buildFilter())
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: VehicleSaleBillReportPagedResponse) => {
          this.data = res?.data ?? [];
          this.totalRecords = res?.totalRecords ?? 0;
          this.totalVehicles = res?.totalVehicles ?? 0;
          this.totalSaleAmount = res?.totalSaleAmount ?? 0;
          this.totalGstAmount = res?.totalGstAmount ?? 0;
          this.totalSubsidyAmount = res?.totalSubsidyAmount ?? 0;
          this.totalNetAmount = res?.totalNetAmount ?? 0;
        },
        error: err => {
          this.data = [];
          this.totalRecords = 0;
          this.notify(err?.error?.message || 'Could not load the sale bill report.');
        }
      });
  }

  onApply(): void {
    this.resetToFirstPageAndLoad();
  }

  onReset(): void {
    this.filterForm.reset();
    this.pageSize = 20;
    this.resetToFirstPageAndLoad();
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex + 1; // Material is 0-based, backend is 1-based
    this.pageSize = e.pageSize;
    this.loadReport();
  }

  private resetToFirstPageAndLoad(): void {
    this.pageIndex = 1;
    this.paginator?.firstPage();
    this.loadReport();
  }

  // ────────────────────────────────────────────────────────
  //  Export — pulls the full filtered set, writes CSV
  // ────────────────────────────────────────────────────────
  onExport(): void {
    const f = this.filterForm.value;
    this.isExporting = true;
    this.reportService.exportVehicleSaleBillReport(
      f.dealerCode || undefined,
      f.fromDate || undefined,
      f.toDate || undefined
    )
      .pipe(
        finalize(() => this.isExporting = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: rows => this.downloadCsv(rows || []),
        error: err => this.notify(err?.error?.message || 'Export failed.')
      });
  }

  private downloadCsv(rows: VehicleSaleBillReportViewModel[]): void {
    if (!rows.length) {
      this.notify('Nothing to export for the current filters.');
      return;
    }

    const headers = [
      'Sr No', 'Bill No', 'Bill Date', 'Booking Id', 'Party Name',
      'Contact Person', 'Party Address', 'Location', 'Party Mobile',
      'Party Email', 'Executive Name', 'GSTN No', 'Item Model',
      'Description', 'OEM Model Name', 'HSN/SAC Code', 'Sales Type',
      'Item Rate', 'Insu. Amnt', 'Regn. Amnt', 'Acsry Amnt', 'Fin. Amnt',
      'Processing Fee', 'Hyp Amnt', 'Other Charge', 'SmartCard Amnt',
      'PostGST Disc Amnt', 'PreGST Disc Amnt', 'SGST %', 'SGST Amnt',
      'CGST %', 'CGST Amnt', 'IGST %', 'IGST Amnt', 'Subsidy Amnt',
      'State Subsidy Amnt', 'NumPlate Amnt', 'Handling Charges',
      'Net Amnt', 'Reg No', 'Chassis No', 'Color', 'Financer Name', 'Status'
    ];

    const keys: (keyof VehicleSaleBillReportViewModel)[] = [
      'srNo', 'billNo', 'billDate', 'bookingId', 'partyName',
      'contactPerson', 'partyAddress', 'location', 'partyMobile',
      'partyEmail', 'executiveName', 'gstnNo', 'itemModel',
      'description', 'oemModelName', 'hsnSacCode', 'salesType',
      'itemRate', 'insuAmnt', 'regnAmnt', 'acsryAmnt', 'finAmnt',
      'processingFee', 'hypAmnt', 'otherCharge', 'smartCardAmnt',
      'postGstDiscAmnt', 'preGstDiscAmnt', 'sgstper', 'sgstamnt',
      'cgstper', 'cgstamnt', 'igstper', 'igstamnt', 'subsidyAmnt',
      'stateSubsidyAmnt', 'numPlateAmnt', 'handlingCharges',
      'netAmnt', 'regNo', 'chasisNo', 'color', 'financerName', 'status'
    ];

    const cell = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\r\n]/.test(s) ? `"${s}"` : s;
    };

    const csv = [
      headers.join(','),
      ...rows.map(r => keys.map(k => cell(r[k])).join(','))
    ].join('\r\n');

    // Prefix BOM so Excel reads UTF-8 correctly.
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sale-bill-report_${this.toApiDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────

  /** Local yyyy-MM-dd (avoids the UTC off-by-one from toISOString). */
  private toApiDate(d: Date | string | null): string | null {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000 });
  }

  trackByRow = (_: number, row: VehicleSaleBillReportViewModel): string =>
    `${row.billNo}|${row.chasisNo}|${row.srNo}`;
}