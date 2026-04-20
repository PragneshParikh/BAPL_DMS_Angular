import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbAccordionModule, NgbDropdownModule, NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import {CityService} from '../../core/services/city';
import { City, CityTableModel } from '../../ViewModels/City';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-city-master',
   imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbTooltipModule,
    NgbDropdownModule,
    NgbAccordionModule,
    SharedModule,
    NgbTooltipModule
  ],
  templateUrl: './city-master.html',
  styleUrl: './city-master.scss',
})
export class CityMaster {
  /**
   *
   */
  constructor(private router: Router,
    private cityService:CityService,
    private  loader: LoaderService,
    private toaster:ToastService,
     private modalService: NgbModal, ) {
    
  }
 searchTerm: string = '';

  fullList: CityTableModel[] = [];        // all data
  filteredList: CityTableModel[] = [];    // after search
  paginatedList: CityTableModel[] = [];   // current page data

  page: number = 1;
  pageSize: number = 10;

  rowData: CityTableModel | null = null;

  sortField: string = '';
  sortAsc: boolean = true;
  edit: boolean;

  ngOnInit() {
    this.loadData();
  }

  //    SAMPLE DATA (Replace with API later)
loadData() {
  this.loader.show();
  this.cityService.getAllWithState().subscribe({
    next: (res) => {

      this.fullList = res.map((x: any) => ({
        id: x.cityId,
        countryname: 'India',
        statename: x.stateName ?? 'N/A',
        cityname: x.cityName,
        abbreviation: x.abbreviation,
        active: x.isActive ?? false
      }));

      this.filteredList = [...this.fullList];
      this.refreshData();
      this.loader.hide();
    },
    error: (err) => {
      console.error('Error loading cities:', err);
    }
  });
}

  //    SEARCH
  onSearch() {
    const term = this.searchTerm.toLowerCase();

    this.filteredList = this.fullList.filter(item =>
      item.countryname?.toLowerCase().includes(term) ||
      item.statename?.toLowerCase().includes(term) ||
      item.cityname?.toLowerCase().includes(term) ||
      item.abbreviation?.toLowerCase().includes(term)
    );

    this.page = 1;
    this.refreshData();
  }

  //    SORT
  sort(field: string) {

    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }

    this.filteredList.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.refreshData();
  }

  //    PAGINATION
  refreshData() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedList = this.filteredList.slice(start, end);
  }

  onPageChange(page: number) {
    this.page = page;
    this.refreshData();
  }

  //    ROW CLICK
  editRow(item: CityTableModel, content: any) {
  this.rowData = item;
  this.modalService.open(content, {
    size: 'lg',
    backdrop: 'static',
    centered: true
  });
}

  // (Optional Modal Version)
  onRowDoubleClick(modal: any, data: any) {
    this.rowData = data;
    modal.open();
  }

  //    EXPORT (Basic Placeholder)
  downloadCityExcel() {
    this.loader.show();
    this.cityService.downloadExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'CityMasterList.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);
      this.loader.hide();
      this.toaster.show('Dealer Excel downloaded successfully', { classname: 'bg-success text-light', delay: 3000 });
    }); 
  }
  openAddModal(){
    this.router.navigate(['city-master/add']);
  }
goToEdit(cityId: number) {
  this.router.navigate(['city-master/edit', cityId]);
}
}
