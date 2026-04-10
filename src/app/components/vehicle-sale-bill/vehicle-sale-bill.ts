import { Component, NgModule } from '@angular/core';
import { VehicleSaleBillService } from '../../core/services/vehicle-sale-bill-service';
import { VehicleSaleBillResponseViewModel } from '../../ViewModels/VehicleSaleBill';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbHighlight, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Router, RouterOutlet } from '@angular/router';
import { log } from 'console';

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

  page = 1;
  pageSize = 10;

  filter: any = {
    fromDate: null,
    toDate: null
  };

  constructor(private service: VehicleSaleBillService,  private router: Router) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.service.getAllVehicleSaleBills().subscribe({
      next: (res) => {
        console.log(res);
        
        this.vehicleBills = res;
        this.filteredBills = [...this.vehicleBills];
        this.updatePagination();
      },
      error: (err) => console.error(err)
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

  // SORT
  onSort(field: string) {
    this.filteredBills.sort((a: any, b: any) => {
      return (a[field] > b[field] ? 1 : -1);
    });
    this.updatePagination();
  }

  navigateToAdd() {
    this.router.navigate(['/vehicle-sale-bill/add']);
  }
 viewDetails(item: any) {
  console.log(item);
  
  this.router.navigate(['/vehicle-sale-bill/edit/' + item.id ], {
    state: { bill: item }
  });
}
}


