import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { AuthenticationService } from '../../core/services/auth.service';
import { StockReport, DealerStockGroup } from '../../ViewModels/models/stock-report.model';

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-report.html'
})
export class StockReportComponent implements OnInit {

  dealerWiseReports: DealerStockGroup[] = [];
  grandTotal: number = 0;
  isLoading = false;

  constructor(private ReportService: ReportService,
              private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.loadDealerWiseReport();
  }

  loadDealerWiseReport(): void {
    this.isLoading = true;

    const currentUser = this.authService.currentUserValue;

    const dealerCode = currentUser?.role === 'SuperAdmin'
    ? undefined
    : currentUser?.dealerCode ?? undefined;
    this.ReportService.getDealerWiseStockReport(dealerCode).subscribe({
      next: (data) => {
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

  printReport(): void {
    window.print();
  }
}
