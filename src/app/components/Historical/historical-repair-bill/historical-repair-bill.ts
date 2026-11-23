import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import {
  HistoricalRepairBillService,
  HistoricalRepairBillRow,
  HistoricalRepairBillItem
} from '../../../core/services/historical-repair-bill';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-historical-repair-bill',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historical-repair-bill.html',
  styleUrl: './historical-repair-bill.scss'
})
export class HistoricalRepairBill implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  rows: HistoricalRepairBillRow[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer = false;
  loggedInDealerCode = '';

  pageIndex = 1;
  pageSize = 100;
  totalRecords = 0;

  isLoading = false;
  errorMessage = '';

  expandedId: number | null = null;
  detailItems: Record<number, HistoricalRepairBillItem[]> = {};
  detailLoading: Record<number, boolean> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService,
    private api: HistoricalRepairBillService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [this.getDefaultFromDate()],
      toDate: [this.toDateInputString(new Date())]
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

  private getDefaultFromDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return this.toDateInputString(d);
  }

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

  dealerName(code: string | null | undefined): string {
    if (!code) return '';
    return this.dealerList.find(d => d.dealerCode === code)?.dealerName || code;
  }

  loadReport(): void {
    const v = this.filterForm.getRawValue();

    if (v.fromDate && v.toDate && v.fromDate > v.toDate) {
      this.errorMessage = 'From Date cannot be after To Date.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.expandedId = null;

    this.api.list({
      fromDate: v.fromDate,
      toDate: v.toDate,
      dealerCode: v.dealerCode,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.rows = res.data ?? [];
          this.totalRecords = res.totalRecords ?? 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.rows = [];
          this.totalRecords = 0;
          this.isLoading = false;
          this.errorMessage =
            (typeof err?.error === 'string' ? err.error : err?.error?.message)
            || 'Failed to load historical repair bills.';
        }
      });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.patchValue({
      dealerCode: this.isDealer ? this.loggedInDealerCode : '',
      fromDate: this.getDefaultFromDate(),
      toDate: this.toDateInputString(new Date())
    });
    this.pageIndex = 1;
    this.loadReport();
  }

  trackById(_: number, r: HistoricalRepairBillRow): number {
    return r.id;
  }

  // toggleDetail(r: HistoricalRepairBillRow): void {
  //   if (this.expandedId === r.id) {
  //     this.expandedId = null;
  //     return;
  //   }
  //   this.expandedId = r.id;
  //   if (this.detailItems[r.id]) return;

  //   this.detailLoading[r.id] = true;

  //   this.api.items([r.id])
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (map) => {
  //         this.detailItems[r.id] = map[String(r.id)] ?? [];
  //         this.detailLoading[r.id] = false;
  //       },
  //       error: () => {
  //         this.detailItems[r.id] = [];
  //         this.detailLoading[r.id] = false;
  //       }
  //     });
  // }

  toggleDetail(r: HistoricalRepairBillRow): void {
    if (this.expandedId === r.id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = r.id;
    if (this.detailItems[r.id]) return;

    this.detailLoading[r.id] = true;

    this.api.items([r.id])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allItems) => {
          // Filter items specifically for this bill Id
          this.detailItems[r.id] = (allItems ?? []).filter(item => item.repairBillId === r.id);
          this.detailLoading[r.id] = false;
        },
        error: () => {
          this.detailItems[r.id] = [];
          this.detailLoading[r.id] = false;
        }
      });
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

  isExporting = false;

  exportToExcel(): void {
    const v = this.filterForm.getRawValue();

    if (v.fromDate && v.toDate && v.fromDate > v.toDate) {
      this.errorMessage = 'From Date cannot be after To Date.';
      return;
    }

    this.isExporting = true;
    this.errorMessage = '';

    this.api.exportExcel({
      fromDate: v.fromDate,
      toDate: v.toDate,
      dealerCode: v.dealerCode
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isExporting = false;
          if (!data || data.length === 0) {
            this.errorMessage = 'No data available to export.';
            return;
          }

          const excelRows = data.map((row, index) => ({
            'S.No': index + 1,
            'Dealer Code': row.dealerCode ?? '',
            'Dealer Name': row.dealerName ?? '',
            'Job No': row.jobNo ?? '',
            'Invoice Date': row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-GB') : '',
            'Invoice No': row.invoiceNo ?? '',
            'Location': row.location ?? '',
            'Customer Name': row.partyName ?? '',
            'Bill Type': row.billType ?? '',
            'Cash Type': row.cashType ?? '',
            'Reg No': row.regNo ?? '',
            'Chassis No': row.chassisNo ?? '',
            'Item Code': row.itemCode ?? '',
            'Description': row.itemDesc ?? '',
            'Item Type': row.itemType ?? '',
            'Issue Type': row.issueType ?? '',
            'Qty': row.qty ?? 0,
            'Rate': row.rate ?? 0,
            'SGST %': row.sgstPer ?? 0,
            'SGST Amount': row.sgstAmount ?? 0,
            'CGST %': row.cgstPer ?? 0,
            'CGST Amount': row.cgstAmount ?? 0,
            'IGST %': row.igstPer ?? 0,
            'IGST Amount': row.igstAmount ?? 0,
            'Total Amount': row.totAmnt ?? 0
          }));

          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelRows);
          const workbook: XLSX.WorkBook = {
            Sheets: { 'Historical Repair Bill': worksheet },
            SheetNames: ['Historical Repair Bill']
          };

          const fileName = `Historical_Repair_Bill_${v.dealerCode || 'All'}_${this.toDateInputString(new Date())}.xlsx`;
          XLSX.writeFile(workbook, fileName);
        },
        error: (err) => {
          this.isExporting = false;
          this.errorMessage =
            (typeof err?.error === 'string' ? err.error : err?.error?.message)
            || 'Failed to export Excel file.';
        }
      });
  }
}