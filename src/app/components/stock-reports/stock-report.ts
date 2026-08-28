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
    this.fromDate = '';
    this.toDate = '';
    if (this.isSuperAdmin) {
      this.selectedDealerCode = undefined;
    }
    this.loadDealerWiseReport();
  }

  printReport(): void {
    window.print();
  }
}