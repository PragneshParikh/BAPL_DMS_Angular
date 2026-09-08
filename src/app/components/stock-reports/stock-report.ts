// src\app\components\stock-reports\stock-report.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { AuthenticationService } from '../../core/services/auth.service';
import { StockReport, DealerStockGroup } from '../../ViewModels/models/stock-report.model';

interface DealerOption {
  dealerCode: string;
  dealerName: string;
}

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-report.html'
})
export class StockReportComponent implements OnInit {

  dealerWiseReports: DealerStockGroup[] = [];
  grandTotal: number = 0;
  isLoading = false;

  // Filters
  isSuperAdmin = false;
  dealers: DealerOption[] = [];
  selectedDealerCode: string | undefined;
  fromDate: string = '';
  toDate: string = '';

  constructor(private ReportService: ReportService,
              private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.isSuperAdmin = currentUser?.role === 'SuperAdmin';

    if (this.isSuperAdmin) {
      // Only SuperAdmin gets to pick a dealer — everyone else stays scoped to
      // their own dealerCode, same restriction the original code already
      // enforced when it built the request without a dropdown.
      this.loadDealerList();
    } else {
      this.selectedDealerCode = currentUser?.dealerCode ?? undefined;
    }

    // Default the date filter to the current month (1st of this month
    // through today) before the first load, instead of leaving
    // fromDate/toDate blank.
    this.setDefaultDateRange();

    this.loadDealerWiseReport();
  }

  loadDealerList(): void {
    // NOTE: assumes ReportService already exposes getDealerList() — this
    // mirrors GetDealerListAsync on the backend, which other report screens
    // in this app (e.g. Model Wise Sale Report) already use to populate an
    // identical "-- All Dealers --" dropdown. If the method name/shape in
    // your actual ReportService differs, adjust this call to match.
    this.ReportService.getDealerList().subscribe({
      next: (data: DealerOption[]) => { this.dealers = data; },
      error: () => { this.dealers = []; }
    });
  }

  // Sets fromDate/toDate to the first day of the current month and today,
  // in 'YYYY-MM-DD' form so they bind directly to <input type="date">.
  private setDefaultDateRange(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.fromDate = this.formatDate(firstDayOfMonth);
    this.toDate = this.formatDate(now);
  }

  // Small local helper so we don't pull in a date library just for
  // 'YYYY-MM-DD' formatting. Uses local time (not UTC) so the date shown
  // matches what the user's calendar/clock says "today" is.
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadDealerWiseReport(): void {
    this.isLoading = true;

    this.ReportService.getDealerWiseStockReport(
      this.selectedDealerCode,
      this.fromDate || undefined,
      this.toDate || undefined
    ).subscribe({
      next: (data: StockReport[]) => {
        const map = new Map<string, DealerStockGroup>();
        data.forEach(row => {
          const key = row.dealerCode;
          if (!map.has(key)) {
            map.set(key, {
              dealerName: row.dealerName,
              dealerCode: row.dealerCode,
              items: [],
              totalQty: 0
            });
          }
          const group = map.get(key)!;
          group.items.push({
            model: row.model,
            colour: row.colour,
            totalQty: row.totalQty
          });
          group.totalQty += row.totalQty;
        });
        this.dealerWiseReports = Array.from(map.values());
        this.grandTotal = this.dealerWiseReports.reduce(
          (sum, d) => sum + d.totalQty, 0
        );
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch(): void {
    this.loadDealerWiseReport();
  }

  onReset(): void {
    // Restores the current-month default instead of clearing to blank, so
    // "Reset" consistently returns to the same starting view as a fresh
    // page load rather than an unfiltered all-dates report.
    this.setDefaultDateRange();
    if (this.isSuperAdmin) {
      this.selectedDealerCode = undefined;
    }
    this.loadDealerWiseReport();
  }

  printReport(): void {
    window.print();
  }

  // =========================================
  // EXPORT CSV
  // NEW — mirrors the on-screen table exactly: one row per item, a
  // sub-total row per dealer, and a final grand-total row. Built from
  // dealerWiseReports directly (already in memory client-side), so unlike
  // the other reports' exportToExcel()/exportToCSV() this needs no service
  // call, loading spinner, or error handling around a request — it's a
  // synchronous flatten-and-download.
  // =========================================

  exportToCSV(): void {
    if (!this.dealerWiseReports || this.dealerWiseReports.length === 0) {
      return;
    }

    const headers = ['Sr No', 'Dealer Name', 'Dealer Code', 'Model', 'Colour', 'Total Qty'];
    const rows: (string | number)[][] = [headers];

    this.dealerWiseReports.forEach(dealer => {
      dealer.items.forEach((item, i) => {
        rows.push([
          i + 1,
          dealer.dealerName,
          dealer.dealerCode,
          item.model,
          item.colour,
          item.totalQty
        ]);
      });

      rows.push([
        `${dealer.dealerName} - Sub Total`, '', '', '', '', dealer.totalQty
      ]);
    });

    rows.push(['GRAND TOTAL', '', '', '', '', this.grandTotal]);

    const csvContent = rows
      .map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}