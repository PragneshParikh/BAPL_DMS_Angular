import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
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

  pageIndex    = 1;
  pageSize     = 50;
  totalRecords = 0;

  saleTypeList     = ['Cash', 'Credit'];
  customerTypeList = ['B2C', 'B2B'];
  billTypeList     = [
    { id: 1, name: 'Tax Invoice' },
    { id: 2, name: 'Counter Sale' }
  ];
  statusList = ['PerformaCreated', 'Invoiced', 'Pending', 'Invalid'];

  dataSource: 'both' | 'saleBill' | 'vehicleSale' = 'both';

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
    // this.loadFinanciers();
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

  // loadFinanciers(): void {
  //   this.ledgerMasterService.getFinancierLedgers().subscribe({
  //     next:  res => { this.financierList = res || []; },
  //     error: err => console.error('Financier dropdown error', err)
  //   });
  // }

  // ── One filter, shared by both report endpoints ──────────────
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

  loadReport(): void {
    this.isLoading  = true;
    this.reportData = [];
    this.totals     = null;

    const filter = this.buildFilter();

    const saleBill$ = (this.dataSource === 'both' || this.dataSource === 'saleBill')
      ? this.reportService.getVehicleSaleBillReport(filter)
          .pipe(catchError(err => { console.error('SaleBill API error:', err); return of(null); }))
      : of(null);

    const vehicleSale$ = (this.dataSource === 'both' || this.dataSource === 'vehicleSale')
      ? this.reportService.getVehicleSaleReport(filter)
          .pipe(catchError(err => { console.error('VehicleSale API error:', err); return of(null); }))
      : of(null);

    forkJoin({ saleBill: saleBill$, vehicleSale: vehicleSale$ }).subscribe({
      next: ({ saleBill, vehicleSale }) => {
        const unified: UnifiedSaleReportViewModel[] = [];

        // ── Sale Bill rows first ───────────────────────────────
        if (saleBill?.data?.length) {
          saleBill.data.forEach(r =>
            unified.push(this.normalizeAliases({ ...r, source: 'SaleBill' }))
          );
          this.totalRecords = saleBill.totalRecords || 0;
        }

        // ── Vehicle Sale rows, skip duplicates by chassis ──────
        if (vehicleSale?.length) {
          vehicleSale.forEach(r => {
            const row = this.normalizeAliases({ ...r, source: 'VehicleSale' });
            const alreadyIn = unified.some(u => !!u.chassisNo && u.chassisNo === row.chassisNo);
            if (!alreadyIn) unified.push(row);
          });
        }

        // ── saleType / customerType / billType / status apply to BOTH
        // sources here, since the vehicle-sale API has no way to filter
        // on them itself — only the sale-bill request body carries them.
        const matches = (r: UnifiedSaleReportViewModel): boolean => {
          if (filter.saleType && r.saleType?.trim().toLowerCase() !== filter.saleType.trim().toLowerCase()) {
            return false;
          }
          if (filter.customerType && r.customerType?.trim().toLowerCase() !== filter.customerType.trim().toLowerCase()) {
            return false;
          }
          if (filter.billType != null && Number(r.billType) !== filter.billType) {
            return false;
          }
          if (filter.status && r.status?.trim().toLowerCase() !== filter.status.trim().toLowerCase()) {
            return false;
          }
          if (filter.financier && r.financier?.trim().toLowerCase() !== filter.financier.trim().toLowerCase()) {
            return false;
          }
          return true;
        };
        const bySource = unified.filter(matches);

        // ── In-memory search across both sources ───────────────
        const q = (filter.search || '').trim().toLowerCase();
        const filtered = q
          ? bySource.filter(r =>
              [r.saleBillNo, r.invoiceNo, r.customerName, r.chassisNo,
               r.chasisNo, r.modelName, r.modelDescription, r.regNo,
               r.dealerName, r.dealerCode]
              .some(v => (v || '').toLowerCase().includes(q))
            )
          : bySource;

        filtered.forEach((r, i) => r.srNo = i + 1);
        this.reportData = filtered;

        this.totals = {
          totalRecords:      filtered.length,
          totalItemRate:     this.sum(filtered, 'itemRate'),
          totalTaxable:      this.sum(filtered, 'taxableAmount'),
          totalSgst:         this.sum(filtered, 'sgstAmount'),
          totalCgst:         this.sum(filtered, 'cgstAmount'),
          totalIgst:         this.sum(filtered, 'igstAmount'),
          totalFameII:       this.sum(filtered, 'fameIIDiscount'),
          totalRegistration: this.sum(filtered, 'regAmount'),
          totalInsurance:    this.sum(filtered, 'insuranceAmount'),
          grandTotal:        this.sum(filtered, 'finalAmount'),
          totalAmount:       this.sum(filtered, 'totalAmount'),
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

  // Fills known alias pairs both ways so the template/CSV export never see a
  // blank field just because one API used a different name for the same value.
  private normalizeAliases(r: UnifiedSaleReportViewModel): UnifiedSaleReportViewModel {
    r.chassisNo        = r.chassisNo        ?? r.chasisNo;
    r.chasisNo         = r.chasisNo         ?? r.chassisNo;
    r.motorNo          = r.motorNo          ?? r.motorNumber;
    r.motorNumber      = r.motorNumber      ?? r.motorNo;
    r.financier        = r.financier        ?? r.financeBy;
    r.financeBy        = r.financeBy        ?? r.financier;
    r.modelDescription = r.modelDescription ?? r.modelName;
    r.modelName        = r.modelName        ?? r.modelDescription;
    return r;
  }

  onSearch(): void  { this.pageIndex = 1; this.loadReport(); }

  setSource(src: 'both' | 'saleBill' | 'vehicleSale'): void {
    this.dataSource = src;

    if (src === 'vehicleSale') {
      this.filterForm.patchValue({
        saleType: '', customerType: '', billType: '',
        status: '', chassisNo: '', saleBillNo: ''
      }, { emitEvent: false });
    }

    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', saleType: '',
      customerType: '', billType: '', status: '',
      chassisNo: '', saleBillNo: '', financier: '', search: ''
    });
    this.initDates();
    this.dataSource  = 'both';
    this.pageIndex   = 1;
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
      'Sr No','Source','Sale Bill No','Invoice No','Sale Date','Status','Booking ID',
      'Dealer Code','Dealer Name','Dealer City','Dealer State','Location','Loc Code',
      'Customer Name','Billing Name','Customer Type','Mobile','Customer City','Customer State',
      'Address','Email','PIN',
      'Sale Type','Bill Type','Financier','Finance By','Financer Code',
      'Sales Executive','Executive Name','Prospect Name',
      'Chassis No','Motor No','Item Code','Model Code','Model Name','Model Desc',
      'OEM Model','Colour','Color Code','HSN','Vehicle Group','Mfg Year',
      'Reg No','Ins No','Dispatch Date',
      'Battery No','Battery No 2','Battery No 3','Battery No 4','Battery No 5','Battery No 6',
      'Battery Capacity','Battery','Charger No','Controller No','VCU',
      'Item Rate','Pre-GST Disc','Taxable','SGST %','SGST Amt','CGST %','CGST Amt',
      'IGST %','IGST Amt','FAME II','Reg Amt','Insurance','Post-GST Disc',
      'Final Amount','Total Amount','Subsidy Amount','FAME II Req'
    ];

    const rows = this.reportData.map(x => [
      x.srNo, x.source, x.saleBillNo, x.invoiceNo,
      this.formatDate(x.saleDate), x.status, x.bookingId,
      x.dealerCode, x.dealerName, x.dealerCity, x.dealerState, x.location, x.locCode,
      x.customerName, x.billingName, x.customerType, x.customerMobile,
      x.customerCity, x.customerState, x.address1, x.email, x.pin,
      x.saleType, this.getBillTypeName(x.billType), x.financier, x.financeBy, x.financerCode,
      x.salesExecutive, x.executiveName, x.prospectName,
      x.chassisNo || x.chasisNo, x.motorNo || x.motorNumber,
      x.itemCode, x.modelCode, x.modelName, x.modelDescription,
      x.oemModelName, x.colour, x.colorCode, x.hsn, x.vehicleGroup, x.mfgYear,
      x.regNo, x.insNo, this.formatDate(x.dispatchDate),
      x.batteryNo, x.batteryNo2, x.batteryNo3, x.batteryNo4, x.batteryNo5, x.batteryNo6,
      x.batteryCapacity, x.battery, x.chargerNo, x.controllerNo, x.vcu,
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