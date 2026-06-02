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
import { debounceTime, Subject } from 'rxjs';
import { BillingTypeOptions, ErpOptions } from '../../constant';
import { DealerService } from '../../core/services/dealer-service';
import { StorageService } from '../../core/services/storage';

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
  ErpOptions = ErpOptions;

  sortDirection: { [key: string]: boolean } = {};
  searchText: string = '';
  page = 1;
  pageSize = 10;
  sortField: string = '';

  filter: any = {
    fromDate: null,
    toDate: null,
    status: ""
  };
  searchChanged: Subject<string> = new Subject();
  isSuperAdmin: boolean;
  dealerCode: string;
  billingTypeOptions = BillingTypeOptions;

  constructor(private service: VehicleSaleBillService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService) { }

  ngOnInit() {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    const today = new Date();
    const sevenDaysBefore = new Date(today);
    sevenDaysBefore.setDate(today.getDate() - 7);
    this.filter.fromDate = sevenDaysBefore;
    this.filter.toDate = today;
    this.searchChanged.pipe(debounceTime(400)).subscribe(() => {
      this.loadData();
    });
    this.loadData();

  }


  loadData() {
    this.loader.show();
    this.page = 1;
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService ? this.storageService.getDealerCode() : '';
    }
    const from = this.filter.fromDate ? new Date(this.filter.fromDate) : undefined;

    const to = this.filter.toDate ? new Date(this.filter.toDate) : undefined;
    const Status = this.filter.Status ? this.filter.Status : undefined;

    this.service.getAllVehicleSaleBills(this.dealerCode, this.searchText, from, to, Status)
      .subscribe({
        next: (res) => {
          this.vehicleBills = res;
          this.filteredBills = [...this.vehicleBills];
          this.updatePagination();
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();

          this.toaster.show('Failed to fetch list', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

          console.error(err);
        }
      });
  }
  // SEARCH
  onSearchChange() {
    this.searchChanged.next(this.searchText);
  }

  // FILTER BUTTON
  onSearch() {
    this.loadData(); // call API with date filters

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

      // handle computed column
      if (field === 'totalItems') {
        valA = a.details?.length || 0;
        valB = b.details?.length || 0;
      }
      else {
        valA = a[field];
        valB = b[field];
      }

      // handle null/undefined
      if (valA == null) valA = '';
      if (valB == null) valB = '';

      // numeric vs string handling
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
    this.router.navigate(['/vehicle-sale-bill/edit/' + item.id], {
      state: { bill: item }
    });
  }

  getStatusName(value: string | undefined): string {
    console.log('Getting status name for value:', value);
    return ErpOptions.find(x => x.value === value)?.name || '';
  }

  downloadDealerExcel(): void {
    this.loader.show();

    const from = this.filter.fromDate
      ? new Date(this.filter.fromDate)
      : undefined;

    const to = this.filter.toDate
      ? new Date(this.filter.toDate)
      : undefined;

    this.loader.show();

    this.service.downloadExcel(from, to).subscribe({
      next: (data: Blob) => {

        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'SaleBillList.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);

        this.loader.hide();

        this.toaster.show(
          'Excel downloaded successfully',
          {
            classname: 'bg-success text-light',
            delay: 3000
          }
        );
      },
      error: () => {
        this.loader.hide();
      }
    });
  }
  getBillingTypeName(id: number): string {
    return this.billingTypeOptions.find(x => x.id === id)?.value ?? '';
  }
}
