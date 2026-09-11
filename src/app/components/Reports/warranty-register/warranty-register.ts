// src\app\components\Reports\warranty-register\warranty-register.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { StorageService } from '../../../core/services/storage';
import { MenuAccessService } from '../../../core/services/menu-access.service';

import {
  WarrantyRegisterFilterModel,
  WarrantyRegisterViewModel,
  DealerDropdownItemLite
} from '../../../ViewModels/models/WarrantyRegisterViewModel';

type StatusOption = '' | 'Pending' | 'Approved' | 'Rejected';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-warranty-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warranty-register.html',
  styleUrl: './warranty-register.scss',
})
export class WarrantyRegister implements OnInit {
  readonly SUBMENU_ID = 123;
  canDownload = false;

  Math = Math;

  filterForm: FormGroup;

  // Kept but unused in the template for now (matches the reference, which
  // comments this block out rather than deleting it) - the dealer dropdown
  // is always shown to everyone; the backend already enforces dealer
  // scoping server-side for non-admin logins regardless of what's selected
  // here, so this is safe to leave inactive.
  isDealer = false;
  loggedInDealerCode = '';

  dealerList: DealerDropdownItemLite[] = [];

  // ── Chassis typeahead ────────────────────────────────────────────────
  allChassisList: string[] = [];
  filteredChassisList: string[] = [];
  showChassisDropdown = false;
  private chassisBlurTimeout: any = null;

  reportData: WarrantyRegisterViewModel[] = [];
  totalRecords = 0;
  pageIndex = 1;
  pageSize = 20;

  isLoading = false;
  exporting = false;
  errorMessage: string | null = null;

