import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

@Component({
  selector: 'app-material-transfer-detail',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, CommonModule, GetTechnicianNamePipe, GetIssueTypeNamePipe],
  templateUrl: './material-transfer-detail.html',
  styleUrl: './material-transfer-detail.scss',
})
export class MaterialTransferDetail implements OnInit {

  issueTypes = IssueTypes;
  lstTechnician = TechnicianList;

  formData = {
    prefix: '',
    issueNumber: 0,
    jobNo: 0,
    OdoMeter: 0,
    date: new Date(),
    technician: '',
    location: '',
  };
  newItem = {
    //#region Item Table Field
    id: 0,
    jobId: 0,
    itemId: 0,
    itemname: '',
    itemdesc: '',
    quantity: 0,
    itemRate: '',
    stock: 0,
    issueType: '',
    issueSubType: '',
    inwardsrno: '',
    issuesrno: '',
    technician: '',
    amount: '',
    mrp: '',
    wav: '',
    validdays: null,
    validkms: null,
    remarks: '',
    firstfill: null,
    firstfillstock: null,
    received: null,
    receivedrate: null,
    cir: null,
    warrantyapproval: null,
    warrantyapprovalstatus: null,
    //#endregion

    //#region Item Detail Field
    rackNo: null,
    binNo: '',
    returnQty: 0,
    serialNo: '',
    status: '',
    batchClosingQty: 0,
    createdBy: '1',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null
    //#endregion
  }

  private jobId: number = 0;
  itemList: any[] = [];
  items: any[] = [];
  lstLocation: any[] = [];

