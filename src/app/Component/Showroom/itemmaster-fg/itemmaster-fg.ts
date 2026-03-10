import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../services/item-master-service';
import { NgbHighlight, NgbModal,NgbPaginationModule  } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-itemmaster-fg',
  standalone : true,
  imports: [CommonModule, NgbHighlight,NgbPaginationModule ],
  templateUrl: './itemmaster-fg.html',
  styleUrl: './itemmaster-fg.scss',
})
export class ItemmasterFG {
griddata: any[] = [];
  filteredData: any[] = [];    // sorted data
  pagedData: any[] = [];       // data for current page
  searchTerm: any;

  // pagination
page = 1;
pageSize = 5;
collectionSize = 0;

// sorting
sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';
  constructor(private itemService: ItemMasterService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.itemService.getItems(6).subscribe((res: any) => {
      this.griddata = res;

      // initialize table
      this.filteredData = [...this.griddata];
      this.collectionSize = this.filteredData.length;

      this.refreshTable();

      console.log(this.griddata);
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
    this.searchTerm = item;
    this.modalService.open(modal, { size: 'xl' });
  }

}