  sortColumn: string | null = null;
  sortDirection: SortDirection = 'asc';

  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly claimStatusOptions: StatusOption[] = ['', 'Pending', 'Approved', 'Rejected'];
  readonly orderInvoiceStatusOptions: StatusOption[] = ['', 'Pending', 'Approved'];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private storageService: StorageService,
    private menuAccess: MenuAccessService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: [''],
      chassisNo: [''],
      claimNo: [null],
      jobNo: [''],
      warrantyClaimStatus: [''],
      warrantyOrderStatus: [''],
      warrantyInvoiceStatus: [''],
      search: ['']
    });

    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.isDealer = !!dealerCode;
    this.loggedInDealerCode = dealerCode || '';

    this.loadDealers();
    this.loadChassisList();
    this.search();
  }

  private loadDealers(): void {
    this.reportService.getDealerList().subscribe({
      next: (list) => this.dealerList = list ?? [],
      error: () => this.dealerList = []
    });
  }

  private loadChassisList(): void {
    this.reportService.getChassisList().subscribe({
      next: (list) => this.allChassisList = list ?? [],
      error: () => this.allChassisList = []
    });
  }

  // ── Chassis typeahead ────────────────────────────────────────────────
  onChassisInput(): void {
    const text = (this.filterForm.get('chassisNo')?.value || '').toString().trim().toLowerCase();
    this.filteredChassisList = (text
      ? this.allChassisList.filter(c => c.toLowerCase().includes(text))
      : this.allChassisList
    ).slice(0, 20);
    this.showChassisDropdown = true;
  }

  onChassisFocus(): void {
    this.onChassisInput();
  }

  onChassisBlur(): void {
    // Short delay so a mousedown selection on a suggestion registers
    // before the list disappears.
    if (this.chassisBlurTimeout) clearTimeout(this.chassisBlurTimeout);
    this.chassisBlurTimeout = setTimeout(() => { this.showChassisDropdown = false; }, 150);
  }

  selectChassisSuggestion(chassis: string): void {
    this.filterForm.patchValue({ chassisNo: chassis });
    this.showChassisDropdown = false;
  }

  private buildFilterPayload(): WarrantyRegisterFilterModel {
    const raw = this.filterForm.value;
    const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);

    return {
      dealerCode: emptyToNull(raw.dealerCode),
      locationCode: null,
      fromDate: emptyToNull(raw.fromDate),
      toDate: emptyToNull(raw.toDate),
      chassisNo: emptyToNull(raw.chassisNo),
      claimNo: raw.claimNo || null,
      jobNo: emptyToNull(raw.jobNo),
      warrantyClaimStatus: emptyToNull(raw.warrantyClaimStatus),
      warrantyOrderStatus: emptyToNull(raw.warrantyOrderStatus),
      warrantyInvoiceStatus: emptyToNull(raw.warrantyInvoiceStatus),
      search: emptyToNull(raw.search),
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
  }

  search(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.reportService.getWarrantyRegisterReport(this.buildFilterPayload()).subscribe({
      next: (res) => {
        this.reportData = res.data ?? [];
        this.totalRecords = res.totalRecords ?? 0;
        this.pageIndex = res.pageIndex ?? this.pageIndex;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.sortColumn = null;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load the warranty register report.';
        this.reportData = [];
        this.totalRecords = 0;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.search();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '',
      fromDate: '',
      toDate: '',
      chassisNo: '',
      claimNo: null,
      jobNo: '',
      warrantyClaimStatus: '',
      warrantyOrderStatus: '',
      warrantyInvoiceStatus: '',
      search: ''
    });
    this.pageIndex = 1;
    this.search();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.search();
  }

  // Used internally by lastPage() even though the badge no longer displays
  // "of N" (matching the reference's leaner pagination display).
  private get totalPages(): number {
    return this.pageSize > 0 ? Math.max(1, Math.ceil(this.totalRecords / this.pageSize)) : 1;
  }

  private goToPage(page: number): void {
    if (page < 1) return;
    this.pageIndex = page;
    this.search();
  }

  firstPage(): void { this.goToPage(1); }
  previousPage(): void { this.goToPage(this.pageIndex - 1); }
  nextPage(): void { this.goToPage(this.pageIndex + 1); }
  lastPage(): void { this.goToPage(this.totalPages); }

  // ── Sorting ──────────────────────────────────────────────────────────
  // NOTE: sorts only the currently loaded PAGE of rows, client-side - the
  // backend always orders by ClaimDate/ClaimNo. Say the word if you want
  // this to sort across the full filtered result set instead.
  onSort(column: keyof WarrantyRegisterViewModel): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;

    this.reportData = [...this.reportData].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return -1 * dir;
      if (strA > strB) return 1 * dir;
      return 0;
    });
  }

  // ── Formatting helpers ───────────────────────────────────────────────
  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'badge bg-success-subtle text-success border border-success-subtle';
      case 'rejected': return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      case 'pending': return 'badge bg-warning-subtle text-warning border border-warning-subtle';
      default: return 'badge bg-light text-dark border';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatNumber(value?: number): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('en-IN');
  }

  formatCurrency(value?: number): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatPercent(value?: number): string {
    if (value === null || value === undefined) return '—';
    return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
  }

 exportToExcel(): void {
    this.exporting = true;
    this.errorMessage = null;

    this.reportService.exportWarrantyRegisterReport(this.buildFilterPayload()).subscribe({
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
      { key: 'srNo', label: 'Sr No' },                                       // 1
      { key: 'locationName', label: 'Location Name' },                      // 2
      { key: 'locationCode', label: 'Location Code' },                      // 3
      { key: 'partyName', label: 'Party' },                                 // 4
      { key: 'customerName', label: 'Customer Name' },                      // 5
      { key: 'customerMobile', label: 'Mobile No' },                        // 6
      { key: 'chasisNo', label: 'Chassis No' },                             // 7
      { key: 'partCode', label: 'Part Code' },                              // 8
      { key: 'partName', label: 'Part Name' },                              // 9
      { key: 'partDescription', label: 'Part Description' },                // 10
      { key: 'modelName', label: 'Model Name' },                            // 11
      { key: 'labourName', label: 'Labour Name' },                          // 12
      { key: 'labourDescription', label: 'Labour Description' },            // 13

      { key: 'qty', label: 'Qty' },                                         // 14
      { key: 'rate', label: 'Rate' },                                       // 15
      { key: 'mrp', label: 'MRP' },                                         // 16
      { key: 'taxableAmount', label: 'Taxable Amount' },                    // 17
      { key: 'cgstPercent', label: 'CGST %' },                              // 18
      { key: 'cgstAmount', label: 'CGST Amount' },                          // 19
      { key: 'sgstPercent', label: 'SGST %' },                              // 20
      { key: 'sgstAmount', label: 'SGST Amount' },                          // 21
      { key: 'igstPercent', label: 'IGST %' },                              // 22
      { key: 'igstAmount', label: 'IGST Amount' },                          // 23
      { key: 'totalGstAmount', label: 'Total GST Amount' },                 // 24
      { key: 'totalAmount', label: 'Total Amount' },                        // 25

      { key: 'warrantyClaimNo', label: 'Claim No' },                        // 26
      { key: 'warrantyClaimDate', label: 'Claim Date' },                    // 27
      { key: 'warrantyClaimStatus', label: 'Claim Status' },                // 28
      { key: 'approverEngineerName', label: 'Approver Engineer' },          // 29
      { key: 'claimAcceptRejectReason', label: 'Reject Reason' },           // 30

      { key: 'warrantyOrderStatus', label: 'Order Status' },                // 31
      { key: 'warrantyOrderNo', label: 'Order No' },                        // 32
      { key: 'warrantyOrderDate', label: 'Order Date' },                    // 33
      { key: 'erpPoNumber', label: 'PO No' },                                // 34
      { key: 'erpPoDate', label: 'PO Date' },                                // 35

      { key: 'warrantyInvoiceStatus', label: 'Invoice Status' },            // 36

      { key: 'jobNo', label: 'Job No' },                                    // 37
      { key: 'jobDate', label: 'Job Date' },                                // 38

      { key: 'rbillNo', label: 'Repair Bill No' },                          // 39
      { key: 'rbillDate', label: 'Repair Bill Date' },                      // 40

      { key: 'warrantyInvoiceNo', label: 'Invoice No' },                    // 41
      { key: 'warrantyInvoiceDate', label: 'Invoice Date' },                // 42

      { key: 'packingSlipNo', label: 'Packing Slip No' },                   // 43
      { key: 'packingSlipDate', label: 'Packing Slip Date' },               // 44

      { key: 'dispatchNo', label: 'Dispatch No' },                          // 45
      { key: 'dispatchDate', label: 'Dispatch Date' },                      // 46
      { key: 'dispatchReceivedStatus', label: 'Dispatch Received Status' }, // 47
      { key: 'dispatchReceivedDate', label: 'Dispatch Received Date' },     // 48
      { key: 'dispatchReceivedRemarks', label: 'Dispatch Received Remarks' }, // 49

      { key: 'verificationDate', label: 'Verification Date' },              // 50

      { key: 'packingConcern', label: 'Packing Concern' },                  // 51
      { key: 'packingConcernType', label: 'Packing Concern Type' },         // 52
      { key: 'packingConcernRemarks', label: 'Packing Concern Remarks' },   // 53

      { key: 'materialConcern', label: 'Material Concern' },                // 54
      { key: 'materialConcernType', label: 'Material Concern Type' },       // 55
      { key: 'materialConcernRemarks', label: 'Material Concern Remarks' }, // 56

      { key: 'claimType', label: 'Claim Type' },                            // 57

      // Not shown in the on-screen table; kept in the export, appended at the end
      { key: 'prnNo', label: 'PRN No' },
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