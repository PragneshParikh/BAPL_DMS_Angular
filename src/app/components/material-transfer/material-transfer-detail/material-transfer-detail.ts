// src\app\components\material-transfer\material-transfer-detail\material-transfer-detail.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { JobSearch } from '../../../dialogs/job-search/job-search';
import { LoaderService } from '../../../core/services/loader';
import { MaterialTransferService } from '../../../core/services/material-transfer';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { IssueTypes } from '../../../constant';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { StorageService } from '../../../core/services/storage';
import { JobCardService } from '../../../core/services/job-card-service';
import { GetTechnicianNamePipe } from '../../../core/pipes/get-technician-name-pipe';
import { GetIssueTypeNamePipe } from '../../../core/pipes/get-issue-type-name-pipe';
import { TaxService } from '../../../core/services/tax';
import { NgSelectModule } from '@ng-select/ng-select';
import { PrefixService } from '../../../core/services/prefix';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-material-transfer-detail',
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    GetTechnicianNamePipe,
    GetIssueTypeNamePipe,
    NgSelectModule,
    NgbTooltip
  ],
  templateUrl: './material-transfer-detail.html',
  styleUrl: './material-transfer-detail.scss',
})
export class MaterialTransferDetail implements OnInit {

  issueTypes = IssueTypes.filter(x => x.id === 1 || x.id === 2);
  lstTechnician = TechnicianList;

  readonly SUBMENU_ID = 29;
  // NOTE: these two field defaults don't matter — the constructor below
  // always runs after and overwrites both with the real (or temporarily
  // overridden) value. Set to false here purely so the field declaration
  // isn't misleading about what actually governs the buttons.
  canCreate = false;
  canEdit = false;

  formData: any = {
    prefix: '',
    issueNumber: '',
    jobNo: 0,
    OdoMeter: 0,
    date: new Date(),
    location: '',
    isSameLocation: false
  };
  newItem = {
    id: 0,
    jobId: 0,
    itemId: null,
    itemcode: '',
    itemdesc: '',
    quantity: 0,
    itemRate: '',
    stock: 0,
    batchClosingQty: 0,
    issueType: '',
    inwardsrno: '',
    issuesrno: '',
    technician: 0,
    cgst: '',
    sgst: '',
    igst: '',

    hsncode: '',

    cgstAmount: '',
    sgstAmount: '',
    igstAmount: '',
    amount: '',
    mrp: '',
    validdays: null,
    validkms: null,
    remarks: '',
    received: null,
    receivedrate: null,
    cir: null,
    warrantyapproval: null,
    warrantyapprovalstatus: null,

    rackNo: null,
    binNo: '',
    returnQty: 0,
    serialNo: '',
    status: '',
    createdBy: '1',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null,
    isEdit: false
  }

  private jobId: number = 0;
  itemList: any[] = [];
  items: any[] = [];
  lstLocation: any[] = [];

  dealerCode: string = '';
  isEdit: boolean = false;
  private tempIdCounter = -1;
  isSuperAdmin: boolean = false;

  jobCardStatus: boolean = false;

  totalGST: any;

  constructor(
    private router: ActivatedRoute,
    private route: Router,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toast: ToastService,
    private materialTransferService: MaterialTransferService,
    private itemmasterService: ItemMasterService,
    private locationService: LocationMasterService,
    private storageService: StorageService,
    private jobCardService: JobCardService,
    private prefixMasterService: PrefixService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.router.params.subscribe(params => {

      const encClaim = params['id'];
      const decoded = atob(encClaim);

      this.jobId = Number(decoded.split('|')[1]);

      if (this.jobId && this.jobId !== 0) {
        this.isEdit = true;
        this.getJobCardById(this.jobId);
        this.getJobCardStatus(this.jobId);
      }
    });

  }

  ngOnInit() {
    this.getLocationList(this.dealerCode, 2);
    this.getMaterialTransferList(this.jobId, null);
  }

