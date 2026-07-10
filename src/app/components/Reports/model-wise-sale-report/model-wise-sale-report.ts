import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ReportService } from '../../../core/services/report.service';
import { DealerDropdownItem } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import {
  ModelWiseSaleCountFilter,
  ModelWiseSalePivotRow
} from '../../../ViewModels/models/model-wise-sale-countModel';

@Component({
  selector: 'app-model-wise-sale-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './model-wise-sale-report.html',
  providers: [ReportService]
})
export class ModelWiseSaleReportComponent implements OnInit {

  private reportService = inject(ReportService);
  private fb            = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];

  // Pivoted report state: dealers as rows, one column per model.
  modelNames: string[] = [];
  rows: ModelWiseSalePivotRow[] = [];
  columnTotals: { [modelName: string]: number } = {};
  grandTotal = 0;

  isLoading = false;

  // The backend already forces dealerCode for a dealer login regardless of
  // what this filter sends — hiding it is purely cosmetic, since a dealer
  // user's own dropdown selection would never actually change their results.
  isDealerUser = false;

  ngOnInit(): void {
    this.isDealerUser = this.checkIsDealerUser();

    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate:   [''],
      toDate:     ['']
    });

    this.initDates();
    this.loadDealers();
    this.loadReport();
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

  loadDealers(): void {
    this.reportService.getDealerDropdown().subscribe({
      next:  res => { this.dealerList = res || []; },
      error: err => console.error('Dealer dropdown error', err)
    });
  }

  private buildFilter(): ModelWiseSaleCountFilter {
    const f = this.filterForm.value;
    return {
      dealerCode: f.dealerCode || undefined,
      fromDate:   f.fromDate   || undefined,
      toDate:     f.toDate     || undefined
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.resetData();

    this.reportService.getModelWiseSaleCountReport(this.buildFilter()).subscribe({
      next: res => {
        this.modelNames   = res?.modelNames   || [];
        this.rows         = res?.rows         || [];
        this.columnTotals = res?.columnTotals || {};
        this.grandTotal   = res?.grandTotal   || 0;
        this.isLoading    = false;
      },
      error: err => {
        console.error('Model Wise Sale Report error', err);
        this.resetData();
        this.isLoading = false;
      }
    });
  }

  private resetData(): void {
    this.modelNames   = [];
    this.rows         = [];
    this.columnTotals = {};
    this.grandTotal   = 0;
  }

  onSearch(): void { this.loadReport(); }

  onReset(): void {
    this.filterForm.reset({ dealerCode: '', fromDate: '', toDate: '' });
    this.initDates();
    this.loadReport();
  }

  // Cell value for a given row + model column — always defined server-side,
  // but defaulted to 0 here too in case a row is missing an entry.
  cell(row: ModelWiseSalePivotRow, model: string): number {
    return row.modelCounts?.[model] || 0;
  }

  columnTotal(model: string): number {
    return this.columnTotals?.[model] || 0;
  }

  exportToCSV(): void {
    if (!this.rows.length) return;

    const headers = ['Dealer Code', 'Dealer Name', ...this.modelNames, 'Total'];

    const rows = this.rows.map(r => [
      r.dealerCode,
      r.dealerName,
      ...this.modelNames.map(m => this.cell(r, m)),
      r.total
    ]);

    const totalsRow = [
      '', 'Grand Total',
      ...this.modelNames.map(m => this.columnTotal(m)),
      this.grandTotal
    ];

    const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows, totalsRow].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ModelWiseSaleReport_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}