import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import '@angular/localize/init';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { locationAreaMaster } from '../../constant';
import { DealerService } from '../../core/services/dealer-service';

declare var bootstrap: any;

@Component({
  selector: 'app-location-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './location-master.html'
})

export class LocationMasterComponent implements OnInit {

  locationList: any[] = [];
  originalLocationList: any[] = [];
  dealerList: any[] = [];
  dealerCode: string = '';
  isDealer: boolean = false;
  locationArea: string = '';
  locationName: string = '';
  selectedLocation: any = {};
  pagedLocationList: any[] = [];
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  startIndex = 0;
  endIndex = 0;
  sortColumn = 'rrglocationidno';
  sortDirection = 'desc';

  constructor(
    private locationService: LocationMasterService,
    private dealerMasterService: DealerService,
    private loader: LoaderService,
    private storageService: StorageService,
    public toastr: ToastService) { }

  ngOnInit(): void {
    const storedDealerCode = this.storageService.getDealerCode();
    // Assuming if dealerCode is present and not 'admin', it's a dealer
    if (storedDealerCode && storedDealerCode.toLowerCase() !== 'admin') {
      this.isDealer = true;
      this.dealerCode = storedDealerCode;
    }

    this.loadLocations();
    this.loadDealerDropdown();
  }

  loadLocations() {
    this.loader.show();
    this.locationService.getAllLocationMaster().subscribe({
      next: (res: any) => {
        this.loader.hide();
        console.log(res);
        const data = res?.data || res;
        this.originalLocationList = data;

        if (this.isDealer && this.dealerCode) {
          this.locationList = data.filter((x: any) => x.dealercode == this.dealerCode);
        } else {
          this.locationList = data;
        }

        this.loadPage();// for pagination
        this.sort(this.sortColumn, true);
      },

      error: (err) => {
        this.loader.hide();
        console.log(err);
      }
    });
  }

  searchLocation() {
    let filtered = this.originalLocationList;

    // Safety: Always enforce dealer restriction if user is a dealer
    if (this.isDealer && this.dealerCode) {
      filtered = filtered.filter((x: any) => x.dealercode == this.dealerCode);
    } else if (this.dealerCode) {
      filtered = filtered.filter((x: any) => x.dealercode == this.dealerCode);
    }

    if (this.locationArea) {
      filtered = filtered.filter((x: any) =>
        x.locareaidno == this.locationArea
      );
    }

    if (this.locationName) {
      filtered = filtered.filter((x: any) =>
        x.locname?.toLowerCase().includes(this.locationName.toLowerCase())
      );
    }

    this.locationList = filtered;
    this.sort(this.sortColumn, true);
    this.page = 1;
    this.loadPage();
    // this.dealerCode = '';
    // this.locationArea = '';
    // this.locationName = '';
  }

  resetSearch() {
    if (this.isDealer) {
      // For dealers, reset only the non-dealer filters
      this.locationArea = '';
      this.locationName = '';
      this.locationList = this.originalLocationList.filter((x: any) => x.dealercode == this.dealerCode);
    } else {
      this.dealerCode = '';
      this.locationArea = '';
      this.locationName = '';
      this.locationList = this.originalLocationList;
    }
    this.page = 1;
    this.loadPage();
  }

  openEditModal(location: any) {
    this.selectedLocation = { ...location };
    const modal = new bootstrap.Modal(
      document.getElementById('editLocationModal') as HTMLElement
    );
    modal.show();
  }
  sort(column: string, isDefault: boolean = false) {
    if (!isDefault) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    }
    this.locationList.sort((a, b) => {
      let valueA = a[column] || '';
      let valueB = b[column] || '';
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.loadPage();
  }
  locationAreaMaster = locationAreaMaster;
  getLocationAreaName(id: number) {
    const area = this.locationAreaMaster.find(x => x.id == id);
    return area ? area.name : '';
  }

  loadPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.totalRecords = this.locationList.length;
    this.pagedLocationList = this.locationList.slice(start, end);
    this.startIndex = this.totalRecords === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.totalRecords);
  }

  getSortClass(column: string) {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc'
      ? 'sort-asc'
      : 'sort-desc';
  }

  checkSearchReset() {

    if (!this.dealerCode && !this.locationArea && !this.locationName) {
      if (this.isDealer && this.dealerCode) {
        this.locationList = this.originalLocationList.filter((x: any) => x.dealercode == this.dealerCode);
      } else {
        this.locationList = [...this.originalLocationList];
      }
      this.page = 1;
      this.loadPage();
    }

  }

  checkIfEmpty() {

    if (
      (!this.locationName || this.locationName.trim() === '') &&
      (!this.dealerCode || this.dealerCode === '') &&
      (!this.locationArea || this.locationArea === '')
    ) {

      this.page = 1;
      // full list show with dealer scope
      if (this.isDealer && this.dealerCode) {
        this.locationList = this.originalLocationList.filter((x: any) => x.dealercode == this.dealerCode);
      } else {
        this.locationList = [...this.originalLocationList];
      }
      this.pagedLocationList = [...this.locationList];
      this.loadPage();
    }

  }
  checkKeywordReset() {

    if (!this.locationName || this.locationName.trim() === '') {
      if (this.isDealer && this.dealerCode) {
        this.locationList = this.originalLocationList.filter((x: any) => x.dealercode == this.dealerCode);
      } else {
        this.locationList = [...this.originalLocationList];
      }
      this.page = 1;
      this.loadPage();

    }

  }
  loadDealerDropdown() {
    this.loader.show();
    this.dealerMasterService.getDealerDropdown().subscribe({
      next: (res: any) => {
        this.loader.hide();
        console.log("Dealer API Response:", res);
        const dealers = res?.data || res;

        if (this.isDealer && this.dealerCode) {
          this.dealerList = dealers.filter((d: any) => d.dealerCode == this.dealerCode);
        } else {
          this.dealerList = dealers;
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error("Dealer Dropdown Error:", err);
      }
    });
  }
  downloadLocationExcel() {
    this.loader.show();
    this.locationService.downloadLocationMasterExcel().subscribe({
      next: (response: Blob) => {
        this.loader.hide();
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'LocationMaster.xlsx';
        a.click();

        window.URL.revokeObjectURL(url);
        this.toastr.show('Excel downloaded successfully', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.loader.hide();
        console.log(err);
        this.toastr.show('Excel download failed', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }
}