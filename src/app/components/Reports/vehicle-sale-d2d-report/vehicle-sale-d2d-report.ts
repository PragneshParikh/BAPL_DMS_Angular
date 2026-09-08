// src\app\components\Reports\vehicle-sale-d2d-report\vehicle-sale-d2d-report.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import * as XLSX from 'xlsx';
import { ReportService } from '../../../core/services/report.service';
import { D2DReportFilter, D2DReportRow } from '../../../ViewModels/models/d2d-reportModel';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-vehicle-sale-d2d-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-sale-d2d-report.html',
  styleUrl: './vehicle-sale-d2d-report.scss',
})
export class VehicleSaleD2dReport implements OnInit {
  dealers: { dealerCode: string; dealerName: string }[] = [];
  chassisList: string[] = [];
  filteredChassisList: string[] = [];
  showChassisDropdown = false;
  readonly SUBMENU_ID = 61;
  canDownload = false;

  // NEW — SuperAdmins can browse D2D transfers across every dealer, so they
  // keep the "Dealer" picker. Everyone else is always restricted server-side
  // to their own dealer's data now (see ReportController.GetD2DReport /
  // ExportD2DReport), so the picker has nothing to do for them — hide it and
  // skip the dealer-list API call entirely rather than show a control that
  // can't actually change what comes back.
  isSuperAdmin = false;

  filter: D2DReportFilter = {
    dealerCode: null,
    fromDealerCode: null,
    locationCode: null,
    chassisNo: null,
    motorNo: null,
    batteryNo: null,
    chargerNo: null,
    controllerNo: null,
    stockStatus: null,
    fromDate: null,
    toDate: null,
    search: null,
    pageIndex: 1,
    pageSize: 25
  };

  rows: D2DReportRow[] = [];
  totalRecords = 0;
  loading = false;
  exporting = false;
  errorMessage = '';

  constructor(private reportService: ReportService, private menuAccess: MenuAccessService) { }

  ngOnInit(): void {
    this.isSuperAdmin = this.checkIsSuperAdmin();
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);

    if (this.isSuperAdmin) {
      this.loadDealers();
    }

    this.loadChassisList();

    // NEW — default the date filter to the current month (1st of this
    // month through today) before the first load, instead of leaving
    // filter.fromDate/toDate null.
    this.setDefaultDateRange();

    this.loadReport();
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
   */
  private checkIsSuperAdmin(): boolean {
    const role = localStorage.getItem('role');
    return role === 'SuperAdmin';
  }

  // =========================================
  // DEFAULT DATE RANGE (current month)
  // NEW — same pattern as the Stock Report / Vehicle Stock Report / Parts
  // Dispatch Report / Part Dispatch Kit Report components, adapted here to
  // write into filter.fromDate/filter.toDate instead of top-level
  // properties, since that's where this component keeps its date filters.
  // =========================================

  private setDefaultDateRange(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filter.fromDate = this.toDateInputString(firstDayOfMonth);
    this.filter.toDate = this.toDateInputString(now);
  }

  // Formats a Date as 'YYYY-MM-DD' in LOCAL time (not UTC), so it binds
  // correctly to <input type="date"> and matches what the user's
  // clock/calendar says "today" is.
  private toDateInputString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadDealers(): void {
    this.reportService.getDealerList().subscribe({
      next: (data: any) => (this.dealers = data),
      error: () => (this.dealers = [])
    });
  }

  loadChassisList(): void {
    this.reportService.getChassisList().subscribe({
      next: (data: string[]) => (this.chassisList = data || []),
      error: () => (this.chassisList = [])
    });
  }

  onChassisFocus(): void {
    this.onChassisInput();
  }

  onChassisInput(): void {
    const term = (this.filter.chassisNo || '').trim().toLowerCase();

    this.filteredChassisList = term
      ? this.chassisList.filter(c => c.toLowerCase().includes(term)).slice(0, 50)
      : this.chassisList.slice(0, 50);

    this.showChassisDropdown = true;
  }

  onChassisBlur(): void {
    // Delay so a click/mousedown on a dropdown item registers before it closes
    setTimeout(() => (this.showChassisDropdown = false), 150);
  }

  selectChassis(chassis: string): void {
    this.filter.chassisNo = chassis;
    this.showChassisDropdown = false;
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reportService.getD2DReport(this.filter).subscribe({
      next: (res: any) => {
        this.rows = res.data;
        this.totalRecords = res.totalRecords;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Failed to load D2D report.';
        this.rows = [];
        this.totalRecords = 0;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filter.pageIndex = 1;
    this.loadReport();
  }

  resetFilters(): void {
    this.filter = {
      dealerCode: null,
      fromDealerCode: null,
      locationCode: null,
      chassisNo: null,
      motorNo: null,
      batteryNo: null,
      chargerNo: null,
      controllerNo: null,
      stockStatus: null,
      fromDate: null,
      toDate: null,
      search: null,
      pageIndex: 1,
      pageSize: 25
    };

    // CHANGED — restores the current-month default instead of leaving
    // fromDate/toDate null, so "Reset" consistently returns to the same
    // starting view as a fresh page load rather than an unfiltered
    // all-dates report.
    this.setDefaultDateRange();

    this.loadReport();
  }

  exportToExcel(): void {
    this.exporting = true;
    this.errorMessage = '';

    this.reportService.exportD2DReport(this.filter).subscribe({
      next: (data: D2DReportRow[]) => {
        this.exporting = false;

        if (!data || data.length === 0) {
          this.errorMessage = 'No data available to export.';
          return;
        }

        const exportRows = data.map(row => ({
          'Sr No': row.srNo,
          'Invoice Date': row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-GB') : '',
          'BG Invoice No': row.bgInvoiceNo,
          'From Dealer Code': row.fromDealerCode,
          'From Dealer Name': row.fromDealerName,
          'From Dealer City': row.fromDealerCity,
          'From Dealer State': row.fromDealerState,
          'To Dealer Code': row.dealerCode,
          'To Dealer Name': row.dealerName,
          'To Dealer City': row.dealerCity,
          'To Dealer State': row.dealerState,
          'Location': row.purchaseReceivingLocation,
          'Location Code': row.locationCode,
          'Location City': row.locationCity,
          'Model Code': row.modelCode,
          'Model': row.modelName,
          'OEM Model': row.oemModelName,
          'Chassis No': row.chassisNo,
          'Motor No': row.motorNo,
          'Colour': row.colour,
          'Mfg Year': row.mfgYear,
          'Battery No': row.batteryNo,
          'Battery Make': row.batteryMake,
          'Charger No': row.chargerNo,
          'Controller No': row.controllerNo,
          'Stock Status': row.stockStatus,
          'D2D': row.isD2D ? 'Yes' : 'No'
        }));

        // const worksheet = XLSX.utils.json_to_sheet(exportRows);
        // const workbook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(workbook, worksheet, 'D2D Report');

        // const fileName = `D2D_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        // XLSX.writeFile(workbook, fileName);
      },
      error: (err: any) => {
        this.exporting = false;
        this.errorMessage = err?.error?.message || 'Failed to export D2D report.';
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.filter.pageSize));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageIndex = page;
    this.loadReport();
  }

  nextPage(): void {
    this.goToPage(this.filter.pageIndex + 1);
  }

  prevPage(): void {
    this.goToPage(this.filter.pageIndex - 1);
  }
}