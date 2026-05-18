import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ReportService }
from '../../../core/services/report.service';

@Component({
  selector: 'app-parts-dispatch-report',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './parts-dispatch-report.html',

  styleUrls:
    ['./parts-dispatch-report.scss']
})
export class PartsDispatchReport
implements OnInit {

  loading = false;

  dropdownLoading = false;

  reportData: any[] = [];

  dealerList: any[] = [];

  dealerCode = '';

  fromDate = '';

  toDate = '';

  constructor(
    private reportService: ReportService
  ) { }

  ngOnInit(): void {

    this.loadDealers();

    this.getReport();

  }

  // =========================================
  // LOAD DEALERS
  // =========================================

  loadDealers(): void {

    this.dropdownLoading = true;

    this.reportService
      .getDealerList()
      .subscribe({

        next: (response) => {

          this.dealerList =
            response || [];

          this.dropdownLoading = false;
        },

        error: (error) => {

          console.error(error);

          this.dropdownLoading = false;
        }
      });
  }

  // =========================================
  // GET REPORT
  // =========================================

  getReport(): void {

  this.loading = true;

  this.reportService
    .getPartsDispatchReport(

      this.dealerCode,

      this.fromDate
        ? new Date(this.fromDate)
        : undefined,

      this.toDate
        ? new Date(this.toDate)
        : undefined
    )
    .subscribe({

      next: (response) => {

        this.reportData =
          Array.isArray(response)
            ? response
            : [];

        this.loading = false;
      },

      error: (error) => {

        console.error(error);

        // EMPTY TABLE IF ERROR
        this.reportData = [];

        this.loading = false;
      }
    });
}

  // =========================================
  // RESET
  // =========================================

  resetFilters(): void {

    this.dealerCode = '';

    this.fromDate = '';

    this.toDate = '';

    this.getReport();
  }
}