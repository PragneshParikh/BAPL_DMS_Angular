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
  selector: 'app-vehicle-po-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './vehicle-po-list.html',
  styleUrl: './vehicle-po-list.scss',
})
export class VehiclePoList implements OnInit {
  poStatuses = PO_STATUSES;
  purchaseNo: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  partyName: string = '';
  transactionType: string = '';
  isSubmitted: string = '';

  transactionTypeList = TRANSACTION_TYPES;

  purchaseOrders: any[] = [];
  // originalPurchaseOrders: any[] = [];
  pagedPurchaseOrders: any[] = [];

  page = 1;
  pageSize = 10;
  totalRecords = 0;
  isSuperAdmin: boolean;
  dealerCode: any;

  poFilterField = {
    purchaseNo: '',
    dateFrom: '',
    dateTo: '',
    isSubmitted: ''
  }

  constructor(
    private router: Router,
    private purchaseService: PurchaseService,
    private loader: LoaderService,
    private toastr: ToastService,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.initDefaultDates();
    this.loadPOList();
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);

    // Format as YYYY-MM-DD for input type="date"
    this.poFilterField.dateTo = to.toISOString().split('T')[0];
    this.poFilterField.dateFrom = from.toISOString().split('T')[0];
  }

  loadPOList() {
    this.loader.show();
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
    this.purchaseService.getPOList('Vehicle', this.dealerCode, this.page, this.pageSize, this.poFilterField).subscribe({
      next: (res: any) => {
        this.loader.hide();
        const flattened = this.flattenPOList(res.data);
        // this.originalPurchaseOrders = flattened;
        this.pagedPurchaseOrders = flattened;
        this.totalRecords = res.totalRecords;
        // this.onSearch(); // Apply the default 7-day filter and sorting
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching PO list:', err);
      }
    });
  }

  flattenPOList(res: any[]): any[] {
    const flattened: any[] = [];
    let sNo = 1;
    res.forEach(po => {
      const items = po.items || po.PurchaseOrderDetails || [];
      if (items.length > 0) {
        // Calculate totals for all items in the PO
        let totalQty = 0;
        let totalAmount = 0;
        items.forEach((item: any) => {
          totalQty += Number(item.Qty || item.qty || 0);
          totalAmount += Number(item.LineAmount || item.lineAmount || 0);
        });

        const firstItem = items[0];
        let modelName = firstItem.ItemCode || firstItem.itemCode || '';

        flattened.push({
          sNo: sNo++,
          prefixNo: po.PrefixNo || po.prefixNo || '',
          purchaseNo: po.PONumber || po.poNumber || po.ponumber || '',
          date: this.formatDate(po.PODate || po.poDate || po.podate),
          rawDate: new Date(po.PODate || po.poDate || po.podate),
          transactionType: po.TransactionType || po.transactionType || '',
          isSubmitted: (po.IsSubmitted || po.isSubmitted || po.Status === 'Submitted' || po.status === true) ? 'Submited To Erp' : 'Not Submited To Erp',
          partyName: "BGAUSS AUTO PRIVATE LIMITED",
          location: po.LocationName || po.locationName || po.LocName || po.locName || po.LocCode || po.locCode || po.loccode || '',
          modelName: modelName,
          color: '',
          orderQty: totalQty,
          orderAmount: totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    // let filtered = this.originalPurchaseOrders;

    // if (this.purchaseNo) {
    //   filtered = filtered.filter(x => x.purchaseNo?.toLowerCase().includes(this.purchaseNo.toLowerCase()));
    // }

    // if (this.partyName) {
    //   filtered = filtered.filter(x => x.partyName?.toLowerCase().includes(this.partyName.toLowerCase()));
    // }

    // if (this.transactionType) {
    //   filtered = filtered.filter(x => x.transactionType === this.transactionType);
    // }

    // if (this.isSubmitted) {
    //   filtered = filtered.filter(x => x.isSubmitted === this.isSubmitted);
    // }

    // if (this.dateFrom && this.dateTo) {
    //   const from = new Date(this.dateFrom);
    //   from.setHours(0, 0, 0, 0);
    //   const to = new Date(this.dateTo);
    //   to.setHours(23, 59, 59, 999);
    //   filtered = filtered.filter(x => x.rawDate >= from && x.rawDate <= to);
    // }

    // this.purchaseOrders = filtered;
    // this.page = 1;
    // this.totalRecords = this.purchaseOrders.length;

    // // Maintain sort order after filtering
    // if (this.sortColumn) {
    //   this.purchaseOrders.sort((a: any, b: any) => {
    //     let valueA = a[this.sortColumn] || '';
    //     let valueB = b[this.sortColumn] || '';

    //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
    //     return 0;
    //   });
    // }

    // this.loadPage();
    this.page = 1;
    this.loadPOList();
  }

  // loadPage() {
  //   const start = (this.page - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.pagedPurchaseOrders = this.purchaseOrders.slice(start, end);
  // }

  refreshPage() {
    // this.loadPage();
    this.page = 1;
    this.loadPOList();
  }

  // ================= SORT =================
  sortColumn = 'rawDate';
  sortDirection = 'desc';

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.onSearch();
  }

  getSortClass(column: string) {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  }

  downloadPurchaseOrderExcel() {
    this.loader.show();
    const filters = {
      purchaseNo: this.purchaseNo,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      transactionType: this.transactionType,
      isSubmitted: this.isSubmitted,
      orderType: 'Vehicle',
      dealerCode: this.isSuperAdmin ? null : this.dealerCode
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
    this.poFilterField.purchaseNo = '';
    this.poFilterField.dateFrom = '';
    this.poFilterField.dateTo = '';
    this.poFilterField.isSubmitted = '';
    this.initDefaultDates();
    this.onSearch();
  }
}

