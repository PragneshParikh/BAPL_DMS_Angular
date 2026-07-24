import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDropdown, NgbDropdownModule, NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { RepairBillSearchModel } from '../../../ViewModels/RepairBillModel';
import { StorageService } from '../../../core/services/storage';
import { RepairBillService } from '../../../core/services/repair-bill-service';
import { LocationName } from '../../../ViewModels/ReceiptEntryModel';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { LoaderService } from '../../../core/services/loader';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repair-bill-list',
  imports: [FormsModule, CommonModule, NgbTooltip, NgbPagination,NgbDropdownModule],
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
  isSuperAdmin: boolean;

  private searchTimeout: any;
  dealerCode: string;
  role: string;

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

     
       this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
  
      if (!this.isSuperAdmin) {
        this.dealerCode = this.storageService.getDealerCode();
       
      } else {
         this.dealerCode = null;
         this.role = this.storageService.getRole();
         console.log(this.isSuperAdmin);
        
      }

    const today = new Date();

    // Current month first date
    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.repairbillsearchModel.fromDate = this.formatDate(firstDayOfMonth);
    this.repairbillsearchModel.toDate = this.formatDate(today);
    this.fetchLocations();
    this.search();
  }

  
  // Dealer Locations
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => { this.locations = data; },
      error: (err) => { console.error('Error fetching locations', err); }
    });
  }

   formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Search Delay
  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.search(); }, 500);
  }

  search(): void {
    debugger;
    const payload = {
      locationCode: this.repairbillsearchModel.serviceLocation || null,
      billNo:       this.repairbillsearchModel.billNo           || null,
      jobNo:        this.repairbillsearchModel.jobNo            || null,
      chassisNo:    this.repairbillsearchModel.chassisNo        || null,
      dateFrom:     this.repairbillsearchModel.fromDate         || null,
      dateTo:       this.repairbillsearchModel.toDate           || null
    };

    this.loader.show();
    this.repairBillService.getAllRepairBillList(payload).subscribe({
      next: (res: any[]) => {
        this.repairBillList = res;
        this.filteredData   = [...res];
        console.log("edit item",this.filteredData)
        this.collectionSize = this.filteredData.length;
        this.loader.hide();
        this.refreshTable();
      },
      error: (err) => {
        console.error('Repair Bill Search Error', err);
        this.loader.hide();
        this.repairBillList  = [];
        this.filteredData    = [];
        this.pagedData       = [];
        this.collectionSize  = 0;
      }
    });
  }

  clearSearch(): void {
    this.repairbillsearchModel = {
      dealerCode: '', fromDate: '', toDate: '',
      serviceLocation: '', jobNo: null, billNo: null, chassisNo: ''
    };
    this.search();
  }

  pageChange(page: number): void {
    this.page = page;
    this.refreshTable();
  }

  refreshTable(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
  }

  onNavigate(): void {
    this.router.navigate(['/repair-bill']);
  }

  editRepairBill(item: any): void {
    
    this.router.navigate(['/repair-bill', item.id]);
  }
  deleteRepairbill(id: number) {
      console.log('Delete Id:', id);
       this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
  
      if (!this.isSuperAdmin) {
        this.dealerCode = this.storageService.getDealerCode();
       
      } else {
         this.dealerCode = null;
         this.role = this.storageService.getRole();
         console.log(this.isSuperAdmin);
        
      }
      //const dealerCode = this.storageService.getDealerCode();
      Swal.fire({
        title: 'Are you sure?',
        text: 'You will not be able to recover this RepairBill!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        width: '350px'
      }).then((result) => {
  
        if (result.isConfirmed) {
  
          this.repairBillService.deleteRepairbill(id,this.role).subscribe({
            next: (res: any) => {
  
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Repair Bill deleted successfully',
                width: '350px'
              });
  
              //  Refresh list
              this.router.navigate(['/repair-bill-list']);
  
            },
            error: (err) => {
              console.error(err);
  
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err?.error || 'Delete failed',
                width: '300px'
              });
            }
          });
  
        }
      });
    }
  printInvoice(item: any): void {
    this.router.navigate(['/repair-bill-invoice', item.id]);
  }
}