import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ReportService } from '../../../core/services/report.service';

import {
  VehicleSaleBillReportFilterModel,
  VehicleSaleBillReportViewModel,
  VehicleSaleBillReportResponse
} from '../../../ViewModels/models/vehicle-sale-bill-report.model';

import {
  DealerDropdownItem,
  VehicleSaleReportViewModel
} from '../../../ViewModels/models/vehicle-sale-report.model';

import {
  UnifiedSaleReportViewModel,
  UnifiedSaleReportTotals
} from '../../../ViewModels/models/UnifiedSaleReportViewModel';

@Component({
  selector: 'app-vehicle-sale-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './vehicle-sale-report.html',
  providers: [ReportService]
})
export class VehicleSaleReportComponent implements OnInit {

  private reportService = inject(ReportService);
  private fb            = inject(FormBuilder);

  filterForm!: FormGroup;
  dealerList: DealerDropdownItem[] = [];

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

  private buildSaleBillFilter(): VehicleSaleBillReportFilterModel {
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
      search:       f.search       || undefined,
      pageIndex:    this.pageIndex,
      pageSize:     this.pageSize
    };
  }

  loadReport(): void {
    this.isLoading  = true;
    this.reportData = [];
    this.totals     = null;

    const f          = this.filterForm.value;
    const dealerCode = f.dealerCode || undefined;
    const fromDate   = f.fromDate ? new Date(f.fromDate) : undefined;
    const toDate     = f.toDate   ? new Date(f.toDate)   : undefined;

    const saleBill$ = (this.dataSource === 'both' || this.dataSource === 'saleBill')
      ? this.reportService.getVehicleSaleBillReport(this.buildSaleBillFilter())
          .pipe(catchError(() => of(null)))
      : of(null);

    const vehicleSale$ = (this.dataSource === 'both' || this.dataSource === 'vehicleSale')
      ? this.reportService.getVehicleSaleReport(dealerCode, fromDate, toDate)
          .pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ saleBill: saleBill$, vehicleSale: vehicleSale$ }).subscribe({
      next: ({ saleBill, vehicleSale }) => {
        const unified: UnifiedSaleReportViewModel[] = [];

        // ── Map Sale Bill rows first ──────────────────────────
        if (saleBill?.data?.length) {
          saleBill.data.forEach(r => unified.push(this.mapSaleBill(r)));
          this.totalRecords = saleBill.totalRecords || 0;
        }

        // ── Map Vehicle Sale rows, skip duplicates by chassis ─
        if (vehicleSale?.length) {
          vehicleSale.forEach(r => {
            const alreadyIn = unified.some(
              u => !!u.chassisNo && u.chassisNo === r.chasisNo
            );
            if (!alreadyIn) unified.push(this.mapVehicleSale(r));
          });
        }

        // ── In-memory search across both sources ──────────────
        const q = (f.search || '').trim().toLowerCase();
        const filtered = q
          ? unified.filter(r =>
              [r.saleBillNo, r.invoiceNo, r.customerName, r.chassisNo,
               r.chasisNo, r.modelName, r.modelDescription, r.regNo,
               r.dealerName, r.dealerCode]
              .some(v => (v || '').toLowerCase().includes(q))
            )
          : unified;

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

  // ── VehicleSaleBillReportViewModel → UnifiedSaleReportViewModel
  private mapSaleBill(r: VehicleSaleBillReportViewModel): UnifiedSaleReportViewModel {
    return {
      srNo:            0,
      source:          'SaleBill',
      saleBillId:      r.saleBillId,
      saleBillNo:      r.saleBillNo,
      invoiceNo:       r.invoiceNo,
      saleDate:        r.saleDate,
      status:          r.status,
      dealerCode:      r.dealerCode,
      dealerName:      r.dealerName,
      dealerCity:      r.dealerCity,
      dealerState:     r.dealerState,
      location:        r.location,
      customerName:    r.customerName,
      billingName:     r.billingName,
      customerType:    r.customerType,
      customerMobile:  r.customerMobile,
      customerCity:    r.customerCity,
      customerState:   r.customerState,
      address1:        r.address1,
      saleType:        r.saleType,
      billType:        r.billType,
      financier:       r.financier,
      salesExecutive:  r.salesExecutive,
      chassisNo:       r.chassisNo,
      motorNo:         r.motorNo,
      itemCode:        r.itemCode,
      modelName:       r.modelName,
      oemModelName:    r.oemModelName,
      colour:          r.colour,
      hsn:             r.hsn,
      mfgYear:         r.mfgYear,
      regNo:           r.regNo,
      insNo:           r.insNo,
      batteryNo:       r.batteryNo,
      batteryNo2:      r.batteryNo2,
      batteryNo3:      r.batteryNo3,
      batteryCapacity: r.batteryCapacity,
      battery:         r.battery,
      chargerNo:       r.chargerNo,
      controllerNo:    r.controllerNo,
      vcu:             r.vcu,
      itemRate:        r.itemRate,
      preGstDiscount:  r.preGstDiscount,
      taxableAmount:   r.taxableAmount,
      sgstPer:         r.sgstPer,
      sgstAmount:      r.sgstAmount,
      cgstPer:         r.cgstPer,
      cgstAmount:      r.cgstAmount,
      igstPer:         r.igstPer,
      igstAmount:      r.igstAmount,
      fameIIDiscount:  r.fameIIDiscount,
      regAmount:       r.regAmount,
      insuranceAmount: r.insuranceAmount,
      postGstDiscount: r.postGstDiscount,
      finalAmount:     r.finalAmount,
      subsidyAmount:   r.subsidyAmount,
      fameIIRequired:  r.fameIIRequired,
    };
  }

  // ── VehicleSaleReportViewModel → UnifiedSaleReportViewModel
  private mapVehicleSale(r: VehicleSaleReportViewModel): UnifiedSaleReportViewModel {
    return {
      srNo:             0,
      source:           'VehicleSale',
      invoiceNo:        r.invoiceNo,
      saleDate:         r.saleDate?.toString(),
      billDate:         r.billDate?.toString(),
      dealerCode:       r.dealerCode,
      dealerName:       r.dealerName,
      dealerCity:       r.dealerCity,
      dealerState:      r.dealerState,
      location:         r.location,
      locCode:          r.locCode,
      customerName:     r.name,
      customerType:     r.type,
      customerMobile:   r.mobileNo,
      customerCity:     r.customerCity,
      customerState:    r.customerState,
      address1:         r.address1,
      email:            r.email,
      pin:              r.pin,
      bookingId:        r.bookingId,
      billType:         r.billType,
      financeBy:        r.financeBy,
      financerCode:     r.financerCode,
      executiveName:    r.executiveName,
      prospectName:     r.prospectName,
      chasisNo:         r.chasisNo,
      chassisNo:        r.chasisNo,
      motorNumber:      r.motorNumber,
      motorNo:          r.motorNumber,
      modelCode:        r.modelCode,
      modelDescription: r.modelDescription,
      oemModelName:     r.oemModelName,
      colorCode:        r.colorCode,
      vehicleGroup:     r.vehicleGroup,
      regNo:            r.regNo,
      dispatchDate:     r.dispatchDate?.toString(),
      batteryNo:        r.batteryNo,
      batteryNo2:       r.batteryNo2,
      batteryNo3:       r.batteryNo3,
      batteryNo4:       r.batteryNo4,
      batteryNo5:       r.batteryNo5,
      batteryNo6:       r.batteryNo6,
      batteryCapacity:  r.batteryCapacity,
      subsidyAmount:    r.subsidyAmount ?? undefined,
      fameIIRequired:   r.fameIIRequired ?? undefined,
      totalAmount:      r.totalAmount ?? undefined,
    };
  }

  onSearch(): void  { this.pageIndex = 1; this.loadReport(); }
  setSource(src: 'both' | 'saleBill' | 'vehicleSale'): void {
    this.dataSource = src;
    this.pageIndex  = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', saleType: '',
      customerType: '', billType: '', status: '',
      chassisNo: '', saleBillNo: '', search: ''
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