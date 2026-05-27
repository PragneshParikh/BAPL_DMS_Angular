import { Component, OnInit } from '@angular/core';
import { HsrpService } from '../../../core/services/hsrp-service';
import { StorageService } from '../../../core/services/storage';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Route, Router } from '@angular/router';

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
    private router: Router
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

          this.orders = (res || []).map((x: any) => ({
            ...x
          }));

          this.filteredOrders = [...this.orders];
          this.page = 1;
          this.updatePagination();
        },
        error: (err) => console.log(err)
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
  submitHSRPInward() {

    const selectedItems = this.orders.filter(x => x.selected);

    const payload = selectedItems.map(x => ({
      id: x.id,
      inwardStatus: x.inwardStatus
    }));

    this.hsrpService.updateBulkHSRPInward(payload).subscribe({
      next: (res) => {
        console.log('Saved successfully', res);
        this.getInwardList(); // refresh
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}