import { Component, NgModule } from '@angular/core';
import { VehicleSaleBillService } from '../../core/services/vehicle-sale-bill-service';
import { VehicleSaleBillResponseViewModel } from '../../ViewModels/VehicleSaleBill';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbHighlight, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Router, RouterOutlet } from '@angular/router';
import { log } from 'console';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-vehicle-sale-bill',
  imports: [CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule,
    FlatpickrModule,
    RouterOutlet,
    NgbTooltipModule
  ],
  templateUrl: './vehicle-sale-bill.html',
  styleUrl: './vehicle-sale-bill.scss',
  providers: [FlatpickrDefaults, FlatpickrModule],
})
export class VehicleSaleBill {
  vehicleBills: VehicleSaleBillResponseViewModel[] = [];
  filteredBills: VehicleSaleBillResponseViewModel[] = [];
  paginatedBills: VehicleSaleBillResponseViewModel[] = [];
  selectedBill: VehicleSaleBillResponseViewModel | null = null;
  searchTerm: string = '';
  sortDirection: { [key: string]: boolean } = {};

  page = 1;
  pageSize = 10;
  sortField: string = '';

  filter: any = {
    fromDate: null,
    toDate: null
  };

  constructor(private service: VehicleSaleBillService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loader.show();

    this.service.getAllVehicleSaleBills().subscribe({
      next: (res) => {
        this.vehicleBills = res;
        this.filteredBills = [...this.vehicleBills];
        this.updatePagination();
        this.loader.hide();
      },

      error: (err) => {
        this.loader.hide();

        this.toaster.show('Failed to fetch list', {
          classname: 'bg-warning text-white',
          delay: 5000
        });

        console.error(err);
      }
    });
  }

  // SEARCH
  onSearchChange() {
    const term = this.searchTerm.toLowerCase();

    this.filteredBills = this.vehicleBills.filter(x =>
      x.saleBillNo.toLowerCase().includes(term) ||
      x.customerName.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }

  // FILTER BUTTON
  onSearch() {
    this.filteredBills = this.vehicleBills.filter(x => {
      return true; // add date filter if needed
    });

    this.page = 1;
    this.updatePagination();
  }

  // PAGINATION
  updatePagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBills = this.filteredBills.slice(start, end);
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePagination();
  }




  onSort(field: string) {
    this.sortField = field;

    // toggle direction
    this.sortDirection[field] = !this.sortDirection[field];
    const dir = this.sortDirection[field] ? 1 : -1;

    this.filteredBills.sort((a: any, b: any) => {

      let valA: any;
      let valB: any;

      // ✅ handle computed column
      if (field === 'totalItems') {
        valA = a.details?.length || 0;
        valB = b.details?.length || 0;
      }
      else {
        valA = a[field];
        valB = b[field];
      }

      // ✅ handle null/undefined
      if (valA == null) valA = '';
      if (valB == null) valB = '';

      // ✅ numeric vs string handling
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }

      return valA.toString().localeCompare(valB.toString()) * dir;
    });

    this.updatePagination();
  }

  navigateToAdd() {
    this.router.navigate(['/vehicle-sale-bill/add']);
  }
  viewDetails(item: any) {
    console.log(item);

    this.router.navigate(['/vehicle-sale-bill/edit/' + item.id], {
      state: { bill: item }
    });
  }
}
