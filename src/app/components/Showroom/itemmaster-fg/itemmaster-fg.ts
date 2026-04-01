import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LoaderService } from '../../../core/services/loader';
import { error } from 'console';
@Component({
  selector: 'app-itemmaster-fg',
  standalone: true,
  imports: [CommonModule, NgbHighlight, NgbPaginationModule,NgbTooltipModule],
  templateUrl: './itemmaster-fg.html',
  styleUrl: './itemmaster-fg.scss',
})
export class ItemmasterFG implements OnInit {
  griddata: any[] = [];
  filteredData: any[] = [];    // sorted data
  pagedData: any[] = [];
  selectedItem: any;      // data for current page
  searchTerm: string = '';

  // pagination
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  groupId = 6; // static group id
  // sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  // RxJS subject for auto-search
  private searchSubject: Subject<string> = new Subject();
  constructor(private itemService: ItemMasterService,
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
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }

    });

  }
  //  SEARCH FUNCTION

  searchItems(event: any) {

    this.searchTerm = event.target.value || '';
    this.loadItems(this.searchTerm);

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
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }
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

    this.page = 1;   // reset page after sorting
    this.refreshTable();
  }
  refreshTable() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);
  }

  openDetails(modal: any, item: any) {
    this.selectedItem = item;   // ✅ IMPORTANT
    this.modalService.open(modal, { size: 'xl' });
  }
}
