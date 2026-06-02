import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../../core/services/loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DurationTypes } from '../../../constant';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-item-master',
  imports: [CommonModule, NgbHighlight, NgbPaginationModule, NgbTooltipModule, ReactiveFormsModule, FormsModule],
  templateUrl: './item-master.html',
  styleUrl: './item-master.scss',
})
export class ItemMaster implements OnInit {

  durationTypes = DurationTypes;

  griddata: any[] = [];
  filteredData: any[] = [];
  pagedData: any[] = [];

  searchTerm: string = '';
  selectedItem: any;

  // pagination
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  // sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  groupId = 1; // static group id

  constructor(
    private itemService: ItemMasterService,
    private loader: LoaderService,
    private modalService: NgbModal,
    private toaster: ToastService,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.loadItems();
  }

  //  API CALL
  loadItems(search?: string) {
    this.loader.show();

    this.itemService.getItems(this.groupId, this.searchTerm).subscribe({
      next: (res: any) => {
        this.griddata = res;
        this.filteredData = [...this.griddata];
        this.collectionSize = this.filteredData.length;

        this.refreshTable();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }

    });

  }

  //  SEARCH
  searchItems(event: any) {

    this.searchTerm = event.target.value || '';
    this.loadItems(this.searchTerm);

  }

  // pagination
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }

  // download excel
  downloadItemMasterExcel() {

    this.itemService.downloadItemMasterExcel().subscribe((response: Blob) => {

      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'ItemMasterList.xlsx';

      link.click();

      window.URL.revokeObjectURL(url);

    });

  }

  // sorting
  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {

      let valueA = a[column];
      let valueB = b[column];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;

      return this.sortDirection === 'asc' ? result : -result;

    });

    this.page = 1;
    this.refreshTable();

  }

  refreshTable() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);

  }

  openDetails(modal: any, item: any) {
    this.selectedItem = {};
    this.selectedItem = item;
    this.modalService.open(modal, { size: 'xl' });
  }

  updateItem() {
    this.loader.show();
    this.selectedItem.updatedBy = this.storageService.getUserId();
    this.selectedItem.updatedDate = new Date();
    this.itemService.updateItem(this.selectedItem).subscribe({
      next: (res) => {
        this.loader.hide();
        this.loadItems();
        this.modalService.dismissAll();
        this.toaster.show('Item updated successfully', { classname: 'bg-success text-light', delay: 5000 });
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('something went wrong', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

}