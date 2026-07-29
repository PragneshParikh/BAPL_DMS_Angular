import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPagination, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { StorageService } from '../../core/services/storage';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { DealerService } from '../../core/services/dealer-service';
import { InventoryService } from '../../core/services/inventory-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ItemMasterService } from '../../core/services/item-master-service';

@Component({
  selector: 'app-stock-summary-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbTooltipModule,
    NgbPagination,
    NgSelectModule
  ],
  templateUrl: './stock-summary-detail.html',
  styleUrl: './stock-summary-detail.scss',
})
export class StockSummaryDetail implements OnInit {

  stockFilterdFormData: any = {
    dateFrom: '',
    dateTo: '',
    dealerCode: '',
    itemCode: [] = []
  }

  page = 1;
  pageSize = 10;
  totalRecords = 0;

  isSuperAdmin: boolean = false;
  dealerCode: string = '';
  stockDetails: any[] = [];
  dealerList: any[] = [];
  partsList: any[] = [];

  selectAll: boolean = false;

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private toaster: ToastService,
    private dealerMasterService: DealerService,
    private inventoryService: InventoryService,
    private itemMasterService: ItemMasterService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.dealerCode = this.storageService.getDealerCode();
  }

  ngOnInit(): void {
    this.getDealerDropDown();
    this.getPartsList();
    this.initDefaultDates();
  }

  onSearch() {
    this.getDealerStockData();
  }

  downloadPurchaseOrderExcel() {
  }

  resetFilters() {
  }

  sort(column: string) {
  }

  pageChange(page) {

  }

  getDealerDropDown() {
    this.loader.show();
    const request$ = this.isSuperAdmin ? this.dealerMasterService.getDealers()
      : this.dealerMasterService.getByDealerId(this.dealerCode);

    request$.subscribe({
      next: (res) => {
        this.loader.hide();
        this.dealerList = res.data;
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', dealy: 5000 });
      }
    });
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    this.stockFilterdFormData.dateTo = to.toISOString().split('T')[0];
    this.stockFilterdFormData.dateFrom = from.toISOString().split('T')[0];
  }

  getDealerStockData() {
    this.loader.show();
    this.inventoryService.getPartsByDealerAndDateRange(this.stockFilterdFormData, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.stockDetails = res
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getPartsList() {
    this.loader.show();
    this.itemMasterService.getItemsByItemType(2).subscribe({
      next: (res) => {
        this.loader.hide();
        this.partsList = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onDealerChange(event: Event, dealerId: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      if (!this.stockFilterdFormData.itemCode.includes(dealerId)) {
        this.stockFilterdFormData.itemCode.push(dealerId);
      }
    } else {
      this.stockFilterdFormData.itemCode = this.stockFilterdFormData.itemCode.filter(
        id => id !== dealerId
      );
    }
  }

  searchText = '';

  filteredDealers() {
    if (!this.searchText) {
      return this.partsList;
    }

    return this.partsList.filter(x =>
      x.itemdesc.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }


}
