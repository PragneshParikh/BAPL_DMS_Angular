import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PO_STATUSES, TRANSACTION_TYPES } from '../../constant';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { PurchaseService } from '../../core/services/purchase-service';

@Component({
  selector: 'app-parts-po-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './parts-po-list.html',
  styleUrl: './parts-po-list.scss',
})
export class PartsPoList implements OnInit {
  poStatuses = PO_STATUSES;

  poFilterData: any = {
    purchaseNo: '',
    dateTo: '',
    dateFrom: '',
    isSubmitted: false,
  }

  // partyName: string = '';
  // transactionType: string = '';
  // transactionTypeList = TRANSACTION_TYPES;

  // purchaseOrders: any[] = [];
  // originalPurchaseOrders: any[] = [];
  pagedPurchaseOrders: any[] = [];

  isSuperAdmin: boolean;
  dealerCode: any;

  page = 1;
  pageSize = 10;
  totalRecords = 0;

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toastr: ToastService,
    private purchaseService: PurchaseService,
    private storageService: StorageService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.initDefaultDates();
  }

  ngOnInit() {
    this.loadPOList();
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    this.poFilterData.dateTo = to.toISOString().split('T')[0];
    this.poFilterData.dateFrom = from.toISOString().split('T')[0];
  }

  loadPOList() {
    this.loader.show();
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
    this.purchaseService.getPOList('Spares', this.dealerCode, this.page, this.pageSize, this.poFilterData).subscribe({
      next: (res: any) => {
        this.loader.hide();
        // const flattened = this.flattenPOList(res);
        // this.originalPurchaseOrders = flattened;
        // this.originalPurchaseOrders = res;
        // this.onSearch();
        this.pagedPurchaseOrders = res.data;
        this.totalRecords = res.totalRecords;
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching Parts PO list:', err);
        this.toastr.show('Failed to load Parts PO list', { classname: 'bg-danger text-white', delay: 5000 });
      }
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
            purchaseNo: po.poNumber || po.ponumber,
            date: this.formatDate(po.poDate || po.podate),
            rawDate: new Date(po.poDate || po.podate),
            transactionType: po.transactionType || '',
            isSubmitted: po.isSubmitted ? 'Submited To Erp' : 'Not Submited To Erp',
            partyName: "BGAUSS AUTO PRIVATE LIMITED",
            partNo: item.itemCode,
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB').replace(/\//g, '-');
  }

  editPO(po: any) {

    const poNumber = po?.poNumber || '0';

    const value = Date.now() + '|' + poNumber;

    const encPO = btoa(value);

    this.router.navigate(['/parts-po', encPO]);
  }

  // onSearch() {
  //   let filtered = this.originalPurchaseOrders;
  //   if (this.purchaseNo) filtered = filtered.filter(x => x.purchaseNo?.toLowerCase().includes(this.purchaseNo.toLowerCase()));
  //   if (this.partyName) filtered = filtered.filter(x => x.partyName?.toLowerCase().includes(this.partyName.toLowerCase()));
  //   if (this.transactionType) filtered = filtered.filter(x => x.transactionType === this.transactionType);
  //   if (this.isSubmitted) filtered = filtered.filter(x => x.isSubmitted === this.isSubmitted);
  //   if (this.dateFrom && this.dateTo) {
  //     const from = new Date(this.dateFrom);
  //     from.setHours(0, 0, 0, 0);
  //     const to = new Date(this.dateTo);
  //     to.setHours(23, 59, 59, 999);
  //     filtered = filtered.filter(x => x.rawDate >= from && x.rawDate <= to);
  //   }
  //   // this.purchaseOrders = filtered;
  //   this.totalRecords = this.purchaseOrders.length;
  //   // this.loadPage();
  // }

  // loadPage() {
  //   const start = (this.page - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.pagedPurchaseOrders = this.pagedPurchaseOrders.slice(start, end);
  // }

  pageChange(page: number) {
    this.page = page;
    this.loadPOList();
  }

  sortColumn = 'rawDate';
  sortDirection = 'desc';

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // this.onSearch();
  }

  downloadPurchaseOrderExcel() {
    this.loader.show();
    const filters = {
      purchaseNo: this.poFilterData.purchaseNo,
      dateFrom: this.poFilterData.dateFrom,
      dateTo: this.poFilterData.dateTo,
      // transactionType: this.transactionType,
      isSubmitted: this.poFilterData.isSubmitted
    };

    this.purchaseService.downloadPurchaseOrderExcel(filters).subscribe({
      next: (response: Blob) => {
        this.loader.hide();
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'VehiclePurchaseOrders.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.show('Excel downloaded successfully', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.loader.hide();
        console.error('Excel Download Error:', err);
        this.toastr.show('Excel download failed', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  resetFilters() {
    // this.purchaseNo = '';
    // this.partyName = '';
    // this.transactionType = '';
    // this.isSubmitted = '';

    this.poFilterData = {
      purchaseNo: '',
      dateTo: '',
      dateFrom: '',
      isSubmitted: false
    }
    this.initDefaultDates();
    // this.onSearch();
  }
}