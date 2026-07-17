import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ReportService } from '../../../core/services/report.service';
import { DealerDropdownItem } from '../../../ViewModels/models/UnifiedSaleReportViewModel';
import {
  ModelWiseVariantStockPivotRow,
  ModelWiseVariantStockCountFilter
} from '../../../ViewModels/models/Model wise variant stock count.model';

@Component({
  selector: 'app-model-wise-variant-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './model-wise-variant-report.html',
  providers: [ReportService]
})
export class ModelWiseVariantStockComponent implements OnInit {

  private reportService = inject(ReportService);
  private fb            = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];

  // Pivoted report state: models as rows, one column per colour variant.
  // Backend already excludes unmapped models/colours and zero-total
  // rows/columns entirely — this component just renders what it gets.
  variantNames: string[] = [];
  rows: ModelWiseVariantStockPivotRow[] = [];
  columnTotals: { [variantName: string]: number } = {};
  grandTotal = 0;

  isLoading = false;

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

  loadDealers(): void {
    this.reportService.getDealerDropdown().subscribe({
      next:  res => { this.dealerList = res || []; },
      error: err => console.error('Dealer dropdown error', err)
    });
  }

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

  private buildFilter(): ModelWiseVariantStockCountFilter {
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

    this.reportService.getModelWiseVariantStockCountReport(this.buildFilter()).subscribe({
      next: res => {
        this.variantNames = res?.variantNames || [];
        this.rows         = res?.rows         || [];
        this.columnTotals = res?.columnTotals || {};
        this.grandTotal   = res?.grandTotal   || 0;
        this.isLoading    = false;
      },
      error: err => {
        console.error('Model-wise Variant Stock error', err);
        this.resetData();
        this.isLoading = false;
      }
    });
  }

  private resetData(): void {
    this.variantNames = [];
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


  cell(row: ModelWiseVariantStockPivotRow, variant: string): number | null {
    const val = row.variantCounts?.[variant] || 0;
    return val > 0 ? val : null;
  }

  columnTotal(variant: string): number {
    return this.columnTotals?.[variant] || 0;
  }

  exportToCSV(): void {
    if (!this.rows.length) return;

    const headers = ['Model', ...this.variantNames, 'Total'];
    const rows = this.rows.map(r => [
      r.modelName,
      ...this.variantNames.map(v => r.variantCounts?.[v] || 0),
      r.total
    ]);

    const totalsRow = [
      'Grand Total',
      ...this.variantNames.map(v => this.columnTotal(v)),
      this.grandTotal
    ];

    const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows, totalsRow].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ModelWiseVariantStock_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}