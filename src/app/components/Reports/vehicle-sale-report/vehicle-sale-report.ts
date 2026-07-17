import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ReportService } from '../../../core/services/report.service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { LedgerMaster } from '../../../ViewModels/LedgerMasterViewModel';

import {
  DealerDropdownItem,
  UnifiedSaleReportViewModel,
  UnifiedSaleReportTotals,
  UnifiedSaleReportFilter
} from '../../../ViewModels/models/UnifiedSaleReportViewModel';

@Component({
  selector: 'app-vehicle-sale-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './vehicle-sale-report.html',
  providers: [ReportService]
})
export class VehicleSaleReportComponent implements OnInit {

  private reportService       = inject(ReportService);
  private ledgerMasterService = inject(LedgerMasterService);
  private fb                  = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];
  financierList: LedgerMaster[] = [];

  reportData: UnifiedSaleReportViewModel[] = [];
  totals:     UnifiedSaleReportTotals | null = null;
  isLoading = false;

  // Vehicle Sale Bill is now the single source of truth — it already
  // returns every field the table/CSV need, so we just pull everything
  // that matches the filter in one shot (no UI pagination controls exist).
  pageIndex    = 1;
  pageSize     = 100000;
  totalRecords = 0;

  saleTypeList     = ['Cash', 'Credit'];
  customerTypeList = ['B2C', 'B2B'];
  billTypeList     = [
    { id: 1, name: 'Tax Invoice' },
    { id: 2, name: 'Counter Sale' }
  ];
  statusList = ['PerformaCreated', 'Invoiced', 'Pending', 'Invalid'];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      dealerCode:   [''],
      fromDate:     [''],
      toDate:       [''],
      saleType:     [''],
      customerType: [''],
      billType:     [''],
      status:       [''],
      chassisNo:    [''],
      saleBillNo:   [''],
      financier:    [''],
      search:       ['']
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

  private buildFilter(): UnifiedSaleReportFilter {
    const f = this.filterForm.value;
    return {
      dealerCode:   f.dealerCode   || undefined,
      fromDate:     f.fromDate     || undefined,
      toDate:       f.toDate       || undefined,
      saleType:     f.saleType     || undefined,
      customerType: f.customerType || undefined,
      billType:     f.billType ? Number(f.billType) : undefined,
      status:       f.status       || undefined,
      chassisNo:    f.chassisNo    || undefined,
      saleBillNo:   f.saleBillNo   || undefined,
      financier:    f.financier    || undefined,
      search:       f.search       || undefined,
      pageIndex:    this.pageIndex,
      pageSize:     this.pageSize
    };
  }

  // ── Single API call. The backend query already joins in dealer, location,
  // customer, and vehicle data, so there's nothing left to merge here.
  loadReport(): void {
    this.isLoading  = true;
    this.reportData = [];
    this.totals     = null;

    const filter = this.buildFilter();

    this.reportService.getVehicleSaleBillReport(filter)
      .pipe(catchError(err => {
        console.error('Vehicle Sale Bill API error:', err);
        return of(null);
      }))
      .subscribe({
        next: (res) => {
          const rows = (res?.data || []).map(r => this.normalizeAliases({ ...r }));
          rows.forEach((r, i) => r.srNo = i + 1);

          this.reportData   = rows;
          this.totalRecords = res?.totalRecords ?? rows.length;

          this.totals = {
            totalRecords:      res?.totalRecords ?? rows.length,
            totalItemRate:     res?.totalItemRate ?? this.sum(rows, 'itemRate'),
            totalTaxable:      res?.totalTaxable ?? this.sum(rows, 'taxableAmount'),
            totalSgst:         res?.totalSgst ?? this.sum(rows, 'sgstAmount'),
            totalCgst:         res?.totalCgst ?? this.sum(rows, 'cgstAmount'),
            totalIgst:         res?.totalIgst ?? this.sum(rows, 'igstAmount'),
            totalFameII:       res?.totalFameII ?? this.sum(rows, 'fameIIDiscount'),
            totalRegistration: res?.totalRegistration ?? this.sum(rows, 'regAmount'),
            totalInsurance:    res?.totalInsurance ?? this.sum(rows, 'insuranceAmount'),
            grandTotal:        res?.grandTotal ?? this.sum(rows, 'finalAmount'),
            totalAmount:       this.sum(rows, 'totalAmount'),
          };

          this.isLoading = false;
        },
        error: err => {
          console.error('Report load error', err);
          this.isLoading = false;
        }
      });
  }

  private sum(rows: UnifiedSaleReportViewModel[], key: keyof UnifiedSaleReportViewModel): number {
    return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  }

  // Fills known alias pairs so the template/CSV never see a blank field
  // just because the API used a different name for the same value.
  private normalizeAliases(r: UnifiedSaleReportViewModel): UnifiedSaleReportViewModel {
    r.chassisNo        = r.chassisNo        ?? r.chasisNo;
    r.chasisNo         = r.chasisNo         ?? r.chassisNo;
    r.motorNo          = r.motorNo          ?? r.motorNumber;
    r.motorNumber      = r.motorNumber      ?? r.motorNo;
    r.financier        = r.financier        ?? r.financeBy;
    r.financeBy        = r.financeBy        ?? r.financier;
    r.modelDescription = r.modelDescription ?? r.modelName;
    r.modelName        = r.modelName        ?? r.modelDescription;
    r.executiveName    = r.executiveName    ?? r.salesExecutive;
    r.salesExecutive   = r.salesExecutive   ?? r.executiveName;
    r.address1         = r.address1         ?? (r as any).partyAddress;
    r.email            = r.email            ?? r.partyEmail;
    r.subsidyAmount    = r.subsidyAmount     ?? (r as any).subsidyAmnt;
    return r;
  }

  onSearch(): void { this.pageIndex = 1; this.loadReport(); }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', saleType: '',
      customerType: '', billType: '', status: '',
      chassisNo: '', saleBillNo: '', financier: '', search: ''
    });
    this.initDates();
    this.pageIndex = 1;
    this.loadReport();
  }

  formatDate(v: any): string {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
  }

  getBillTypeName(id?: number | string): string {
    return this.billTypeList.find(b => b.id === Number(id))?.name
      ?? (id != null ? String(id) : '-');
  }

  exportToCSV(): void {
    if (!this.reportData.length) return;

    const headers = [
      'Sr No','Sale Bill No','Invoice No','Sale Date','Status','Booking ID',
      'Dealer Code','Dealer Name','Dealer City','Dealer State','Location','Loc Code','Location City',
      'Customer Name','Billing Name','Customer Type','Mobile','Customer City','Customer State',
      'Address','Email','PIN','Gender','DOB','Account Type','Party Email','Occupation',
      'Sale Type','Bill Type','Financier','Finance By','Financer Code',
      'Sales Executive','Executive Name','Prospect Name',
      'Chassis No','Motor No','Item Code','Model Code','Model Name','Model Desc',
      'OEM Model','Colour','Color Code','HSN','Vehicle Group','Mfg Year',
      'Reg No','Ins No','Dispatch Date',
      'Battery No','Battery No 2','Battery No 3','Battery No 4','Battery No 5','Battery No 6',
      'Battery Capacity','Battery','Battery Make','Battery Type','Charger No','Controller No','VCU',
      'Item Rate','Pre-GST Disc','Taxable','SGST %','SGST Amt','CGST %','CGST Amt',
      'IGST %','IGST Amt','FAME II','Reg Amt','Insurance','Post-GST Disc',
      'Final Amount','Total Amount','Subsidy Amount','FAME II Req'
    ];

    const rows = this.reportData.map(x => [
      x.srNo, x.saleBillNo, x.invoiceNo,
      this.formatDate(x.saleDate), x.status, x.bookingId,
      x.dealerCode, x.dealerName, x.dealerCity, x.dealerState, x.location, x.locCode, x.locCity,
      x.customerName, x.billingName, x.customerType, x.customerMobile,
      x.customerCity, x.customerState, x.address1, x.email, x.pin,
      x.gender, this.formatDate(x.dob), x.accountType, x.partyEmail, x.occupation,
      x.saleType, this.getBillTypeName(x.billType), x.financier, x.financeBy, x.financerCode,
      x.salesExecutive, x.executiveName, x.prospectName,
      x.chassisNo || x.chasisNo, x.motorNo || x.motorNumber,
      x.itemCode, x.modelCode, x.modelName, x.modelDescription,
      x.oemModelName, x.colour, x.colorCode, x.hsn, x.vehicleGroup, x.mfgYear,
      x.regNo, x.insNo, this.formatDate(x.dispatchDate),
      x.batteryNo, x.batteryNo2, x.batteryNo3, x.batteryNo4, x.batteryNo5, x.batteryNo6,
      x.batteryCapacity, x.battery, x.batteryMake, x.batteryType, x.chargerNo, x.controllerNo, x.vcu,
      x.itemRate ?? '', x.preGstDiscount ?? '', x.taxableAmount ?? '',
      x.sgstPer ?? '', x.sgstAmount ?? '', x.cgstPer ?? '', x.cgstAmount ?? '',
      x.igstPer ?? '', x.igstAmount ?? '', x.fameIIDiscount ?? '',
      x.regAmount ?? '', x.insuranceAmount ?? '', x.postGstDiscount ?? '',
      x.finalAmount ?? '', x.totalAmount ?? '', x.subsidyAmount ?? '',
      x.fameIIRequired != null ? (x.fameIIRequired ? 'YES' : 'NO') : ''
    ]);

    const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `VehicleSaleReport_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}