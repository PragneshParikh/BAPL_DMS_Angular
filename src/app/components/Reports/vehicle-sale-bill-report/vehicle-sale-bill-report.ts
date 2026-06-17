import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import {
  VehicleSaleBillReportFilterModel,
  VehicleSaleBillReportResponse,
  VehicleSaleBillReportViewModel
} from '../../../ViewModels/models/vehicle-sale-bill-report.model';

@Component({
  selector: 'app-vehicle-sale-bill-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-sale-bill-report.html',
  styleUrl: './vehicle-sale-bill-report.scss'
})
export class VehicleSaleBillReport implements OnInit {

  filterForm!: FormGroup;

  dealerList: any[] = [];

  saleTypeList = ['Cash', 'Credit'];
  customerTypeList = ['B2C', 'B2B'];
  billTypeList = [
    { id: 1, name: 'Tax Invoice' },
    { id: 2, name: 'Counter Sale' }
  ];
  statusList = ['PerformaCreated', 'Invoiced', 'Pending', 'Invalid'];

  reportData: VehicleSaleBillReportViewModel[] = [];
  totals: VehicleSaleBillReportResponse | null = null;

  isLoading = false;
  dropdownsLoading = false;

  pageIndex = 1;
  pageSize = 20;
  totalRecords = 0;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      fromDate: [''],
      toDate: [''],
      saleType: [''],
      customerType: [''],
      billType: [''],
      status: [''],
      chassisNo: [''],
      saleBillNo: [''],
      search: ['']
    });

    this.loadDealers();
    this.loadReport();
  }

  loadDealers(): void {
    this.dropdownsLoading = true;
    this.reportService.getDealerList().subscribe({
      next: (res) => {
        this.dealerList = res || [];
        this.dropdownsLoading = false;
      },
      error: () => { this.dropdownsLoading = false; }
    });
  }

  private buildFilter(): VehicleSaleBillReportFilterModel {
    const f = this.filterForm.value;
    return {
      dealerCode: f.dealerCode || undefined,
      fromDate: f.fromDate || undefined,
      toDate: f.toDate || undefined,
      saleType: f.saleType || undefined,
      customerType: f.customerType || undefined,
      billType: f.billType ? Number(f.billType) : undefined,
      status: f.status || undefined,
      chassisNo: f.chassisNo || undefined,
      saleBillNo: f.saleBillNo || undefined,
      search: f.search || undefined,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };
  }

  loadReport(): void {
    this.isLoading = true;
    this.reportService.getVehicleSaleBillReport(this.buildFilter()).subscribe({
      next: (res) => {
        this.reportData = res.data || [];
        this.totals = res;
        this.totalRecords = res.totalRecords || 0;
        this.isLoading = false;
      },
      error: () => {
        this.reportData = [];
        this.totals = null;
        this.totalRecords = 0;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  onReset(): void {
    this.filterForm.reset({
      dealerCode: '', fromDate: '', toDate: '', saleType: '',
      customerType: '', billType: '', status: '', chassisNo: '',
      saleBillNo: '', search: ''
    });
    this.pageIndex = 1;
    this.loadReport();
  }

  // Pagination
  firstPage(): void { if (this.pageIndex !== 1) { this.pageIndex = 1; this.loadReport(); } }
  previousPage(): void { if (this.pageIndex > 1) { this.pageIndex--; this.loadReport(); } }
  nextPage(): void {
    if (this.pageIndex * this.pageSize < this.totalRecords) { this.pageIndex++; this.loadReport(); }
  }
  lastPage(): void {
    const last = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    if (this.pageIndex !== last) { this.pageIndex = last; this.loadReport(); }
  }

  formatDate(value: any): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  getBillTypeName(id?: number): string {
    return this.billTypeList.find(b => b.id === id)?.name ?? '';
  }

  exportToCSV(): void {
    if (!this.reportData.length) return;

    const headers = [
      'Sr No','Sale Bill No','Sale Date','Status','Location','Dealer Code','Dealer Name',
      'Customer Name','Billing Name','Customer Type','Sale Type','Bill Type','Financier',
      'Sales Executive','Mobile','City','State','Invoice No','Chassis No','Motor No',
      'Item Code','Model','OEM Model','Colour','HSN','Mfg Year','Reg No','Ins No',
      'Item Rate','Pre-GST Disc','Taxable','SGST %','SGST Amt','CGST %','CGST Amt',
      'IGST %','IGST Amt','FAME II','Reg Amt','Insurance','Post-GST Disc','Final Amount',
      'Battery','Charger No','Controller No','VCU'
    ];

    const rows = this.reportData.map(x => [
      x.srNo, x.saleBillNo, this.formatDate(x.saleDate), x.status, x.location, x.dealerCode, x.dealerName,
      x.customerName, x.billingName, x.customerType, x.saleType, this.getBillTypeName(x.billType), x.financier,
      x.salesExecutive, x.customerMobile, x.customerCity, x.customerState, x.invoiceNo, x.chassisNo, x.motorNo,
      x.itemCode, x.modelName, x.oemModelName, x.colour, x.hsn, x.mfgYear, x.regNo, x.insNo,
      x.itemRate, x.preGstDiscount, x.taxableAmount, x.sgstPer, x.sgstAmount, x.cgstPer, x.cgstAmount,
      x.igstPer, x.igstAmount, x.fameIIDiscount, x.regAmount, x.insuranceAmount, x.postGstDiscount, x.finalAmount,
      x.battery, x.chargerNo, x.controllerNo, x.vcu
    ]);

    const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VehicleSaleBillReport_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}