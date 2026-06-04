import { Component, OnInit } from '@angular/core';
import { HsrpService } from '../../../core/services/hsrp-service';
import { StorageService } from '../../../core/services/storage';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hsrporder-list',
  imports: [CommonModule, NgbModule, FormsModule, FlatpickrModule],
  templateUrl: './hsrporder-list.html',
  styleUrl: './hsrporder-list.scss',
  providers: [FlatpickrDefaults, FlatpickrModule],
})
export class HSRPOrderList implements OnInit { 
filter:{
  fromDate:Date,
  toDate:Date
};
  isSuperAdmin: boolean = false;

  orders: any[] = [];
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];

  searchTerm: string = '';

  page: number = 1;
  pageSize: number = 10;

  // selection
  selectAll: boolean = false;
  isIndeterminate: boolean = false;

  constructor(
    private hsrpService: HsrpService,
    private storageService: StorageService,
    private router:Router
  ) {}

  ngOnInit(): void {
    const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(today.getDate() - 7);

  this.filter = {
    fromDate: last7Days,
    toDate: today
  };
    this.getHSRPOrders();
  }

  getHSRPOrders(): void {

    let dealerCode = '';

    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }

    this.hsrpService.getAllHSRPOrders(dealerCode, this.formatDate(this.filter.fromDate), this.formatDate(this.filter.toDate)).subscribe({
      next: (res: any) => {


        

        this.orders = (res || []).map((x: any) => ({
          ...x,
          isFrontPlate: x.isFrontPlate ?? false,
          isRearPlate: x.isRearPlate ?? false,
          selected: false
        }));

        this.filteredOrders = [...this.orders];

        this.page = 1;
        this.updatePagination();
      },
      error: (err) => console.log(err)
    });
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

  // SEARCH
  onSearchChange(): void {

    const term = this.searchTerm.toLowerCase();

    this.filteredOrders = this.orders.filter(x =>
      x.saleBillNo?.toLowerCase().includes(term) ||
      x.chassisNo?.toLowerCase().includes(term) ||
      x.regNo?.toLowerCase().includes(term) ||
      x.invoiceNo?.toLowerCase().includes(term) ||
      x.hsrpstatus?.toLowerCase().includes(term)||
      x.customerName?.toLowerCase().includes(term)||
      x.supplierName?.toLowerCase().includes(term)||
      x.orderNo?.toLowerCase().includes(term)||
      x.colour?.toLowerCase().includes(term)||
      x.customerMobile?.toLowerCase().includes(term)||
      x.hsrpResponse?.toLowerCase().includes(term)||
      x.inwardStatus?.toLowerCase().includes(term)||
      x.inwardResponse?.toLowerCase().includes(term)||
      x.supplierName?.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }

  // SELECT ALL
  toggleSelectAll(): void {
    this.filteredOrders.forEach(x => x.selected = this.selectAll);
    this.isIndeterminate = false;
  }

  formatDate(date: Date | null): string | undefined {
  if (!date) return undefined;

  const d = new Date(date);
  return d.toISOString().split('T')[0]; 
}

  // ROW SELECT
  onRowSelectionChange(): void {

    const selectedCount = this.filteredOrders.filter(x => x.selected).length;

    this.selectAll = selectedCount === this.filteredOrders.length;
    this.isIndeterminate = selectedCount > 0 && !this.selectAll;
  }

  hasSelection(): boolean {
    return this.filteredOrders.some(x => x.selected);
  }

 goToDetails(item: any) {
  
  this.router.navigate(['/hsrp-order', item.id]);
}

navigateToAdd(){
  this.router.navigate(['/hsrp-order']);
}
onFilterChange() {
  this.getHSRPOrders();
}

downloadHSRPExcel(){
  this.isSuperAdmin = this.storageService.getRole() === 'SuperAdmin';
  const dealerCode =  this.storageService.getDealerCode();
  
  this.hsrpService.downloadHSRPExcel(this.isSuperAdmin, dealerCode, this.filter.fromDate, this.filter.toDate)
  .subscribe((response: Blob) => {

  const blob = new Blob([response], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'HSRPList.xlsx';
  a.click();

  window.URL.revokeObjectURL(url);
});
}
}
