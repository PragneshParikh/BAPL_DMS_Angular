//src\app\components\Workshop\item-master\item-master.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../../core/services/loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DurationTypes } from '../../../constant';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { subscribe } from 'diagnostics_channel';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-item-master',
  imports: [CommonModule, NgbHighlight, NgbPaginationModule, NgbTooltipModule, ReactiveFormsModule, FormsModule],
  templateUrl: './item-master.html',
  styleUrl: './item-master.scss',
})
export class ItemMaster implements OnInit {

  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  durationTypes = DurationTypes;

  griddata: any[] = [];
  filteredData: any[] = [];
  pagedData: any[] = [];

  searchTerm: string = '';
  selectedItem: any;

  readonly SUBMENU_ID = 5;
  canCreate = false;
  canEdit = false;
  canDownload = false;

  // pagination
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  // sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  groupId = 1; // static group id
  supplierlist: any[]=[];
  isSuperAdmin: boolean;

  constructor(
    private itemService: ItemMasterService,
    private loader: LoaderService,
    private modalService: NgbModal,
    private toaster: ToastService,
    private ledgerservice: LedgerMasterService,
    private storageService: StorageService,
    private menuAccess: MenuAccessService
  ) { }

  ngOnInit() {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.loadItems();
    this.loadsuplier();
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

  loadsuplier() {

    const dealerCode = this.storageService.getDealerCode();

    this.ledgerservice.getSupplierLedgers(dealerCode).subscribe({
      next: (res: any) => {

        this.supplierlist = res;

      },
      error: (err) => {
        console.error(err);
      }
    })

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

  // ===============================
  // Excel Import
  // ===============================

  // Opens the hidden file picker; the actual import happens in onImportFileSelected
  // once the user has chosen a file.
  triggerImportFileInput(): void {
    this.importFileInput.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loader.show();

    this.itemService.importItemMasterExcel(file).subscribe({
      next: (res: any) => {
        this.loader.hide();
        input.value = ''; // reset so selecting the same file again still fires a change event

        const summary = res?.data;
        const message = summary
          ? `Import complete: ${summary.insertedCount} added, ${summary.updatedCount} updated, ${summary.failedCount} failed.`
          : 'Item data imported successfully';

        this.toaster.show(message, {
          classname: summary?.failedCount ? 'bg-warning text-dark' : 'bg-success text-light',
          delay: 5000
        });

        this.loadItems();
      },
      error: (err) => {
        this.loader.hide();
        input.value = '';
        console.error(err);

        this.toaster.show('Failed to import item data!', {
          classname: 'bg-danger text-light',
          delay: 5000
        });
      }
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
    this.selectedItem = { ...item };   // CHANGED — clone so edits don't leak into pagedData until saved
    this.modalService.open(modal, { size: 'xl' });
  }

  updateItem() {
    this.loader.show();
    this.selectedItem.dealerCode = this.storageService.getDealerCode();
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

  // ===============================
  // Item Object
  // ===============================

  itemObj: any = this.getEmptyItem();


  // ===============================
  // Dropdown Lists
  // ===============================

  modelList: any[] = [];
  // durationTypes: any[] = [
  //   { id: 1, title: 'Month' },
  //   { id: 2, title: 'Year' }
  // ];

  groupList = [
    { id: 1, title: 'Spares' },
    { id: 2, title: 'FG' }
  ];

  itemTypeList = [
    { id: 1, title: 'Vehicle' },
    { id: 2, title: 'Parts' }
  ];

  uomList = [
    'PCS',
    'NOS',
    'SET',
    'BOX'
  ];




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
    dealerCode:'',
    status:false,
    supplierId:0

    };

  }

  // ===============================
  // Reset Form
  // ===============================
  resetForm() {
    this.itemObj = this.getEmptyItem();
  }

  // ===============================
  // Open Add Popup
  // ===============================

  openAddItem(content: any) {

    this.resetForm();

    this.modalService.open(content, {

      size: 'xl',
      backdrop: 'static',
      keyboard: false

    });

  }

  // ===============================
  // Validation
  // ===============================

  validateItem(): boolean {

    if (!this.itemObj.itemname?.trim()) {
      this.toaster.show('Enter Part NO.', { classname: 'bg-warning text-light', delay: 5000 });
      return false;
    }

    if (!this.itemObj.itemdesc?.trim()) {
      this.toaster.show('Enter Item Description', { classname: 'bg-warning text-light', delay: 5000 });
      return false;
    }

    if (!this.itemObj.hsncode?.trim()) {
      this.toaster.show('Enter HSNCode', { classname: 'bg-warning text-light', delay: 5000 });
      return false;
    }

    if (this.itemObj.custprice <= 0) {
      this.toaster.show('Enter Sale Rate', { classname: 'bg-warning text-light', delay: 5000 });
      return false;
    }

    if (this.itemObj.ipurrate <= 0) {
      this.toaster.show('Enter Purchase Rate', { classname: 'bg-warning text-light', delay: 5000 });
      return false;
    }
    return true;
  }



  // ===============================
  // Save Item
  // ===============================

  saveItem() {

    if (!this.validateItem())
      return;
    const dealerCode = this.storageService.getDealerCode();
    this.itemObj.dealerCode = dealerCode;

    this.itemService.insertItem(this.itemObj).subscribe({

      next: (res: any) => {

        this.toaster.show('Item Saved Successfully.', { classname: 'bg-success text-light', delay: 5000 });


        this.modalService.dismissAll();

        this.loadItems();

      },

      error: (err) => {

        console.error(err);

        this.toaster.show('something went wrong', { classname: 'bg-danger text-light', delay: 5000 });

      }

    });

  }
}