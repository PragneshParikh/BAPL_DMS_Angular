import { Component, OnInit } from '@angular/core';
import { HsrpService } from '../../../core/services/hsrp-service';
import { StorageService } from '../../../core/services/storage';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Route, Router } from '@angular/router';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-hsrp-inward',
  imports: [CommonModule, NgbModule, FormsModule, FlatpickrModule],
  templateUrl: './hsrp-inward.html',
  styleUrl: './hsrp-inward.scss',
  providers: [FlatpickrDefaults, FlatpickrModule],

})
export class HsrpInward implements OnInit {
  isSuperAdmin: boolean = false;

  filter: {
    fromDate: Date | null;
    toDate: Date | null;
  } = {
      fromDate: null,
      toDate: null
    };

  selectedType: string = 'inward';
  searchTerm: string = '';

  orders: any[] = [];
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];
  // selectedType:string="order";

  page: number = 1;
  pageSize: number = 10;

  constructor(
    private hsrpService: HsrpService,
    private storageService: StorageService,
    private router: Router,private toasterService: ToastService
    
  ) { }

  ngOnInit(): void {

    this.isSuperAdmin =
      this.storageService.getRole()?.toLowerCase() === 'superadmin';

    const today = new Date();
    const last7 = new Date();
    last7.setDate(today.getDate() - 7);

    this.filter = {
      fromDate: last7,
      toDate: today
    };

    this.getInwardList();
  }

  getInwardList(): void {

    const dealerCode = this.storageService.getDealerCode();

    const fromDate = this.formatDate(this.filter.fromDate);
    const toDate = this.formatDate(this.filter.toDate);

    this.hsrpService.getHSRPInward(dealerCode, fromDate, toDate)
      .subscribe({
        next: (res: any) => {
console.log('HSRP Inward List:', res);
          this.orders = (res || []).map((x: any) => ({
            ...x
          }));

          this.filteredOrders = [...this.orders];
          this.page = 1;
          this.updatePagination();
        },
        error: (err) => console.error(err)
      });
  }

  formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;

    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  updatePagination(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(start, end);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePagination();
  }

  onFilterChange(): void {
    this.getInwardList();
  }

  // onTypeChange(): void {
  //   if (this.selectedType === 'order') {
  //     this.router.navigate(['/hsrp-order-list']);
  //   }
  // }
  onTypeChange() {
    if (this.selectedType === "order") {
      this.router.navigate(['/hsrp-order']);
    }
  }

  navigateToListingPage() {
    this.router.navigate(['/hsrp-order-list']);
  }
 get isSaveDisabled(): boolean {
  const selectedItems = this.paginatedOrders.filter(x => x.selected);

  return (
    selectedItems.length === 0 ||
    selectedItems.some(x => x.inwardStatus !== 'Received')
  );
}
  onSearchChange(): void {

    const term = this.searchTerm.toLowerCase();

    this.filteredOrders = this.orders.filter(x =>
      x.saleBillNo?.toLowerCase().includes(term) ||
      x.chassisNo?.toLowerCase().includes(term) ||
      x.regNo?.toLowerCase().includes(term) ||
      x.invoiceNo?.toLowerCase().includes(term) ||
      x.customerName?.toLowerCase().includes(term) ||
      x.supplierName?.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }
  // submitHSRPInward() {

  //   const selectedItems = this.orders.filter(x => x.selected);

  //   const payload = selectedItems.map(x => ({
  //     id: x.id,
  //     inwardStatus: x.inwardStatus
  //   }));

  //   this.hsrpService.updateBulkHSRPInward(payload).subscribe({
  //     next: (res) => {
  //       this.getInwardList(); // refresh
  //     },
  //     error: (err) => {
  //       console.error(err);
  //     }
  //   });
  // }

  submitHSRPInward() {

  const selectedItems = this.orders.filter(x => x.selected);

  if (selectedItems.length === 0) {
    this.toasterService.show('Please select atleast one row', {
      classname: 'bg-warning text-white',
      delay: 5000
    });
    return;
  }

  const payload = selectedItems.map(x => ({
    id: x.id,
    inwardStatus: x.inwardStatus
  }));

  this.hsrpService.updateBulkHSRPInward(payload).subscribe({
    next: (res: any[]) => {

      const failedOrder = res.find(x =>
        x.inwardStatus === 'Failed' ||
        x.inwardStatus === '0'
      );

      if (failedOrder) {
        this.toasterService.show(
          failedOrder.inwardResponse || 'HSRP Inward Failed',
          {
            classname: 'bg-danger text-white',
            delay: 5000
          }
        );
      } else {
        this.toasterService.show('HSRP Inward Successful', {
          classname: 'bg-success text-white',
          delay: 5000
        });
      }

      this.getInwardList();
    },
    error: (err) => {
      console.error(err);

      this.toasterService.show('Error while processing HSRP Inward', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
    }
  });
}
}