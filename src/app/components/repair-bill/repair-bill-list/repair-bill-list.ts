import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { RepairBillSearchModel } from '../../../ViewModels/RepairBillModel';
import { StorageService } from '../../../core/services/storage';
import { RepairBillService } from '../../../core/services/repair-bill-service';
import { LocationName } from '../../../ViewModels/ReceiptEntryModel';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { LoaderService } from '../../../core/services/loader';

@Component({
  selector: 'app-repair-bill-list',
  imports: [FormsModule, CommonModule, NgbTooltip, NgbPagination],
  templateUrl: './repair-bill-list.html',
  styleUrl: './repair-bill-list.scss',
})
export class RepairBillList implements OnInit {

  locations: LocationName[] = [];

  repairBillList: any[] = [];
  chassisList: any[] = [];

  filteredData: any[] = [];
  pagedData: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;
  isSuperAdmin: boolean = false;

  private searchTimeout: any;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private repairBillService: RepairBillService,
    private toaster: ToastService,
    private locationService: LocationMasterService,
    private loader: LoaderService
  ) { }

  repairbillsearchModel: RepairBillSearchModel = {
    dealerCode: '',
    fromDate: '',
    toDate: '',
    serviceLocation: '',
    jobNo: null,
    billNo: null,
    chassisNo: ''
  };

  ngOnInit(): void {
    this.fetchLocations();
    this.search();
  }

  // Dealer Locations
  fetchLocations(): void {

    const dealerCode = this.storageService.getDealerCode();

    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }

  // Search Delay
  onSearchChange(): void {

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.search();
    }, 500);

  }

  // Search Repair Bill
  search(): void {

    const payload = {

      locationCode:
        this.repairbillsearchModel.serviceLocation || null,

      billNo:
        this.repairbillsearchModel.billNo || null,

      jobNo:
        this.repairbillsearchModel.jobNo || null,

      chassisNo:
        this.repairbillsearchModel.chassisNo || null,

      dateFrom:
        this.repairbillsearchModel.fromDate || null,

      dateTo:
        this.repairbillsearchModel.toDate || null
    };

    this.loader.show();
    this.repairBillService
      .getAllRepairBillList(payload)
      .subscribe({

        next: (res: any[]) => {

          this.repairBillList = res;
          console.log(this.repairBillList)

          this.filteredData = [...res];

          this.collectionSize = this.filteredData.length;
          this.loader.hide();
          this.refreshTable();
        },

        error: (err) => {

          console.error('Repair Bill Search Error', err);
          this.loader.hide();
          this.repairBillList = [];
          this.filteredData = [];
          this.pagedData = [];
          this.collectionSize = 0;
        }
      });
  }

  clearSearch(): void {

    this.repairbillsearchModel = {
      dealerCode: '',
      fromDate: '',
      toDate: '',
      serviceLocation: '',
      jobNo: null,
      billNo: null,
      chassisNo: ''
    };

    this.search();
  }

  // Pagination
  pageChange(page: number): void {

    this.page = page;

    this.refreshTable();
  }

  refreshTable(): void {

    const start = (this.page - 1) * this.pageSize;

    const end = start + this.pageSize;

    this.pagedData =
      this.filteredData.slice(start, end);
  }

  // Add Repair Bill
  onNavigate(): void {

    this.router.navigate(['/repair-bill']);
  }

  // Edit Repair Bill
  editRepairBill(item: any): void {
    debugger
    // if (!this.isSuperAdmin) {

    //   this.toaster.show('Only SuperAdmin can be Update.', {
    //       classname: 'bg-warning text-dark',
    //       icons: 'Warning',
    //       delay: 5000
    //     });

    //   return;
    // }
    if (item.repairBillStatus === 'Billed') {

      this.toaster.show('Invoiced Repair Bill cannot be edited.', {
        classname: 'bg-warning text-dark',
        delay: 3000
      });

      return;
    }

    this.router.navigate(['/repair-bill', item.id]);
  }
}