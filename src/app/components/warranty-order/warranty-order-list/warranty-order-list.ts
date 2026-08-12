import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { WarrantyOrderService } from '../../../core/services/warranty-order-service';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-warranty-order-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-order-list.html',
  styleUrl: './warranty-order-list.scss',
})
export class WarrantyOrderList implements OnInit {

  orders: any[] = [];
  supplierList: any[] = [];
  locationList: any[] = [];

  totalCount: number = 0;
  totalPages: number = 0;

  // Tracks which order row is currently expanded (only one at a time) and
  // its fetched claim details, keyed by order id. GetWarrantyOrderById is
  // called lazily on expand rather than bloating SearchWarrantyOrders'
  // response with full claim/line data for every row on every page load.
  expandedOrderId: number | null = null;
  claimsByOrderId: { [orderId: number]: any[] } = {};
  loadingDetailsForOrderId: number | null = null;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    batchNo: '',
    orderNo: '',
    location: null,
    claimType: '',
    supplierId: null,
    isApproved: true,   // approved orders only - unapproved (freshly auto-saved) orders stay hidden until Save is clicked with a checkbox checked
    pageNumber: 1,
    pageSize: 25
  };

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private locationService: LocationMasterService,
    private warrantyOrderService: WarrantyOrderService
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadLocations();
    this.search();
  }

  loadSuppliers(): void {
    this.ledgerService.getCompanyLedgers().subscribe({
      next: (res: any) => this.supplierList = res,
      error: (err) => console.error(err)
    });
  }

  loadLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (res: any) => this.locationList = res,
      error: (err) => console.error(err)
    });
  }

  search(): void {
    this.loader.show();
    // isApproved: true is always enforced regardless of the dropdown -
    // this page only ever shows confirmed/approved orders. An auto-saved
    // order that hasn't had its checkbox checked + Save clicked yet stays
    // correctly invisible here.
    // dateFrom/dateTo must be null (not '') when empty - an empty string
    // fails to deserialize as DateTime? on the backend and takes down the
    // whole request body, not just that one field.
    const payload = {
      ...this.filter,
      dateFrom: this.filter.dateFrom || null,
      dateTo: this.filter.dateTo || null,
      isApproved: true
    };

    this.warrantyOrderService.searchWarrantyOrders(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.orders = res?.items || [];
        this.totalCount = res?.totalCount || 0;
        this.totalPages = res?.totalPages || 0;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Orders.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetFilter(): void {
    this.filter = {
      dateFrom: '', dateTo: '', batchNo: '', orderNo: '',
      location: null, claimType: '', supplierId: null,
      isApproved: true, pageNumber: 1, pageSize: 25
    };
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.pageNumber = page;
    this.search();
  }

  view(id: number): void {
    // No /warranty-order/edit/:id route exists (single flat route by design) -
    // same sessionStorage handoff pattern already used for the claim redirect.
    sessionStorage.setItem('viewWarrantyOrderId', String(id));
    this.router.navigate(['/warranty-order']);
  }

  // Expands/collapses the claim-details panel for a row (double-click still
  // opens the full form via view() - this is for viewing details inline
  // without leaving the list). Fetches once per order id and caches it.
  toggleExpand(orderId: number): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
      return;
    }

    this.expandedOrderId = orderId;

    if (this.claimsByOrderId[orderId]) {
      return; // already fetched earlier in this session
    }

    this.loadingDetailsForOrderId = orderId;
    this.warrantyOrderService.getWarrantyOrderById(orderId).subscribe({
      next: (res: any) => {
        this.loadingDetailsForOrderId = null;
        this.claimsByOrderId[orderId] = res?.claims || [];
      },
      error: (err) => {
        this.loadingDetailsForOrderId = null;
        console.error(err);
        this.toaster.show('Failed to load claim details for this order.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  deleteOrder(id: number, event: Event): void {
    // Prevent this click from also bubbling up as the row's dblclick
    // navigation or interfering with the adjacent expand toggle.
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this Warranty Order? This cannot be undone from this screen.')) {
      return;
    }

    this.loader.show();
    this.warrantyOrderService.deleteWarrantyOrder(id).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Order deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });

        // Remove locally for immediate feedback instead of a full re-search.
        this.orders = this.orders.filter(o => o.id !== id);
        this.totalCount = Math.max(0, this.totalCount - 1);

        if (this.expandedOrderId === id) {
          this.expandedOrderId = null;
        }
        delete this.claimsByOrderId[id];
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to delete the Warranty Order.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  back(): void {
    this.router.navigate(['/warranty-order']);
  }
}