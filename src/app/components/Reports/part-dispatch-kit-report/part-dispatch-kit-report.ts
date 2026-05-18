import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  ReportService
} from '../../../core/services/report.service';

import {
  PartDispatchKitReportViewModel
} from '../../../ViewModels/models/part-dispatch-kit-report.model';

@Component({
  selector: 'app-part-dispatch-kit-report',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './part-dispatch-kit-report.html',

  styleUrls:
    ['./part-dispatch-kit-report.scss']
})
export class PartDispatchKitReport
implements OnInit {

  loading = false;

  reportData:
    PartDispatchKitReportViewModel[] = [];

  dealerList: any[] = [];

  poTypeList: string[] = [];

  dealerCode = '';

  poType = '';

  fromDate = '';

  toDate = '';

  constructor(
    private reportService: ReportService
  ) { }

  ngOnInit(): void {

    this.loadDealers();

    this.loadPOType();

    this.getReport();
  }

  // =========================================
  // LOAD DEALERS
  // =========================================

  loadDealers(): void {

    this.reportService
      .getDealerList()
      .subscribe({

        next: (response) => {

          this.dealerList =
            response || [];
        },

        error: (error) => {

          console.error(error);
        }
      });
  }

  // =========================================
  // LOAD PO TYPES
  // =========================================

      loadPOType(): void {

      this.reportService
        .getPartDispatchKitPOTypeDropdown()
        .subscribe({

          next: (response) => {

            this.poTypeList =
              response || [];
          },

          error: (error) => {

            console.error(error);
          }
        });
    }

  // =========================================
  // GET REPORT
  // =========================================

  getReport(): void {

    this.loading = true;

    this.reportService
      .getPartDispatchKitReport(

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

          let data =
            Array.isArray(response)
              ? response
              : [];

          // ===============================
          // PO TYPE FILTER
          // ===============================

          if (this.poType) {

            data = data.filter(x =>
              x.poType === this.poType
            );
          }

          this.reportData = data;

          this.loading = false;
        },

        error: (error) => {

          console.error(error);

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

    this.poType = '';

    this.fromDate = '';

    this.toDate = '';

    this.getReport();
  }
  
}