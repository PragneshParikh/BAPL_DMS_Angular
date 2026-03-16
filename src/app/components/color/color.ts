import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ColorMasterService } from '../../core/services/color-master.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbAccordionModule, NgbDropdownModule, NgbModal, NgbOffcanvas, NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginationService } from '../../core/services/pagination.service';
import { RootReducerState } from '../../store';
import { Store } from '@ngrx/store';
import { SharedModule } from '../../shared/shared.module';
import { error } from 'console';

@Component({
  selector: 'app-color',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbTooltipModule,
    NgbDropdownModule,
    NgbAccordionModule,
    SharedModule],
  providers: [DatePipe],
  templateUrl: './color.html',
  styleUrl: './color.scss',
})
export class Color implements OnInit {
  searchTerm: string = '';
  dataSource: any[] = [];
  rowData: any = {};

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

  /**
   *
   */
  constructor(private colorMasterService: ColorMasterService,
    private modalService: NgbModal,
    public service: PaginationService) {
  }

  ngOnInit(): void {
    this.loadColorData();
  }
  loadColorData() {
    this.colorMasterService.getColorByPaged(this.searchTerm, this.page - 1, this.pageSize).subscribe({
      next: (res: any) => {
        this.pagedData = [];
        this.collectionSize = 0;

        if (res) {
          this.pagedData = res.data;
          this.collectionSize = res.totalRecords;

        }
      }, error: (err) => {
        console.error(err);
      }

    });
  }
  onRowDoubleClick(RowDataModel: any, data: any) {

    // clear the exising data
    this.rowData = {};

    // bind the data to the model
    this.rowData = data;

    // open the modal
    this.modalService.open(RowDataModel, { scrollable: true });
  }
  refreshData() {
    this.pagedData = this.dataSource.slice(
      (this.page - 1) * this.pageSize,
      (this.page) * this.pageSize
    );
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
  onPageChange(page: number) {
    this.page = page;
    this.loadColorData();
  }
  onSearch() {
    this.page = 1; // Reset to first page on new search
    this.loadColorData();
  }

  downloadColorExcel() {

    this.colorMasterService.getExcelDownload().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const downloadURL = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'ColorList.xlsx';

      link.click();

      window.URL.revokeObjectURL(downloadURL);

    });

  }
}
