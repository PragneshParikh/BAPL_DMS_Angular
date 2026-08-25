import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// TODO: adjust this relative path to wherever ReportService actually lives
// in your project (it's the same service used by every other report screen).
import { ReportService } from '../../../core/services/report.service';

import {
  WarrantyRegisterFilterModel,
  WarrantyRegisterViewModel,
  DealerDropdownItemLite
} from '../../../ViewModels/models/WarrantyRegisterViewModel';

type StatusOption = '' | 'Pending' | 'Approved' | 'Rejected';

@Component({
  selector: 'app-warranty-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-register.html',
  styleUrl: './warranty-register.scss',
})
export class WarrantyRegister implements OnInit {

  filter: WarrantyRegisterFilterModel = this.emptyFilter();

  dealers: DealerDropdownItemLite[] = [];

  rows: WarrantyRegisterViewModel[] = [];
  totalRecords = 0;

  loading = false;
  exporting = false;
  errorMessage: string | null = null;

  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly claimStatusOptions: StatusOption[] = ['', 'Pending', 'Approved', 'Rejected'];
  readonly orderInvoiceStatusOptions: StatusOption[] = ['', 'Pending', 'Approved'];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadDealers();
    this.loadReport();
  }

  private emptyFilter(): WarrantyRegisterFilterModel {
    return {
      dealerCode: null,
      locationCode: null,
      fromDate: null,
      toDate: null,
      chassisNo: null,
      claimNo: null,
      jobNo: null,
      warrantyClaimStatus: null,
      warrantyOrderStatus: null,
      warrantyInvoiceStatus: null,
      search: null,
      pageIndex: 1,
      pageSize: 20
    };
  }

  private loadDealers(): void {
    this.reportService.getDealerList().subscribe({
      next: (list) => this.dealers = list ?? [],
      error: () => this.dealers = []
    });
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = null;

    this.reportService.getWarrantyRegisterReport(this.filter).subscribe({
      next: (res) => {
        this.rows = res.data ?? [];
        this.totalRecords = res.totalRecords ?? 0;
        this.filter.pageIndex = res.pageIndex ?? this.filter.pageIndex;
        this.filter.pageSize = res.pageSize ?? this.filter.pageSize;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load the warranty register report.';
        this.rows = [];
        this.totalRecords = 0;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filter.pageIndex = 1;
    this.loadReport();
  }

  resetFilters(): void {
    this.filter = this.emptyFilter();
    this.loadReport();
  }

  changePage(delta: number): void {
    const nextPage = this.filter.pageIndex + delta;
    if (nextPage < 1 || nextPage > this.totalPages) return;
    this.filter.pageIndex = nextPage;
    this.loadReport();
  }

  changePageSize(size: number): void {
    this.filter.pageSize = size;
    this.filter.pageIndex = 1;
    this.loadReport();
  }

  get totalPages(): number {
    return this.filter.pageSize > 0
      ? Math.max(1, Math.ceil(this.totalRecords / this.filter.pageSize))
      : 1;
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'pending': return 'badge badge-pending';
      default: return 'badge badge-muted';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Used for Qty — plain number, no currency symbol/decimals forced.
  formatNumber(value?: number): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('en-IN');
  }

  // Used for Rate/MRP/tax amounts — always 2 decimal places.
  formatCurrency(value?: number): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatPercent(value?: number): string {
    if (value === null || value === undefined) return '—';
    return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
  }

  exportCsv(): void {
    this.exporting = true;
    this.errorMessage = null;

    this.reportService.exportWarrantyRegisterReport(this.filter).subscribe({
      next: (rows) => {
        this.downloadCsv(rows ?? []);
        this.exporting = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to export the warranty register report.';
        this.exporting = false;
      }
    });
  }

  private downloadCsv(rows: WarrantyRegisterViewModel[]): void {
    if (!rows.length) return;

    const columns: { key: keyof WarrantyRegisterViewModel; label: string }[] = [
      { key: 'srNo', label: 'Sr No' },
      { key: 'claimType', label: 'Claim Type' },
      { key: 'jobNo', label: 'Job No' },
      { key: 'jobDate', label: 'Job Date' },
      { key: 'rbillNo', label: 'Repair Bill No' },
      { key: 'rbillDate', label: 'Repair Bill Date' },
      { key: 'itemName', label: 'Item' },
      { key: 'description', label: 'Description' },
      { key: 'partName', label: 'Part Name' },
      { key: 'partDescription', label: 'Part Description' },
      { key: 'modelName', label: 'Model Name' },
      { key: 'modelDescription', label: 'Model Description' },
      { key: 'labourName', label: 'Labour Name' },
      { key: 'labourDescription', label: 'Labour Description' },
      { key: 'qty', label: 'Qty' },
      { key: 'rate', label: 'Rate' },
      { key: 'mrp', label: 'MRP' },
      { key: 'taxableAmount', label: 'Taxable Amount' },
      { key: 'cgstPercent', label: 'CGST %' },
      { key: 'cgstAmount', label: 'CGST Amount' },
      { key: 'sgstPercent', label: 'SGST %' },
      { key: 'sgstAmount', label: 'SGST Amount' },
      { key: 'igstPercent', label: 'IGST %' },
      { key: 'igstAmount', label: 'IGST Amount' },
      { key: 'totalGstAmount', label: 'Total GST Amount' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'warrantyClaimNo', label: 'Claim No' },
      { key: 'warrantyClaimDate', label: 'Claim Date' },
      { key: 'chasisNo', label: 'Chassis No' },
      { key: 'partyName', label: 'Party' },
      { key: 'warrantyClaimStatus', label: 'Claim Status' },
      { key: 'approverEngineerName', label: 'Approver Engineer' },
      { key: 'claimAcceptRejectReason', label: 'Accept/Reject Reason' },
      { key: 'prnNo', label: 'PRN No' },
      { key: 'warrantyOrderStatus', label: 'Order Status' },
      { key: 'warrantyOrderNo', label: 'Order No' },
      { key: 'warrantyOrderDate', label: 'Order Date' },
      { key: 'warrantyInvoiceStatus', label: 'Invoice Status' },
      { key: 'warrantyInvoiceNo', label: 'Invoice No' },
      { key: 'warrantyInvoiceDate', label: 'Invoice Date' },
      { key: 'packingSlipNo', label: 'Packing Slip No' },
      { key: 'packingSlipDate', label: 'Packing Slip Date' },
      { key: 'dispatchNo', label: 'Dispatch No' },
      { key: 'dispatchDate', label: 'Dispatch Date' },
      { key: 'dispatchReceivedStatus', label: 'Dispatch Received Status' },
      { key: 'dispatchReceivedDate', label: 'Dispatch Received Date' },
      { key: 'dispatchReceivedRemarks', label: 'Dispatch Received Remarks' },
      { key: 'verificationDate', label: 'Verification Date' },
      { key: 'packingConcern', label: 'Packing Concern' },
      { key: 'packingConcernType', label: 'Packing Concern Type' },
      { key: 'packingConcernRemarks', label: 'Packing Concern Remarks' },
      { key: 'materialConcern', label: 'Material Concern' },
      { key: 'materialConcernType', label: 'Material Concern Type' },
      { key: 'materialConcernRemarks', label: 'Material Concern Remarks' },
    ];

    const escapeCell = (value: unknown): string => {
      const str = value === null || value === undefined ? '' : String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const header = columns.map(c => escapeCell(c.label)).join(',');
    const lines = rows.map(row => columns.map(c => escapeCell(row[c.key])).join(','));
    const csvContent = [header, ...lines].join('\r\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `warranty-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}