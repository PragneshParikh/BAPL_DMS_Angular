import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LineOrderReportService } from '../../../core/services/line-order-report.service';
import { LineOrderReportRequest } from '../../../ViewModels/models/line-order-report.model';

interface Col {
  key: string;
  label: string;
  type?: 'date' | 'num';
}

@Component({
  selector: 'app-line-order-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './line-order-report.html',
  styleUrl: './line-order-report.scss'
})
export class LineOrderReport implements OnInit {
  //lineType: 'Labour' | 'Part' = 'Labour';
  lineType: 'All' | 'Labour' | 'Part' = 'All';
  fromDate = this.fyStart();
  toDate = this.fmt(new Date());

  rows: any[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  loading = false;
  exporting = false;

  columns: Col[] = [
    { key: 'dealerName', label: 'Dealer Name' },
    { key: 'dealerCode', label: 'Dealer Code' },
    { key: 'uniqueId', label: 'Unique Id' },
    { key: 'locCode', label: 'Loc Code' },
    { key: 'docDate', label: 'Doc Date', type: 'date' },
    { key: 'docNo', label: 'Doc No' },
    { key: 'docType', label: 'Doc Type' },
    { key: 'jobDate', label: 'Job Date', type: 'date' },
    { key: 'jobNo', label: 'Job No' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'jobCardType', label: 'Job Card Type' },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'partyName', label: 'Party Name' },
    { key: 'partyMobile', label: 'Party Mobile' },
    { key: 'regNo', label: 'Reg No' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'chassisNo', label: 'Chassis No' },
    { key: 'location', label: 'Location' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'itemDescription', label: 'Item Description' },
    { key: 'itemType', label: 'Item Type' },
    { key: 'qty', label: 'Qty' },
    { key: 'rate', label: 'Rate', type: 'num' },
    { key: 'total', label: 'Total', type: 'num' },
    { key: 'sgstPer', label: 'SGST %', type: 'num' },
    { key: 'sgstAmount', label: 'SGST Amount', type: 'num' },
    { key: 'cgstPer', label: 'CGST %', type: 'num' },
    { key: 'cgstAmount', label: 'CGST Amount', type: 'num' },
    { key: 'igstPer', label: 'IGST %', type: 'num' },
    { key: 'igstAmount', label: 'IGST Amount', type: 'num' },
    { key: 'discount', label: 'Discount', type: 'num' },
    { key: 'totalAmount', label: 'Total Amount', type: 'num' },
    { key: 'mrp', label: 'MRP', type: 'num' },
    { key: 'dealerType', label: 'Dealer Type' }
  ];

  constructor(private svc: LineOrderReportService) {}

  ngOnInit() { this.search(); }

  private fmt(d: Date) {
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private fyStart(): string {
    const t = new Date();
    const y = t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1;
    return `${y}-04-01`;
  }

  private buildReq(): LineOrderReportRequest {
    return {
      lineType: this.lineType,
      fromDate: this.fromDate,
      toDate: this.toDate,
      pageIndex: this.page,
      pageSize: this.pageSize
    };
  }

  cell(row: any, col: Col): string {
    const v = row[col.key];
    if (v === null || v === undefined || v === '') return '';
    if (col.type === 'date') {
      const [y, m, d] = String(v).substring(0, 10).split('-');
      return `${d}-${m}-${y}`;
    }
    if (col.type === 'num') {
      return Number(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return String(v);
  }

  //setType(t: 'Labour' | 'Part') {
  setType(t: 'All' | 'Labour' | 'Part') {
    this.lineType = t;
    this.page = 1;
    this.search();
  }

  onSearch() { this.page = 1; this.search(); }

  search() {
    if (this.fromDate > this.toDate) {
      alert('From Date cannot be greater than To Date.');
      return;
    }
    this.loading = true;
    this.svc.getReport(this.buildReq()).subscribe({
      next: res => {
        this.rows = res.data ?? [];
        this.totalCount = res.totalRecords ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.rows = [];
        this.totalCount = 0;
        alert('Failed to load data. Please try again.');
      }
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.search();
  }

  onPageSizeChange() { this.page = 1; this.search(); }

  exportExcel() {
    this.exporting = true;
    this.svc.download(this.buildReq()).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `LineOrder_${this.lineType}_${this.fromDate}_${this.toDate}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
        alert('Failed to download Excel. Please try again.');
      }
    });
  }
}