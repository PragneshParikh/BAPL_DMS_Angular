// src\app\components\extended-battery-warranty\extended-battery-warranty-list\extended-battery-warranty-list.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExtendedBatteryWarrantyService } from '../../../core/services/extended-battery-warranty';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { DurationTypes, RateTypes } from '../../../constant';
import { GetDurationTypePipe } from '../../../core/pipes/get-duration-type-pipe';
import { GetRateTypePipe } from '../../../core/pipes/get-rate-type-pipe';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-extended-battery-warranty-list',
  imports: [
    SharedModule,
    RouterOutlet,
    NgbTooltipModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPaginationModule,
    GetDurationTypePipe,
    GetRateTypePipe
  ],
  templateUrl: './extended-battery-warranty-list.html',
  styleUrl: './extended-battery-warranty-list.scss',
})
export class ExtendedBatteryWarrantyList implements OnInit {
  durationTypes = DurationTypes;
  rateTypes = RateTypes;

  readonly SUBMENU_ID = 37;
  canCreate = false;
  canDownload = false;

  searchTerm: string = '';

  dataSource: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  //#region sorting variables
  sortColumn: string = 'schemeName';
  sortDirection: boolean = true; // false for ascending, true for descending
  //#endregion

  constructor(
    private router: Router,
    private extendedBatteryWarrantyServie: ExtendedBatteryWarrantyService,
    private loader: LoaderService,
    private toast: ToastService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    this.getExtendedBatteryWarrantyList();
  }

  getExtendedBatteryWarrantyList() {
    this.loader.show();
    this.extendedBatteryWarrantyServie.getByPaged(this.searchTerm, this.page - 1, this.pageSize).subscribe({
      next: (res) => {
        this.loader.hide();
        this.dataSource = res.data
        this.collectionSize = res.totalRecords
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);;
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  newScheme() {
    this.router.navigate(['/extended-battery-warranty', 0]);
  }

  onSearchChange() {
    this.page = 1; // Reset to first page on new search
    this.getExtendedBatteryWarrantyList();
  }

  onSort(column: string) {

    if (this.sortColumn !== column) {
      // new column clicked → default ascending
      this.sortColumn = column;
      this.sortDirection = false; // false = ascending
    } else {
      // same column clicked → toggle
      this.sortDirection = !this.sortDirection;
    }

    // Sort the full dataSource
    this.dataSource.sort((a: any, b: any) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection ? 1 : -1;
      if (valueA > valueB) return this.sortDirection ? -1 : 1;
      return 0;
    });

    // Reset to first page to show sorted items
    this.page = 1;
    this.getExtendedBatteryWarrantyList();
  }

  onSchemeClick(scheme: any) {
    this.router.navigate(['/extended-battery-warranty', scheme.id]);
  }

  onPageChange(page: number) {
    this.page = page;
    this.getExtendedBatteryWarrantyList();
  }

  downloadExcel() {
    this.loader.show();

    this.extendedBatteryWarrantyServie.downloadExcel().subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const downloadURL = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = 'ExtendedBatteryWarrantyList.xlsx';

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadURL);
      },
      error: (err) => {
        console.error(err);
        this.toast.show('Failed to download file', { classname: 'bg-danger text-white', delay: 5000 });
      },
      complete: () => {
        this.loader.hide();
      }
    });
  }

}