import { Component, OnInit } from '@angular/core';
import { LocationMasterService } from '../../core/services/location-master-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import '@angular/localize/init';

declare var bootstrap: any;

@Component({
  selector: 'app-location-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule],
  templateUrl: './location-master.html'
})

export class LocationMasterComponent implements OnInit {

  locationList: any[] = [];
  originalLocationList: any[] = [];
  dealerList: any[] = [];
  dealerCode: string = '';
  locationArea: string = '';
  locationName: string = '';
  selectedLocation: any = {};
  pagedLocationList: any[] = [];
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  startIndex = 0;
  endIndex = 0;
  sortColumn = '';
  sortDirection = 'asc';


  constructor(private locationService: LocationMasterService) { }

  ngOnInit(): void {
    this.loadLocations();
    this.loadDealerDropdown();
  }

  loadLocations() {
    this.locationService.getAllLocationMaster().subscribe({
      next: (res: any) => {
        console.log(res);
        this.locationList = res;
        this.originalLocationList = res;
        this.loadPage();// for pagination
      },

      error: (err) => {
        console.log(err);
      }
    });
  }

  searchLocation() {
    let filtered = this.originalLocationList;
    if (this.dealerCode) {
      filtered = filtered.filter((x: any) =>
        x.dealercode == this.dealerCode
      );
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
    this.page = 1;
    this.loadPage();
    // this.dealerCode = '';
    // this.locationArea = '';
    // this.locationName = '';
  }

  resetSearch() {

    this.dealerCode = '';
    this.locationArea = '';
    this.locationName = '';
    this.locationList = this.originalLocationList;
  }

  openEditModal(location: any) {
    this.selectedLocation = { ...location };
    const modal = new bootstrap.Modal(
      document.getElementById('editLocationModal') as HTMLElement
    );
    modal.show();
  }
  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
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
  locationAreaMaster = [
    { id: 1, name: 'Showroom' },
    { id: 2, name: 'Workshop' },
    { id: 3, name: 'Yard' }
  ];
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
      this.locationList = [...this.locationList];
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
      // full list show
      this.pagedLocationList = [...this.locationList];
      this.loadPage();
    }

  }
  checkKeywordReset() {

    if (!this.locationName || this.locationName.trim() === '') {
      this.locationList = [...this.originalLocationList];
      this.page = 1;
      this.loadPage();

    }

  }
  loadDealerDropdown() {
    this.locationService.getDealerDropdown().subscribe((res: any) => {
      console.log("Dealer API Response:", res);
      this.dealerList = res;
    });
  }
  downloadLocationExcel() {
    this.locationService.downloadLocationMasterExcel().subscribe({
      next: (response: Blob) => {

        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'LocationMaster.xlsx';
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }
}