  dealerCode: string = '';
  private tempIdCounter = -1;

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
    private taxService: TaxService
  ) {
    this.router.params.subscribe(params => {
      this.jobId = Number(params['id']);
    });
    this.dealerCode = this.storageService.getDealerCode();
  }

  ngOnInit() {
    if (this.jobId === 0) {
      this.getMaterialIssueId();
    }
    this.getItemList();
    this.getLocationList(this.dealerCode, 2);
    this.getMaterialTransferList(this.jobId);
  }

  getMaterialIssueId() {
    this.materialTransferService.getMaterialIssueId().subscribe({
      next: (res) => {
        this.formData.issueNumber = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getItemList() {
    this.loader.show();
    this.itemmasterService.fetchItemsByHsnTaxAndGroupId(1).subscribe({
      next: (res) => {
        this.loader.hide();
        this.itemList = res;
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

  getMaterialTransferList(jobId: Number) {
    this.loader.show();
    this.materialTransferService.getMaterialTransferByJobId(jobId).subscribe({
      next: (res) => {
        this.items = res.map((item: any) => {
          item.mrp = (Number(item.custprice) * (item.quantity || 0)).toFixed(2);

          return item;
        });

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
    // const lstDeleted: any[] = this.items.filter(x => x.status === "Deleted");
    const lstDeleted: number[] = this.items.filter(x => x.status === "Deleted").map(x => x.id);

    if (lstAdded.length > 0) {
      this.loader.show();
      this.materialTransferService.insert(lstAdded).subscribe({
        next: (result) => {
          this.loader.hide();
          this.toast.show("Record inserted sucessfully.", {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.route.navigate['/material-transfer'];
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
  }

  backToList() {
    this.route.navigate(['/material-transfer']);
  }

  onAddItem() {
    if (this.newItem.itemId <= 0) {
      this.toast.show('Please select an item to add.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (this.newItem.quantity <= 0) {
      this.toast.show('Please enter a valid quantity.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }


    let index = this.items.findIndex(x => x.id === this.newItem.id);

    const itemToSave = {
      ...this.newItem,
      updatedBy: this.storageService.getUserId(),
      updatedDate: new Date()
    };

    if (index > -1) {
      itemToSave.status = 'Modified';
      this.items[index] = itemToSave;
    } else {
      itemToSave.status = 'Added';

      itemToSave.id = this.tempIdCounter--;

      itemToSave.jobId = this.formData.issueNumber;

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

    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          this.jobId = result.jobDetail.id;
          this.getMaterialTransferList(result.jobDetail.id);
          this.getJobCardById(result.jobDetail.id);
          this.getLocationList(this.dealerCode, 2);
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  getJobCardById(id: number) {
    this.jobCardService.getJobCardById(id).subscribe({
      next: (res) => {
        this.formData = {
          prefix: res.jobprefix,
          issueNumber: res.id,
          jobNo: res.jobNo,
          OdoMeter: res.vehiclekms,
          date: res.jobinDate,
          technician: res.technician,
          location: res.serviceloc,
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  resetNewItem() {
    this.newItem = {
      //#region Item Table Field
      id: 0,
      jobId: 0,
      itemId: 0,
      itemname: '',
      itemdesc: '',
      quantity: 0,
      itemRate: '',
      stock: 0,
      issueType: '',
      issueSubType: '',
      inwardsrno: '',
      issuesrno: '',
      technician: '',
      amount: '',
      mrp: '',
      wav: '',
      validdays: null,
      validkms: null,
      remarks: '',
      firstfill: null,
      firstfillstock: null,
      received: null,
      receivedrate: null,
      cir: null,
      warrantyapproval: null,
      warrantyapprovalstatus: null,
      batchClosingQty: 0,
      //#endregion

      //#region Item Detail Field
      rackNo: null,
      binNo: '',
      returnQty: 0,
      serialNo: '',
      status: '',
      createdBy: '1',
      createdDate: new Date(),
      updatedBy: null,
      updatedDate: null
      //#endregion
    };
  }

  onBlurQuantity(value: number) {
    if (value > 0) {
      let rate = this.itemList.find(x => x.id === Number(this.newItem.itemId)).custprice;
      this.newItem.mrp = Number((rate || 0) * (this.newItem.quantity || 0)).toFixed(2);
      this.newItem.amount = (Number(this.newItem.itemRate) * (this.newItem.quantity || 0)).toFixed(2);
    }
  }

  onChangeItem(itemId: number) {
    if (!itemId) return;

    this.resetNewItem();

    const selectedItem = this.itemList.find(item => item.id === Number(itemId));
    if (selectedItem) {
      this.loader.show();
      this.taxService.getTaxList(selectedItem.itemcode.toString(), 'CUS0435S1', '').subscribe({
        next: (res) => {
          this.loader.hide();

          const totalGST = res.reduce(
            (sum, tax) => sum + Number(tax.taxRate || 0), 0
          );

          const taxDetails = this.calculateGST(Number(selectedItem.custprice), totalGST);

          this.newItem.itemdesc = selectedItem.itemdesc;
          this.newItem.itemname = selectedItem.itemname;
          this.newItem.itemId = selectedItem.id;
          this.newItem.itemRate = Number(taxDetails.basePrice).toFixed(2);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Failed to fetch tax details. Please try again later.', { classname: 'bg-danger text-light' });
        }
      });
    }
  }

  editItem(row: any) {
    this.newItem = {
      id: row.id,
      jobId: row.jobId,
      itemId: row.itemId,
      itemname: row.itemname,
      itemdesc: row.itemdesc,
      quantity: row.quantity,
      itemRate: row.itemRate,
      stock: 0,
      issueType: row.issueType,
      issueSubType: '',
      inwardsrno: '',
      issuesrno: '',
      technician: row.technician,
      amount: row.amount,
      mrp: '',
      wav: '',
      validdays: null,
      validkms: null,
      remarks: row.remarks,
      firstfill: null,
      firstfillstock: null,
      received: null,
      receivedrate: null,
      cir: null,
      warrantyapproval: null,
      warrantyapprovalstatus: null,
      batchClosingQty: 0,

      rackNo: row.rackNo,
      binNo: row.bin,
      returnQty: 0,
      serialNo: row.serialNO,
      status: '',
      createdBy: row.createdBy,
      createdDate: row.createdDate,
      updatedBy: null,
      updatedDate: null
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

  openLabourRateDialog() {
    alert('Labour rate dialog opened');
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