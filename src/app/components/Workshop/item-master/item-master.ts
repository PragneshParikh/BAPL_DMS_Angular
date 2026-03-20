import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { NgbHighlight, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../../core/services/loader';

@Component({
  selector: 'app-item-master',
  standalone: true,
  imports: [CommonModule, NgbHighlight, NgbPaginationModule],
  templateUrl: './item-master.html',
  styleUrl: './item-master.scss',
})
export class ItemMaster implements OnInit {

  griddata: any[] = [];
  filteredData: any[] = [];
  pagedData: any[] = [];

  searchTerm: string = '';
  selectedItem: any;

  // pagination
  page = 1;
  pageSize = 5;
  collectionSize = 0;

  // sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  groupId = 1; // static group id

  constructor(
    private itemService: ItemMasterService,
    private loader: LoaderService,
    private modalService: NgbModal
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

        console.log(this.griddata);
      },
      error: (err) => {
        console.log(err);
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
    this.selectedItem = item;
    this.modalService.open(modal, { size: 'xl' });
  }

}