  getItemList(jobDetails: any) {
    this.loader.show();

    this.itemmasterService.fetchItemsByHsnTaxAndGroupId(1, jobDetails.dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        // Exclude EW (EBW) parts — they belong to the EBW Invoice flow, not Material Transfer
        this.itemList = (res || []).filter((item: any) =>
          !(item.itemcode || '').toUpperCase().includes('EW')
        );
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light' });
      }
    });
  }

  getLocationList(dealerCode: string, areaId: number) {
    this.loader.show();
    this.locationService.getLocationByDealerCodeAndAreaId(dealerCode, areaId).subscribe({
      next: (result) => {
        this.lstLocation = result;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light' });
      }
    })
  }

  getMaterialTransferList(jobId: Number, dealerCode: string | null) {
    this.loader.show();
    this.materialTransferService.getMaterialTransferByJobId(jobId).subscribe({
      next: (res: any) => {
        this.items = [];
        if (res && res.length > 0) {

          const materialPrefix = res[0].materialPrefix ?? '';
          const materialIssueNumber = res[0].materialIssueNumber;

          // FIX: merge into formData instead of relying on it being set
          // elsewhere — this call and getJobCardById() can resolve in
          // either order, so each one must only patch the keys it owns.
          this.formData = {
            ...this.formData,
            prefix: this.normalizeMaterialPrefix(
              materialPrefix,
              materialIssueNumber
            ),
            issueNumber:
              materialIssueNumber != null
                ? String(Number(materialIssueNumber))
                : ''
          };

          this.items = res.map((item: any) => {
            item.mrp = (
              Number(item.custprice) *
              (item.quantity || 0)
            ).toFixed(2);

            return item;
          });

        } else {
          if (dealerCode && dealerCode !== '') {
            this.getMaterialPrefix(dealerCode);
          }
        }

        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load items. Please try again.', {
          classname: 'bg-danger text-light',
          delay: 5000
        });
      }
    });
  }

  onSubmit(form: any) {
    if (!form.valid) {
      return;
    }

    const lstAdded: any[] = this.items.filter(x => x.status === "Added");
    const lstModified: any[] = this.items.filter(x => x.status === "Modified");
    const lstDeleted: number[] = this.items.filter(x => x.status === "Deleted").map(x => x.id);

    if (lstAdded.length > 0) {
      this.loader.show();
      this.materialTransferService.insert(lstAdded).subscribe({
        next: (result) => {
          this.loader.hide();
          this.toast.show("Record inserted sucessfully.", { classname: 'bg-success text-white', delay: 5000 });
          this.route.navigate(['/material-transfer']);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      })
    }

    if (lstModified.length > 0) {
      this.loader.show();
      this.materialTransferService.update(lstModified).subscribe({
        next: (result) => {
          this.loader.hide();
          this.toast.show("Record inserted sucessfully.", {
            classname: 'bg-success text-white',
            delay: 5000
          });
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Failed to load items. Please try again later.', {
            classname: 'bg-danger text-light',
            delay: 5000
          });
        }
      })
    }

    if (lstDeleted.length > 0) {
      this.loader.show();
      this.materialTransferService.delete(lstDeleted).subscribe({
        next: (result) => {
          this.loader.hide();
          this.toast.show("Record updated sucessfully.", { classname: 'bg-success text-white', delay: 5000 });
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Failed to load items. Please try again later.', { classname: 'bg-danger text-light', delay: 5000 });
        }
      })
    }
  }

  backToList() {
    this.route.navigate(['/material-transfer']);
  }

  onAddItem() {

    const _existingItem = this.items.filter(x => x.itemcode === this.newItem.itemcode);

    if (this.newItem.itemId <= 0) {
      this.toast.show('Please select an item to add.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.newItem.quantity <= 0) {
      this.toast.show('Please enter a valid quantity.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.newItem.technician === null || this.newItem.technician === 0) {
      this.toast.show('Please select the technician.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.newItem.issueType === null || this.newItem.issueType === '') {
      this.toast.show('Please select the issuetype.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (_existingItem.length > 0 && _existingItem[0].status !== 'Deleted' && !this.newItem.isEdit) {
      this.toast.show('Part already exists.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    let index = this.items.findIndex(x => x.itemcode === this.newItem.itemcode && x.status !== 'Deleted');

    const itemToSave = {
      ...this.newItem,
      location: this.formData.location,
      dealerCode: this.lstLocation.filter(x => x.loccode === this.formData.location)[0].dealerCode,
      dealerLocation: this.lstLocation.filter(x => x.loccode === this.formData.location)[0].locname,
      materialPrefix: this.formData.prefix,
      materialissueNumber: this.formData.issueNumber,
      updatedBy: this.storageService.getUserId(),
      updatedDate: new Date()
    };

    if (index > -1) {
      let totalGST = 0;

      if (this.formData.isSameLocation) {
        totalGST = Number(this.items[index].cgst) + Number(this.items[index].sgst);
      } else {
        totalGST = Number(this.items[index].igst);
      }

      totalGST = Number(this.items[index].cgst) + Number(this.items[index].sgst) + Number(this.items[index].igst);
      const finalPrice = Number(this.items[index].itemRate) * this.newItem.quantity * (1 + totalGST / 100);
      const taxDetails = this.calculateGST(finalPrice, totalGST);
      const totalGSTAmount = Number(taxDetails.gstAmount);

      this.newItem.itemRate = Number(taxDetails.basePrice).toFixed(2);

      itemToSave.amount = Number(taxDetails.basePrice).toFixed(2);
      itemToSave.mrp = this.items[index].mrp;

      itemToSave.cgstAmount = this.formData.isSameLocation && totalGST > 0
        ? ((Number(this.items[index].cgst) / totalGST) * totalGSTAmount).toFixed(2)
        : '0.00';

      itemToSave.sgstAmount = this.formData.isSameLocation && totalGST > 0
        ? ((Number(this.items[index].sgst) / totalGST) * totalGSTAmount).toFixed(2)
        : '0.00';

      itemToSave.igstAmount = !this.formData.isSameLocation && totalGST > 0
        ? totalGSTAmount.toFixed(2)
        : '0.00';

      itemToSave.batchClosingQty = this.items[index].batchClosingQty ?? this.newItem.batchClosingQty;
      itemToSave.stock = itemToSave.batchClosingQty - this.newItem.quantity;

      itemToSave.status = this.newItem.id > 0 ? 'Modified' : 'Added';
      this.items[index] = itemToSave;

    } else {

      const totalGST = this.formData.isSameLocation
        ? Number(this.newItem.cgst) + Number(this.newItem.sgst)
        : Number(this.newItem.igst);

      const selectedItem = this.itemList.find(item => item.itemcode === this.newItem.itemcode);

      const taxDetails = this.calculateGST(Number(selectedItem.custprice), totalGST);
      const totalGSTAmount = Number(taxDetails.gstAmount);

      this.newItem.amount = Number(taxDetails.basePrice).toFixed(2);
      this.newItem.mrp = taxDetails.finalPrice;

      itemToSave.amount = Number(taxDetails.basePrice).toFixed(2);
      itemToSave.mrp = taxDetails.finalPrice;

      itemToSave.cgstAmount = this.formData.isSameLocation && totalGST > 0
        ? ((Number(this.newItem.cgst) / totalGST) * totalGSTAmount).toFixed(2)
        : '0.00';

      itemToSave.sgstAmount = this.formData.isSameLocation && totalGST > 0
        ? ((Number(this.newItem.sgst) / totalGST) * totalGSTAmount).toFixed(2)
        : '0.00';

      itemToSave.igstAmount = !this.formData.isSameLocation && totalGST > 0
        ? totalGSTAmount.toFixed(2)
        : '0.00';

      itemToSave.status = 'Added';

      itemToSave.id = this.tempIdCounter--;

      itemToSave.jobId = this.jobId;

      itemToSave.batchClosingQty = this.newItem.batchClosingQty - this.newItem.quantity;

      itemToSave.createdBy = this.storageService.getUserId();
      itemToSave.createdDate = new Date();

      this.items = [...this.items, itemToSave];
    }

    this.resetNewItem();
  }

  openJobSearch() {
    const modalRef = this.modalService.open(JobSearch, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.sourceType = 'material-transfer';

    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          this.jobId = result.jobDetail.id;
          this.getMaterialTransferList(this.jobId, result.jobDetail.dealerCode);
          this.getJobCardById(this.jobId);
          this.getLocationList(result.jobDetail.dealerCode, 2);
          this.getJobCardStatus(this.jobId);
          this.getItemList(result.jobDetail);
        }
      },
      (reason) => {
      }
    );
  }

  getJobCardById(id: number) {
    this.jobCardService.getJobCardById(id).subscribe({
      next: (res) => {
        // FIX: merge into formData rather than replacing it wholesale —
        // getMaterialTransferList() sets formData.prefix / issueNumber
        // independently, and whichever of these two async calls resolves
        // second must not wipe out what the other one already set.
        this.formData = {
          ...this.formData,
          jobNo: res.jobNo,
          OdoMeter: res.vehiclekms,
          date: res.jobinDate,
          technician: res.technician,
          location: res.serviceloc,
          isSameLocation: res.isSameState
        }

        this.getItemList(res);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  resetNewItem() {
    this.totalGST = 0;
    this.newItem = {
      id: 0,
      jobId: 0,
      itemId: 0,
      itemcode: '',
      itemdesc: '',
      quantity: 0,
      itemRate: '',
      stock: 0,
      batchClosingQty: 0,
      issueType: '',
      inwardsrno: '',
      issuesrno: '',
      technician: 0,
      cgst: '',
      sgst: '',
      igst: '',

      hsncode: '',

      cgstAmount: '',
      sgstAmount: '',
      igstAmount: '',
      amount: '',
      mrp: '',
      validdays: null,
      validkms: null,
      remarks: '',
      received: null,
      receivedrate: null,
      cir: null,
      warrantyapproval: null,
      warrantyapprovalstatus: null,

      rackNo: null,
      binNo: '',
      returnQty: 0,
      serialNo: '',
      status: '',
      createdBy: '1',
      createdDate: new Date(),
      updatedBy: null,
      updatedDate: null,
      isEdit: false
    };
  }

  onBlurQuantity(value: number) {
    if (value > 0) {
      const _item = this.itemList.find(x => x.id === Number(this.newItem.itemId));

      if (_item.batchClosingQty < value) {
        this.newItem.quantity = 0;
        this.toast.show(`Stock limit exceeded. Please reduce the quantity.`, { classname: 'bg-warning text-white', delay: 5000 });
        return;
      }

      let rate = _item ? _item.custprice : 0;
      this.newItem.mrp = Number((rate || 0) * (this.newItem.quantity || 0)).toFixed(2);
      this.newItem.amount = (Number(this.newItem.itemRate) * (this.newItem.quantity || 0)).toFixed(2);
    }
  }

  onChangeItem(itemId: any) {
    if (!itemId) return;

    this.resetNewItem();
    const dealerCode = this.lstLocation.filter(x => x.loccode === this.formData.location)[0].dealerCode;

    const selectedItem = this.itemList.find(item => item.id === Number(itemId.id));
    if (selectedItem) {
      this.loader.show();

      this.totalGST = Number(selectedItem.cgstPercentage) + Number(selectedItem.sgstPercentage);

      const totalGST = Number(selectedItem.cgstPercentage) + Number(selectedItem.sgstPercentage);
      const taxDetails = this.calculateGST(selectedItem.custprice, totalGST);

      this.newItem.itemdesc = selectedItem.itemdesc;
      this.newItem.itemcode = selectedItem.itemcode;
      this.newItem.itemId = selectedItem.id;
      this.newItem.itemRate = Number(taxDetails.basePrice).toFixed(2);
      this.newItem.hsncode = selectedItem.hsncode;
      this.newItem.batchClosingQty = selectedItem.batchClosingQty;

      this.newItem.cgst = selectedItem.cgstPercentage;
      this.newItem.sgst = selectedItem.sgstPercentage;
      this.newItem.igst = selectedItem.igstPercentage;

      if (this.newItem.batchClosingQty > 0) {
        this.newItem.quantity = 1;
      }
      this.loader.hide();
    }
  }

  editItem(row: any) {

    const _item = this.itemList.filter(x => x.itemcode === row.itemcode);

    this.totalGST = _item.reduce((sum, item) => sum + Number(item.cgstPercentage || 0) + Number(item.sgstPercentage || 0), 0);

    this.newItem = {
      id: row.id,
      jobId: row.jobId,
      itemId: row.itemId,
      itemcode: row.itemcode,
      itemdesc: row.itemdesc,
      hsncode: row.hsncode,
      quantity: row.quantity,
      itemRate: row.itemRate,
      stock: row.stock,
      batchClosingQty: row.batchClosingQty ?? _item[0].batchClosingQty,
      issueType: row.issueType,
      inwardsrno: '',
      issuesrno: '',
      technician: row.technician,
      cgst: row.cgst,
      sgst: row.sgst,
      igst: row.igst,

      cgstAmount: row.cgstAmount,
      sgstAmount: row.sgstAmount,
      igstAmount: row.igstAmount,

      amount: row.amount,
      mrp: '',
      validdays: null,
      validkms: null,
      remarks: row.remarks,
      received: null,
      receivedrate: null,
      cir: null,
      warrantyapproval: null,
      warrantyapprovalstatus: null,

      rackNo: row.rackNo,
      binNo: row.bin,
      returnQty: 0,
      serialNo: row.serialNO,
      status: '',
      createdBy: row.createdBy,
      createdDate: row.createdDate,
      updatedBy: null,
      updatedDate: null,
      isEdit: true
    }
  }

  deleteItem(row: any) {
    row.status = 'Deleted';
  }

  getTotalQty(): number {
    return this.items
      .filter(item => item.status !== 'Deleted')
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getTotalAmount(): number {
    return this.items
      .filter(item => item.status !== 'Deleted')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
      .toFixed(2);
  }

  calculateGST(finalPrice: number, totalGST: number = 0) {

    const ratio = (100 + totalGST) / 100;

    const basePrice = finalPrice / ratio;

    const gstAmount = finalPrice - basePrice;

    return {
      basePrice: basePrice.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      totalGST: totalGST.toFixed(2)
    };
  }

  onQuantityInput(event: any): void {
    const input = event.target.value.replace(/[^0-9]/g, '');

    this.newItem.quantity = input ? Number(input) : 0;

    event.target.value = input;
  }

  customSearchFn(term: string, item: any): boolean {
    term = term.toLowerCase();

    return (
      item.itemcode?.toLowerCase().includes(term) ||
      item.itemdesc?.toLowerCase().includes(term)
    );
  }

  getMaterialPrefix(dealerCode: string): void {
    this.loader.show();

    this.prefixMasterService
      .getPrefixByDealerByModule(dealerCode, 'material_transfer')
      .subscribe({
        next: (res: string) => {
          this.loader.hide();

          if (!res) {
            this.formData.prefix = '';
            this.formData.issueNumber = '';
            return;
          }

          const prefixValue = String(res).trim();

          const lastSlashIndex = prefixValue.lastIndexOf('/');

          if (lastSlashIndex === -1) {
            this.formData.prefix = prefixValue;
            this.formData.issueNumber = '';
            return;
          }

          const lastPart = prefixValue.substring(lastSlashIndex + 1);

          if (/^\d+$/.test(lastPart)) {
            this.formData.prefix =
              prefixValue.substring(0, lastSlashIndex + 1);

            this.formData.issueNumber =
              String(Number(lastPart));
          } else {
            this.formData.prefix = prefixValue;
            this.formData.issueNumber = '';
          }
        },

        error: (err) => {
          this.loader.hide();

          console.error(err);

          this.formData.prefix = '';
          this.formData.issueNumber = '';

          this.toast.show(
            'Something went wrong.',
            {
              classname: 'bg-danger text-white',
              delay: 5000
            }
          );
        }
      });
  }


  getJobCardStatus(jobId: Number) {
    this.loader.show();
    this.jobCardService.getJobCardStatusById(jobId).subscribe({
      next: (res: any) => {
        this.jobCardStatus = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getRowNumber(index: number): number {
    return this.items
      .filter(item => item.status !== 'Deleted')
      .findIndex(item => item === this.items[index]) + 1;
  }

  private normalizeMaterialPrefix(
    prefix: string,
    issueNumber: number | string | null | undefined
  ): string {

    if (!prefix) {
      return '';
    }

    if (issueNumber == null || issueNumber === '') {
      return prefix;
    }

    const number = String(issueNumber);

    const escapedNumber = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(`0*${escapedNumber}$`);

    const normalized = prefix.replace(regex, '');

    return normalized.endsWith('/')
      ? normalized
      : `${normalized}/`;
  }

}



export const TechnicianList = [
  { id: 1, name: 'Technician Rajesh' },
  { id: 2, name: 'Technician Amit' },
  { id: 3, name: 'Technician Suresh' },
  { id: 4, name: 'Technician Rakesh' },
  { id: 5, name: 'Technician Manoj' },
  { id: 6, name: 'Technician Mitesh' },
  { id: 7, name: 'Technician Manish' }
]