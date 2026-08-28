// src\app\components\Reports\total-sale-report\total-sale-report.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ReportService } from '../../../core/services/report.service';
import { DealerDropdownItem } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import {
  TotalSaleReportDealerWiseRow,
  TotalSaleReportDealerWiseFilter
} from '../../../ViewModels/models/total-sale-reportModel';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-total-sale-dealer-wise',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './total-sale-report.html',
  providers: [ReportService]
})
export class TotalSaleDealerWiseComponent implements OnInit {
  private menuAccess = inject(MenuAccessService);
  readonly SUBMENU_ID = 81;
  canDownload = false;

  private reportService = inject(ReportService);
  private fb            = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];

  rows: TotalSaleReportDealerWiseRow[] = [];
  grandTotal: TotalSaleReportDealerWiseRow | null = null;
  isLoading = false;

  // The backend already forces dealerCode for a dealer login regardless of
  // what this filter sends — hiding it is purely cosmetic, since a dealer
  // user's own dropdown selection would never actually change their results.
  isDealerUser = false;

  ngOnInit(): void {
    this.isDealerUser = this.checkIsDealerUser();
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);

    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate:   [''],
      toDate:     ['']
    });

    this.initDates();
    this.loadDealers();
    this.loadReport();
  }

  // NOTE: assumes the JWT is stored in localStorage under the key 'token' —
  // adjust that key if this project's auth service uses a different one.
  // Fails safe: if anything here doesn't match, the filter just stays
  // visible rather than being hidden incorrectly.
  private checkIsDealerUser(): boolean {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const role =
        payload.role ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];

      return typeof role === 'string' && role.toLowerCase() === 'dealer';
    } catch {
      return false;
    }
  }

  initDates(): void {
    const today    = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: this.toISO(firstDay),
      toDate:   this.toISO(today)
    });
  }

  toISO(d: Date): string { return d.toISOString().split('T')[0]; }

  // Note: for a non-admin/dealer user, the backend forces dealerCode to their
  // own regardless of what's sent here — this dropdown is mainly useful for
  // admins comparing dealers, or is a no-op showing only the one dealer a
  // logged-in dealer user actually has access to.
  loadDealers(): void {
    this.reportService.getDealerDropdown().subscribe({
      next:  res => { this.dealerList = res || []; },
      error: err => console.error('Dealer dropdown error', err)
    });
  }

  private buildFilter(): TotalSaleReportDealerWiseFilter {
    const f = this.filterForm.value;
    return {
      dealerCode: f.dealerCode || undefined,
      fromDate:   f.fromDate   || undefined,
      toDate:     f.toDate     || undefined
    };
  }

  loadReport(): void {
    this.isLoading  = true;
    this.rows       = [];
    this.grandTotal = null;

    this.reportService.getTotalSaleReportDealerWise(this.buildFilter()).subscribe({
      next: res => {
        this.rows       = res?.rows       || [];
        this.grandTotal = res?.grandTotal || null;
        this.isLoading  = false;
      },
      error: err => {
        console.error('Total Sale Report (Dealer-wise) error', err);
        this.rows       = [];
        this.grandTotal = null;
        this.isLoading  = false;
      }
    });
  }

  onSearch(): void { this.loadReport(); }

  onReset(): void {
    this.filterForm.reset({ dealerCode: '', fromDate: '', toDate: '' });
    this.initDates();
    this.loadReport();
  }

  exportToCSV(): void {
    if (!this.rows.length) return;

    const headers = [
      'Dealer Code', 'Dealer Name', 'Dealer City', 'Dealer State',
      'Total Units', 'Cash', 'Credit',
      'Item Rate', 'Pre-GST Disc', 'Taxable', 'SGST', 'CGST', 'IGST',
      'FAME II', 'Reg Amt', 'Insurance', 'Post-GST Disc', 'Final Amount', 'Total Amount'
    ];

    const toRow = (r: TotalSaleReportDealerWiseRow) => [
      r.dealerCode, r.dealerName, r.dealerCity ?? '', r.dealerState ?? '',
      r.totalUnitsSold, r.cashCount, r.creditCount,
      r.totalItemRate, r.totalPreGstDiscount, r.totalTaxableAmount,
      r.totalSgstAmount, r.totalCgstAmount, r.totalIgstAmount,
      r.totalFameIIDiscount, r.totalRegAmount, r.totalInsuranceAmount,
      r.totalPostGstDiscount, r.totalFinalAmount, r.totalAmount
    ];

    const rows = this.rows.map(toRow);
    if (this.grandTotal) rows.push(toRow(this.grandTotal));

    const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `TotalSaleReportDealerWise_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}