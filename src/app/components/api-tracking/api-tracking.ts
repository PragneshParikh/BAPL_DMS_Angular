// src\app\components\api-tracking\api-tracking.ts
import { Component, OnInit } from '@angular/core';
import { ApiTrackingService } from '../../core/services/api-tracking.Service';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { FlatpickrModule, FlatpickrDefaults } from 'angularx-flatpickr';
import { NgbAccordionModule, NgbDropdownModule, NgbModal, NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { nextTick } from 'process';
import { error } from 'console';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { APIUniqueList } from '../../constant';
import { MenuAccessService } from '../../core/services/menu-access.service';

@Component({
  selector: 'app-api-tracking',
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    FlatpickrModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbTooltipModule,
    NgbDropdownModule,
    NgbAccordionModule
  ],
  providers: [FlatpickrDefaults],
  templateUrl: './api-tracking.html',
  styleUrl: './api-tracking.scss',
})
export class ApiTracking implements OnInit {
  apiUniques = APIUniqueList;
  dataSource: any[] = [];
  searchTerm: string = '';
  jsonString: any = '';

  readonly SUBMENU_ID = 7;
  canDownload = false;

  selectedEndPoint: string = '';
  selectedStatus: string = '';
  searchCriteria: string = '';
  dateRange: { from: Date; to: Date } = {
    from: new Date(new Date().setDate(new Date().getDate() - 15)),
    to: new Date()
  }; // This will hold [fromDate, toDate]

  //#region sorting variables
  sortColumn: string = 'colorname';
  sortDirection: boolean = true; // false for ascending, true for descending
  //#endregion

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  pagedData: any[] = [];
  // #endregion

  constructor(
    private apiTrackingService: ApiTrackingService,
    private modalService: NgbModal,
    private loader: LoaderService,
    public toaster: ToastService,
    private menuAccess: MenuAccessService
  ) {
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit() {
    this.dataSource = [];
  }

  refreshData() {
    this.pagedData = this.dataSource.slice(
      (this.page - 1) * this.pageSize,
      (this.page) * this.pageSize
    );
  }

  filterdRecords() {
    if (!this.dateRange || !this.dateRange.from || !this.dateRange.to) return;

    const endPoint = this.selectedEndPoint; // optional
    const fromDate = new Date(this.dateRange.from);
    const toDate = new Date(this.dateRange.to);
    const status = this.selectedStatus; // optional
    const searchCriteria = this.searchCriteria; // optional

    this.loader.show();
    this.apiTrackingService.getDataByFilter(fromDate, toDate, endPoint, searchCriteria, status).subscribe({
      next: (res: any) => {
        this.dataSource = res.map((item: any, index: number) => {
          return { ...item, srno: index + 1 };
        });
        this.collectionSize = res.length;
        this.refreshData();
        this.loader.hide();
      }, error: (err) => {
        console.error(err);
        this.loader.hide();

        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }

    });

  }

  openPayload(RowPayloadModel: any, data: any) {
    this.jsonString = '';
    this.jsonString = JSON.stringify(JSON.parse(data), null, 2);
    this.modalService.open(RowPayloadModel, { centered: true });
  }

  sortData(column: string) {

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
    this.refreshData();
  }

  downloadApiTrackingExcel() {

    this.apiTrackingService.getExcelDownload().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const downloadURL = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'ApiTrackingList.xlsx';

      link.click();

      window.URL.revokeObjectURL(downloadURL);

    });

  }
}
