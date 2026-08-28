// src\app\components\kit-creation\kit-creation-details\kit-creation-details.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'console';
import { KitDetailService } from '../../../core/services/kit-detail-service';
import { delay, identity } from 'lodash';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { KitCreationService } from '../../../core/services/kit-creation.service';
import { StorageService } from '../../../core/services/storage';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-kit-creation-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbPaginationModule],
  templateUrl: './kit-creation-details.html',
  styleUrl: './kit-creation-details.scss',
})
export class KitCreationDetails implements OnInit {
  kitDetails: any[] = [];
  itemList: any[] = [];
  readonly SUBMENU_ID = 24;
  canCreate = false;
  canEdit = false;
  kitHeaderData: any = {
    kitName: '',
    kitDate: new Date(),
    status: false,
    createdBy: '',
    createdDate: new Date()
  }

  kitItemData: any = {
    itemId: null,
    quantity: null
  }

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  selectedIndex: number | null = null;
  private isModify = false;

  private tempId = -1;

  private kitHeaderId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kitDetailsService: KitDetailService,
    private loader: LoaderService,
    private toaster: ToastService,
    private itemMasterService: ItemMasterService,
    private kitCreationService: KitCreationService,
    private storageService: StorageService,
    private menuAccess: MenuAccessService
  ) { }

  ngOnInit(): void {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.route.paramMap.subscribe((params: any) => {
      const kitHeaderId = Number(params.get('id'));

      this.getItemList();
      if (kitHeaderId > 0) {
        this.isModify = true;
        this.kitHeaderId = kitHeaderId;
        this.getHeaderDetails(kitHeaderId);
        this.getKitDetails(kitHeaderId);
      }
    });
  }

  getItemList() {
    this.loader.show();
    this.itemMasterService.getItemsByItemType(2).subscribe({
      next: (res) => {
        this.itemList = res;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        })
      }
    })
  }

  getHeaderDetails(kitHeaderId: number) {
    // this.loader.show();
    this.kitCreationService.getKitById(kitHeaderId).subscribe({
      next: (res) => {
        if (res) {
          this.kitHeaderData = res;
        }
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  getKitDetails(kitHeaderId: number) {
    // this.loader.show();
    this.kitDetailsService.getKitDetailsByPaged(kitHeaderId, this.page - 1, this.pageSize).subscribe({
      next: (res) => {
        this.collectionSize = 0;
        this.kitDetails = [];

        if (res) {
          this.kitDetails = res.data;
          this.collectionSize = res.totalRecords;
        }
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  onSubmit(form: any) {
    if (form.invalid) return;

    if (!this.kitDetails) this.kitDetails = [];

    const selectedItem = this.itemList.find(x => x.id == this.kitItemData.itemId);

    const currentUser = this.storageService.getUserId();
    const now = new Date();

    const existingIndex = this.kitDetails.findIndex(
      x => x.itemId === Number(this.kitItemData.itemId)
    );

    if (existingIndex > -1) {
      const existingItem = this.kitDetails[existingIndex];
      this.kitDetails[existingIndex] = {
        ...existingItem,
        itemId: Number(this.kitItemData.itemId),
        itemName: selectedItem?.itemname,
        kitHeaderId: existingItem.kitHeaderId,
        itemDescription: selectedItem?.itemdesc,
        quantity: Number(this.kitItemData.quantity),
        updatedBy: currentUser,
        updatedDate: now,
        isDirty: true
      };
    } else {
      this.kitDetails.push({
        id: this.tempId--,
        itemId: Number(this.kitItemData.itemId),
        itemName: selectedItem?.itemname,
        kitHeaderId: this.kitHeaderData.id,
        description: selectedItem?.itemdesc,
        quantity: Number(this.kitItemData.quantity),
        createdBy: currentUser,
        createdDate: now,
        isDirty: true
      });
    }

    this.selectedIndex = null;
    this.resetForm(form);
  }

  backToList() {
    this.router.navigate(['/kit-creation']);
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.kitDetails.sort((a: any, b: any) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onItemClick(row: any, index: number) {
    this.selectedIndex = index;

    this.kitItemData.itemId = row.itemId;
    this.kitItemData.quantity = row.quantity;

  }

  onPageChange(page: number) {
    this.page = page;
    this.getKitDetails(this.kitHeaderId);
  }

  onItemChange(item: any) {

  }

  resetForm(form: any) {
    this.kitItemData.itemId = null;
    this.kitItemData.quantity = null;

    form.controls['itemCode'].reset();
    form.controls['quantity'].reset();
  }

  saveKit(headerForm: any) {
    if (headerForm.invalid) return;

    const action$ = this.isModify
      ? this.kitCreationService.update(this.kitHeaderData)
      : this.kitCreationService.save(this.kitHeaderData);

    action$.subscribe({
      next: (res) => {
        this.loader.hide();
        if (res && res > 0 && !this.isModify) {
          this.kitDetails = this.kitDetails.map(item => ({ ...item, kitHeaderId: res }));
        }
        this.showToast(`Kit details ${this.isModify ? 'updated' : 'added'} successfully!`);
      },
      error: (err) => this.handleError(err),
      complete: () => {
        // Always save/update kit details after header attempt, regardless of result
        this.onSaveKitDetails();
      }
    });
  }

  onSaveKitDetails() {
    const newRecords = this.kitDetails.filter(item => item.isDirty && item.id < 0);
    const updatedRecords = this.kitDetails.filter(item => item.isDirty && item.id > 0);

    if (newRecords.length) this.saveOrUpdateKitDetails(newRecords, 'saved');
    if (updatedRecords.length) this.saveOrUpdateKitDetails(updatedRecords, 'updated');
  }

  private saveOrUpdateKitDetails(records: any[], action: 'saved' | 'updated') {
    const serviceMethod = action === 'saved'
      ? this.kitDetailsService.saveKitDetails(records)
      : this.kitDetailsService.updateKitDetails(records);

    serviceMethod.subscribe({
      next: () => {
        this.kitDetails = this.kitDetails.map(item => ({ ...item, isDirty: false }));
        this.loader.hide();
        this.showToast(`Kit details ${action} successfully!`);
        this.backToList();
      },
      error: (err) => this.handleError(err)
    });
  }

  private showToast(message: string) {
    this.toaster.show(message, { classname: 'bg-success text-white', delay: 5000 });
  }

  private handleError(err: any) {
    console.error(err);
    this.loader.hide();
    this.toaster.show('Something went wrong', { classname: 'bg-danger text-white', delay: 5000 });
  }

}
