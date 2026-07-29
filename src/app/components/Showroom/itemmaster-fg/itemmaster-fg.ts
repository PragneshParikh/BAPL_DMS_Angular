import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { LoaderService } from '../../../core/services/loader';
import { BatteryType, BatteryVoltage, DurationTypes } from '../../../constant';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-itemmaster-fg',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './itemmaster-fg.html',
  styleUrl: './itemmaster-fg.scss',
})
export class ItemmasterFG implements OnInit {
  durationTypes = DurationTypes;
  isSuperAdmin: boolean;
  // ===============================
  // Empty Object
  // ===============================

  getEmptyItem() {

    return {

      id: 0,

      itemtype: 2,

      itemname: '',
      itemdesc: '',
      itemcode: '',

      iselectric: false,

      oemPartNo: '',
      oemPartDescription: '',

      grpidno: 1,
      oemModelId: null,

      uom: '',

      hsncode: '',
      fame2amount:0,

      taxPercent: 0,

      cgst: 0,
      sgst: 0,
      igst: 0,
      ugst: 0,

      gstCess: 0,
      tcs: 0,

      itemCategory: 'Parts',

      hrsTat: 0,

      dlrprice: 0,
      itemMrp: 0,
      oemMrp: 0,

      ipurrate: 0,
      custprice: 0,

      margin: 0,
      partLabour: 0,

      reOrderQty: 0,

      minBillQty: 0,
      minOrderQty: 0,

      warrantyPeriod: 0,
      warrantyDurationType: 1,
      warrantyKms: 0,

      isWarrantyApproval: false,

      vorRate: 0,
      isVOR: false,

      remarks: '',

      isExempted: false,
      isToolkitFirstAid: false,
      isStockRequired: false,
      isHelmet: false,
      isInventory: false,
      isInEligibleInput: false,
      dealerCode: '',
      status: false,
      supplierId: 0

    };

  }

  griddata: any[] = [];
  filteredData: any[] = [];    // sorted data
  pagedData: any[] = [];
  selectedItem: any;      // data for current page
  searchTerm: string = '';
  itemObj: any = this.getEmptyItem();

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
    private storageService: StorageService,
    private toaster: ToastService,
    private loader: LoaderService,
    private modalService: NgbModal
  ) { }


  ngOnInit() {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
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

  // get battery type 
  getBatteryTypeName(id: number): string {
    const battery = BatteryType.find(x => x.batterytypeidno === id);
    return battery ? battery.value : '';
  }
  getBatteryVoltageName(id: number): string {
    id = 1
    const batteryVoltage = BatteryVoltage.find(x => x.batteryVoltageidno === id);
    return batteryVoltage ? batteryVoltage.value : '';
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

  updateItem() {
    this.loader.show();
    this.selectedItem.dealerCode = this.storageService.getDealerCode();
    this.selectedItem.uom = this.itemObj.uom;
    this.selectedItem.warrantyDurationType = this.itemObj.warrantyDurationType;
    this.selectedItem.fame2amount = this.itemObj.fame2amount;
    this.itemObj.status = this.selectedItem.status
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
