import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FFIRSearchModel } from '../../../ViewModels/FFIRSearchModel';
import { privateDecrypt } from 'crypto';
import { StorageService } from '../../../core/services/storage';
import { FFIRService } from '../../../core/services/ffirservice';
import { Router } from '@angular/router';
import { NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ffirlisting',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbTooltip, NgbPaginationModule],
  templateUrl: './ffirlisting.html',
  styleUrl: './ffirlisting.scss',
})
export class Ffirlisting {

  FFIRList: any[] = [];
  searchTimeout: any;

  // PAGINATION
  page = 1;
  pageSize = 10;
  collectionSize: number = 0;
  pagedData: any[] = [];
  filteredData: any[] = [];

  constructor(
    private storageService: StorageService,
    private FFIRService: FFIRService,
    private router: Router
  ) { }

  searchModel: FFIRSearchModel = {
    dealerCode: '',
    fromDate: '',
    toDate: '',
    cirNo: null,
    jobNo: null,
    customerName: ''
  };

  ngOnInit(): void {

    const today = new Date();

    // Current month first date
    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.searchModel.fromDate = this.formatDate(firstDayOfMonth);
    this.searchModel.toDate = this.formatDate(today);
    this.loadFFIRList();

  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  loadFFIRList() {

    const dealerCode = this.storageService.getDealerCode();

    this.FFIRService
      .getFFIRDetailListing(dealerCode, '')
      .subscribe({

        next: (res: any[]) => {

          this.FFIRList = res;

          // pagination data
          this.filteredData = [...res];

          this.collectionSize = this.filteredData.length;

          this.refreshTable();

        },

        error: (err) => {

          console.error('Error fetching FFIR list', err);

        }

      });
  }

  search() {

    const dealerCode = this.storageService.getDealerCode();

    const searchText = `
      ${this.searchModel.cirNo || ''}
      ${this.searchModel.jobNo || ''}
      ${this.searchModel.customerName || ''}
    `.trim();

    this.FFIRService
      .getFFIRDetailListing(dealerCode, searchText)
      .subscribe({

        next: (res: any[]) => {

          let data = [...res];

          // FROM DATE
          if (this.searchModel.fromDate) {

            const from = new Date(this.searchModel.fromDate);

            data = data.filter((x: any) =>
              new Date(x.jobDate) >= from
            );
          }

          // TO DATE
          if (this.searchModel.toDate) {

            const to = new Date(this.searchModel.toDate);

            to.setHours(23, 59, 59, 999);

            data = data.filter((x: any) =>
              new Date(x.jobDate) <= to
            );
          }

          // CIR NO
          if (this.searchModel.cirNo) {

            data = data.filter((x: any) =>
              x.cirNo == this.searchModel.cirNo
            );
          }

          // JOB NO
          if (this.searchModel.jobNo) {

            data = data.filter((x: any) =>
              x.jobNo == this.searchModel.jobNo
            );
          }

          // CUSTOMER NAME
          if (this.searchModel.customerName) {

            data = data.filter((x: any) =>
              x.customerName?.toLowerCase()
                .includes(this.searchModel.customerName.toLowerCase())
            );
          }

          this.filteredData = data;

          this.collectionSize = data.length;

          this.page = 1;

          this.refreshTable();

        },

        error: (err) => {

          console.error('Search error', err);

        }

      });
  }

  onSearchChange() {

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {

      this.search();

    }, 500);

  }

  onNavigate() {

    this.router.navigate(['/ffir']);

  }

  // PAGINATION
  pageChange(event: any) {

    this.page = Number(event);

    this.refreshTable();

  }

  refreshTable() {

    const start = (this.page - 1) * this.pageSize;

    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);

  }

  onFFIREdit(item: any) {

    this.router.navigate(['/ffir'], {
      queryParams: {
        id: item.id
      }
    });
  }

}
