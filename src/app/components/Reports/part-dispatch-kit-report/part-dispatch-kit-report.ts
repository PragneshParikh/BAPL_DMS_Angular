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

  // NEW — SuperAdmins can browse this report across every dealer, so they
  // keep the "Dealer Name" picker. Everyone else is always restricted
  // server-side to their own dealer's data now (see
  // ReportController.GetPartDispatchKitReport), so the picker can't
  // actually change what comes back — hide it and skip the dealer-list API
  // call entirely rather than show a control that does nothing.
  isSuperAdmin = false;

  constructor(
    private reportService: ReportService
  ) { }

  ngOnInit(): void {

    this.isSuperAdmin = this.checkIsSuperAdmin();

    if (this.isSuperAdmin) {
      this.loadDealers();
    }

    this.loadPOType();

    this.getReport();
  }

  /**
   * ASSUMPTION — I don't have this project's actual auth/token service, so
   * this reads the role the same flat way the Login API's JSON response
   * shape suggests it might be stored (`role` in localStorage). If this app
   * already keeps auth state in a shared AuthService/TokenService instead,
   * replace the body of this one method with a call into that
   * (e.g. `return this.authService.hasRole('SuperAdmin');`) — nothing else
   * in this component needs to change, since everything else here just
   * depends on `isSuperAdmin` being set correctly.
   *
   * NOTE — this is now duplicated in the D2D report, Vehicle Sale Report,
   * and Vehicle Stock Report components too. Worth pulling into one shared
   * service/helper once the real auth check is wired in, so it only needs
   * fixing in one place.
   */
  private checkIsSuperAdmin(): boolean {
    const role = localStorage.getItem('role');
    return role === 'SuperAdmin';
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