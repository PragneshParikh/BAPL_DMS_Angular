import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { VehiclePoListService } from '../../core/services/vehicle-po-list-service';
import { TRANSACTION_TYPES } from '../../constant';

@Component({
  selector: 'app-vehicle-po-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule],
  templateUrl: './vehicle-po-list.html',
  styleUrl: './vehicle-po-list.scss',
})
export class VehiclePoList implements OnInit {
  purchaseNo: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  partyName: string = '';
  transactionType: string = '';
  isSubmitted: string = '';

  transactionTypeList = TRANSACTION_TYPES;

  purchaseOrders: any[] = [];
  originalPurchaseOrders: any[] = [];
  pagedPurchaseOrders: any[] = [];

  page = 1;
  pageSize = 10;
  totalRecords = 0;

  constructor(
    private router: Router,
    private poListService: VehiclePoListService
  ) { }

  ngOnInit() {
    this.loadPOList();
  }

  loadPOList() {
    this.poListService.getPOList().subscribe({
      next: (res: any[]) => {
        console.log('PO List res:', res);
        const flattened = this.flattenPOList(res);
        this.originalPurchaseOrders = flattened;
        this.purchaseOrders = flattened;
        this.totalRecords = this.purchaseOrders.length;
        this.loadPage();
      },
      error: (err) => console.error('Error fetching PO list:', err)
    });
  }

  flattenPOList(res: any[]): any[] {
    const flattened: any[] = [];
    let sNo = 1;
    res.forEach(po => {
      if (po.items && po.items.length > 0) {
        po.items.forEach((item: any) => {
          flattened.push({
            sNo: sNo++,
            prefixNo: '',
            purchaseNo: po.poNumber || po.ponumber,
            date: this.formatDate(po.poDate || po.podate),
            rawDate: new Date(po.poDate || po.podate),
            transactionType: po.TransactionType || po.transactionType || '',
            isSubmitted: po.isSubmitted || po.IsSubmitted || po.Status === 'Submitted' ? 'Submited To Erp' : 'Not Submited To Erp',
            // partyName: po.customerCode,
            partyName: "BGAUSS AUTO PRIVATE LIMITED",
            location: '',
            modelName: item.itemCode,
            color: '',
            orderQty: item.qty,
            orderAmount: item.lineAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
          });
        });
      }
    });
    return flattened;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
    } catch {
      return dateStr;
    }
  }

  redirectToCreatePO() {
    this.router.navigate(['/vehicle-po']);
  }

  editPO(po: any) {
    const poNumber = po.purchaseNo || po.PONumber;
    if (poNumber) {
      this.router.navigate(['/vehicle-po', poNumber]);
    }
  }

  onSearch() {
    let filtered = this.originalPurchaseOrders;

    if (this.purchaseNo) {
      filtered = filtered.filter(x => x.purchaseNo?.toLowerCase().includes(this.purchaseNo.toLowerCase()));
    }

    if (this.partyName) {
      filtered = filtered.filter(x => x.partyName?.toLowerCase().includes(this.partyName.toLowerCase()));
    }

    if (this.transactionType) {
      filtered = filtered.filter(x => x.transactionType === this.transactionType);
    }

    if (this.isSubmitted) {
      filtered = filtered.filter(x => x.isSubmitted === this.isSubmitted);
    }

    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(x => x.rawDate >= from && x.rawDate <= to);
    }

    this.purchaseOrders = filtered;
    this.page = 1;
    this.totalRecords = this.purchaseOrders.length;
    this.loadPage();
  }

  loadPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedPurchaseOrders = this.purchaseOrders.slice(start, end);
  }

  refreshPage() {
    this.loadPage();
  }

  // ================= SORT =================
  sortColumn = '';
  sortDirection = 'asc';

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.purchaseOrders.sort((a: any, b: any) => {
      let valueA = a[column] || '';
      let valueB = b[column] || '';

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.loadPage();
  }

  getSortClass(column: string) {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  }
}

