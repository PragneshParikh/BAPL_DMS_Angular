import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  HistoricalJobReportService,
  HistoricalJobReportRequest
} from '../../../core/services/historical-job-report';

interface Col {
  key: string;
  label: string;
  type?: 'date' | 'num' | 'int';
}

@Component({
  selector: 'app-historical-job-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historical-job-report.html',
  styleUrl: './historical-job-report.scss'
})
export class HistoricalJobReport implements OnInit {
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
    { key: 'dealerLocation', label: 'Dealer Location' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'jobNo', label: 'Job No' },
    { key: 'jobDate', label: 'Job Date', type: 'date' },
    { key: 'jobEndDate', label: 'Job End Date', type: 'date' },
    { key: 'jobType', label: 'Job Type' },
    { key: 'serviceHead', label: 'Service Head' },
    { key: 'serviceType', label: 'Service Type' },
    { key: 'jobStatus', label: 'Job Status' },
    { key: 'kms', label: 'Kms', type: 'int' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'mobileNo', label: 'Mobile No' },
    { key: 'chassisNo', label: 'Chassis No' },
    { key: 'regNo', label: 'Reg No' },
    { key: 'engineNo', label: 'Engine No' },
    { key: 'brandName', label: 'Brand' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'customerVoice', label: 'Customer Voice' },
    { key: 'complaintCode', label: 'Complaint Code' },
    { key: 'observation', label: 'Observation' },
    { key: 'supervisorComment', label: 'Supervisor Comment' },
    { key: 'batteryNo', label: 'Battery No' },
    { key: 'chargerNo', label: 'Charger No' },
    { key: 'saleDate', label: 'Sale Date', type: 'date' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'technician', label: 'Technician' },
    { key: 'createdThrough', label: 'Created Through' },
    { key: 'action', label: 'Action' }
  ];

  constructor(private svc: HistoricalJobReportService) {}

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

  private buildReq(): HistoricalJobReportRequest {
    return {
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
      return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // if (col.type === 'int') {
    //   return Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    // }
    if (col.type === 'int') {
      const n = Number(v);
      return Number.isNaN(n) ? String(v ?? '') : n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    return String(v);
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
        a.download = `JobReport_${this.fromDate}_${this.toDate}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
        alert('Failed to download Excel. Please narrow the date range (max 100,000 rows) and try again.'); }
    });
  }
}