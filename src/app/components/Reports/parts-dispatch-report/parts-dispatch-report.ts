// src\app\components\Reports\parts-dispatch-report\parts-dispatch-report.ts
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

  // NEW — SuperAdmins can browse this report across every dealer, so they
  // keep the "Dealer Code" picker. Everyone else is always restricted
  // server-side to their own dealer's data now (see
  // ReportController.GetPartsDispatchReport), so the picker can't actually
  // change what comes back — hide it and skip the dealer-list API call
  // entirely rather than show a control that does nothing.
  isSuperAdmin = false;

  constructor(
    private reportService: ReportService
  ) { }

  ngOnInit(): void {

    this.isSuperAdmin = this.checkIsSuperAdmin();

    if (this.isSuperAdmin) {
      this.loadDealers();
    }

    this.getReport();

  }

  /**
   * ASSUMPTION — I don't have this project's actual auth/token service, so
   * this reads the role the same flat way the Login API's JSON response
   * shape suggests it might be stored (`role` in localStorage). If this app
   * already keeps auth state in a shared AuthService/TokenService instead,
   * swap the body of this one method for a call into that.
   */
  private checkIsSuperAdmin(): boolean {
    const role = localStorage.getItem('role');
    return role === 'SuperAdmin';
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