import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehicleStockTransferService } from '../../../core/services/vehicle-stock-transfer-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { StorageService } from '../../../core/services/storage';
import { Router, RouterOutlet } from '@angular/router';
import { FlatpickrModule } from 'angularx-flatpickr';
import { NgbHighlight, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-vehicle-stock-transfer-list',
  imports: [CommonModule, FormsModule, NgbHighlight, NgbPaginationModule, FlatpickrModule, RouterOutlet, NgbTooltipModule],
  templateUrl: './vehicle-stock-transfer-list.html',
  styleUrl: './vehicle-stock-transfer-list.scss',
})
export class VehicleStockTransferList implements OnInit {

  transferList: any[] = [];
  filteredTransfers: any[] = [];
  paginatedTransfers: any[] = [];
  locationList: any[] = [];
  searchTerm = '';
  page = 1;
  pageSize = 10;
  filter = {
    fromDate: '',
    toDate: '',
    receivingLocation: '',
    issuingLocation: ''
  };
  selectedTransfer: any;
  expandedTransfer: any;

  constructor(
    private vehicleStockTransferService: VehicleStockTransferService,
    private locationMasterService: LocationMasterService,
    private storageService: StorageService,
    private router: Router,
    private loader: LoaderService,
    private toaster:ToastService
  ) { }

  ngOnInit(): void {
    this.getLocations();
    this.loadTransfers();
  }

  getLocations() {

    const dealerCode = this.storageService.getDealerCode();

    this.locationMasterService.getLocationList(dealerCode)
      .subscribe({
        next: (data) => {
          this.locationList = data;
        }
      });
  }

  loadTransfers() {
    this.loader.show();
    this.vehicleStockTransferService.getVehicleStockTransferList(this.filter)
      .subscribe({
        next: (data) => {
          this.transferList = data;
          this.filteredTransfers = data;
          this.updatePagination();
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          console.error('Error fetching transfer list', err);
          this.toaster.show('Error fetching list',{
            classname:'bg-danger text-white',
            delay:5000
          });
        },
        complete: () => {
        }
      });
  }

  onSearch() {

    this.loadTransfers();
    this.page = 1;
    this.updatePagination();
  }

  onSearchChange() {
    const term = this.searchTerm.toLowerCase();
    this.filteredTransfers = this.transferList.filter(x => JSON.stringify(x).toLowerCase().includes(term));
    this.page = 1;
    this.updatePagination();
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTransfers = this.filteredTransfers.slice(start, end);
  }

  navigateToAddTransfer() {
    this.router.navigate(['/add-vehicle-stock-transfer']);
  }

  editTransfer(item: any) {
    this.router.navigate(['/vehicle-stock-transfer/edit', item.id]);
  }

  downloadExcel() {
this.loader.show();
    const fromDate = this.filter.fromDate ? new Date(this.filter.fromDate) : undefined;
    const toDate = this.filter.toDate ? new Date(this.filter.toDate) : undefined;
    this.vehicleStockTransferService.downloadExcel(fromDate, toDate, this.filter.issuingLocation, this.filter.receivingLocation, this.searchTerm)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'TransferStock.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          console.error('Excel download failed', err);
          alert('Failed to download Excel');
        }
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.expandedTransfer = null;
  }

  toggleChassis(item: any, event: Event) {
    event.stopPropagation();

    this.expandedTransfer = this.expandedTransfer === item ? null : item;
  }
  closePopup() {
    this.expandedTransfer = null;
  }
}


