import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import {
  HistoricalMaterialTransferService,
  HistoricalMaterialTransferRow,
  HistoricalMaterialTransferItem,
  HistoricalMaterialTransferLabor
} from '../../../core/services/historical-material-transfer';

@Component({
  selector: 'app-historical-material-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historical-material-transfer.html',
  styleUrl: './historical-material-transfer.scss'
})
export class HistoricalMaterialTransfer implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  rows: HistoricalMaterialTransferRow[] = [];
  dealerList: DealerDropdownItem[] = [];
  Math = Math;

  isDealer = false;
  loggedInDealerCode = '';

  pageIndex = 1;
  pageSize = 100;
  totalRecords = 0;

  isLoading = false;
  isExporting = false;
  errorMessage = '';

  expandedId: number | null = null;
  detailItems: Record<number, HistoricalMaterialTransferItem[]> = {};
  detailLabors: Record<number, HistoricalMaterialTransferLabor[]> = {};
  detailLoading: Record<number, boolean> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService,
    private api: HistoricalMaterialTransferService
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
            || 'Failed to load historical material transfers.';
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

  trackById(_: number, r: HistoricalMaterialTransferRow): number {
    return r.id;
  }

  toggleDetail(r: HistoricalMaterialTransferRow): void {
    if (this.expandedId === r.id) {
      this.expandedId = null;
      return;
    }
    this.expandedId = r.id;
    if (this.detailItems[r.id]) return;

    this.detailLoading[r.id] = true;

    this.api.details([r.id])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.detailItems[r.id] = (res?.items ?? []).filter(item => item.materialTransferId === r.id);
          const itemIds = new Set(this.detailItems[r.id].map(i => i.id));
          this.detailLabors[r.id] = (res?.labors ?? []).filter(lbr => itemIds.has(lbr.materialTransferItemId));
          this.detailLoading[r.id] = false;
        },
        error: () => {
          this.detailItems[r.id] = [];
          this.detailLabors[r.id] = [];
          this.detailLoading[r.id] = false;
        }
      });
  }

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
            'Doc Date': row.docDate ? new Date(row.docDate).toLocaleDateString('en-GB') : '',
            'Doc No': row.docNo ?? '',
            'Job No': row.jobNo ?? '',
            'Doc Type': row.docType ?? '',
            'Location': row.location ?? '',
            'Loc Code': row.locCode ?? '',
            'Technician': row.technicianName ?? '',
            'Action': row.action ?? '',
            'Item Name': row.itemName ?? '',
            'Item Description': row.itemDescription ?? '',
            'Item Type': row.itemType ?? '',
            'Qty': row.qty ?? 0,
            'Rate': row.rate ?? 0,
            'Discount': row.discount ?? 0,
            'MRP': row.mrp ?? 0,
            'Item SGST': row.itemSgstAmount ?? 0,
            'Item CGST': row.itemCgstAmount ?? 0,
            'Item IGST': row.itemIgstAmount ?? 0,
            'Labor Name': row.lbrName ?? '',
            'Labor Description': row.lbrDescription ?? '',
            'Labor Rate': row.lbrRate ?? 0,
            'Labor SGST': row.lbrSgstAmount ?? 0,
            'Labor CGST': row.lbrCgstAmount ?? 0,
            'Labor IGST': row.lbrIgstAmount ?? 0
          }));

          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelRows);
          const workbook: XLSX.WorkBook = {
            Sheets: { 'Historical Material Transfer': worksheet },
            SheetNames: ['Historical Material Transfer']
          };

          const fileName = `Historical_Material_Transfer_${v.dealerCode || 'All'}_${this.toDateInputString(new Date())}.xlsx`;
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

  copiedRowId: number | null = null;

  copyActionText(text: string | null | undefined, rowId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }

    this.copiedRowId = rowId;
    setTimeout(() => {
      if (this.copiedRowId === rowId) {
        this.copiedRowId = null;
      }
    }, 1500);
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}