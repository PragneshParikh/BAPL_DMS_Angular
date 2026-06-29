import { Component, OnInit } from '@angular/core';
import { HsrpService } from '../../core/services/hsrp-service';
import { StorageService } from '../../core/services/storage';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { PrefixService } from '../../core/services/prefix';
import { log } from 'console';

@Component({
  selector: 'app-hsrp-order',
  imports: [CommonModule, NgbModule, FormsModule, FlatpickrModule],
  templateUrl: './hsrp-order.html',
  styleUrl: './hsrp-order.scss',
  providers: [FlatpickrDefaults, FlatpickrModule],
})
export class HSRPOrder implements OnInit {
  selectedType: string = "order";
  selectAll = false;

  model = {
    orderNo: '',
    orderDate: new Date().toISOString().substring(0, 10),
    supplierLedgerId: ''
  };

  isSuperAdmin = false;
  isEditMode = false;

  orders: any[] = [];
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];

  searchTerm = '';
  page = 1;
  pageSize = 10;

  filter = {
    fromDate: null,
    toDate: null
  };

  Suppliers: any[] = [];
  isIndeterminate = false;
  orderId: string;

  constructor(
    private hsrpService: HsrpService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private toasterService: ToastService,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private prefixService: PrefixService
  ) { }

  async ngOnInit() {

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);

    this.filter = {
      fromDate: last7Days,
      toDate: today
    };
    this.orderId = this.route.snapshot.paramMap.get('id');

    this.isSuperAdmin =
      this.storageService.getRole()?.toLowerCase() === 'superadmin';

    if (this.orderId) {
      this.isEditMode = true;

      // edit mode
      await this.getSupplierList();
      this.loadOrderForEdit(this.orderId);

    } else {

      // create mode
      this.generateNewOrderNo();
      this.getSupplierList();
      this.getPendingHSRPOrder();
    }
  }

  // ---------------- SUPPLIER ----------------
  getSupplierList() {
    this.ledgerService.getLedgerByType('supplier').subscribe(res => {
      this.Suppliers = res || [];
      if (!this.isEditMode) {
        this.model.supplierLedgerId = this.Suppliers[0].id;
      }

      // if (this.isEditMode && this.orders.length > 0) {
      //   this.model.supplierLedgerId = this.orders[0].supplierLedgerId;
      // }

      // default for create mode
      // if (!this.orderId && this.Suppliers.length > 0) {
      //   this.model.supplierLedgerId = this.Suppliers[0].ledgerId;
      // }
    });
  }

  // ---------------- NEW ORDER NO ----------------
  generateNewOrderNo() {
    const dealerCode = this.storageService.getDealerCode();

    this.prefixService
      .getPrefixByDealerByModule(dealerCode, 'hsrp_order')
      .subscribe({
        next: (res: string) => {
          this.model.orderNo = res;
        },
        error: (err) => {
          console.error('Error fetching prefix:', err);
        }
      });
  }
  onFilterChange() {
    this.getPendingHSRPOrder();
  }

  onTypeChange() {
    if (this.selectedType === "inward") {
      this.router.navigate(['/hsrp-inward']);
    }
  }
  // ---------------- LIST ----------------
  getPendingHSRPOrder(): void {

    let dealerCode = '';

    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }

    this.hsrpService.getPendingHSRPOrders(dealerCode, this.formatDate(this.filter.fromDate), this.formatDate(this.filter.toDate)).subscribe({
      next: (res: any) => {
        console.log(res);
        
        this.orders = (res || []).map(item => ({
          ...item,
          isFrontPlate: item.isFrontPlate ?? true,
          isRearPlate: item.isRearPlate ?? true
        }));

        this.filteredOrders = [...this.orders];
        this.updatePagination();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;

    const d = new Date(date);
    return d.toISOString().split('T')[0]; // yyyy-MM-dd
  }

  // ---------------- EDIT ----------------
  loadOrderForEdit(id: any) {
    this.hsrpService.getHSRPById(id).subscribe({
      next: (res: any) => {

        this.orders = Array.isArray(res) ? res : [res];
        this.filteredOrders = [...this.orders];

        if (this.orders.length > 0) {
          const first = this.orders[0];

          // order no (fallback if empty)
          this.model.orderNo = first.orderNo || this.model.orderNo;

          this.model.orderDate = first.orderDate
            ? new Date(first.orderDate).toISOString().substring(0, 10)
            : '';

          // supplier
          this.model.supplierLedgerId = first.supplierLedgerId;
        }

        this.updatePagination();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  // ---------------- SEARCH ----------------
  onSearchChange(): void {

    const term = this.searchTerm.toLowerCase();

    this.filteredOrders = this.orders.filter(x =>
      x.saleBillNo?.toLowerCase().includes(term) ||
      x.customerName?.toLowerCase().includes(term) ||
      x.chassisNo?.toLowerCase().includes(term) ||
      x.regNo?.toLowerCase().includes(term) ||
      x.invoiceNo?.toLowerCase().includes(term) ||
      x.supplierName?.toLowerCase().includes(term) ||
      x.orderNo?.toLowerCase().includes(term) ||
      x.hsrpstatus?.toLowerCase().includes(term) ||
      x.colour?.toLowerCase().includes(term) ||
      x.customerMobile?.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }

  // ---------------- PAGINATION ----------------
  onPageChange(page: number): void {
    this.page = page;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(start, end);
  }

  // ---------------- SELECT ----------------
  toggleSelectAll() {
    this.paginatedOrders.forEach(item => {
      item.selected = this.selectAll;
    });
    this.isIndeterminate = false;
  }

  onRowSelectionChange() {
    const selectedCount = this.paginatedOrders.filter(x => x.selected).length;

    this.selectAll = selectedCount === this.paginatedOrders.length;
    this.isIndeterminate =
      selectedCount > 0 && selectedCount < this.paginatedOrders.length;
  }

  // ---------------- SAVE ----------------
  submitHSRPOrder() {

    let hasError = false;

    this.paginatedOrders.forEach(item => {
      if (item.selected &&
        (item.isFrontPlate == null || item.isRearPlate == null)) {
        item.hasError = true;
        hasError = true;
      } else {
        item.hasError = false;
      }
    });

    if (hasError) {
      this.toasterService.show('Please complete plate selection for highlighted rows.', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    const dealerCode = this.storageService.getDealerCode();
    const selectedItems = this.paginatedOrders.filter(x => x.selected);

    const missingRegistration = selectedItems.filter(x => !x.regNo || x.regNo.trim() === '');
    if (missingRegistration.length > 0) {
      const chassisList = selectedItems.filter(x => !x.regNo || x.regNo.trim() === '').map(x => x.chassisNo);
      this.toasterService.show(`Registration number is missing for chassis: ${chassisList.join(', ')}`, {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    if (selectedItems.length === 0) {
      this.toasterService.show('Please select atleast one row', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    const payload = selectedItems.map(item => ({
      id: item.id ?? null,
      dealerCode: dealerCode,
      chassisNo: item.chassisNo,
      customerName:item.customerName,
      regNo: item.regNo,
      invoiceNo: item.invoiceNo,
      isFrontPlate: item.isFrontPlate,
      isRearPlate: item.isRearPlate,
      isTlpsticker: false,
      customerLedgerId: item.customerLedgerId,
      saleBillDetailsId: item.saleBillDeailsId,
      saleBillNo: item.saleBillNo,
      supplierLedgerId: this.model.supplierLedgerId,
      orderDate: this.model.orderDate,
      orderNo: this.model.orderNo
    }));
    if (this.isEditMode) {
      this.hsrpService.updateBulkHSRPOrder(payload).subscribe({
        next: () => {
          this.toasterService.show('HSRP Order Saved', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getPendingHSRPOrder();
        },
        error: () => {
          this.toasterService.show('Error saving order', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
    }
    else {

      this.hsrpService.createBulkHSRPOrder(payload).subscribe({
        next: () => {
          this.toasterService.show('HSRP Order Saved', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getPendingHSRPOrder();
        },
        error: () => {
          this.toasterService.show('Error saving order', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
    }
  }

  hasSelection(): boolean {
    return this.filteredOrders.some(x => x.selected);
  }

  navigateToListingPage() {
    this.router.navigate(['/hsrp-order-list']);
  }
}