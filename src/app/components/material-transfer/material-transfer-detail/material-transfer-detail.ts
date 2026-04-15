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
import { number } from 'echarts';
import { error } from 'console';

@Component({
  selector: 'app-material-transfer-detail',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './material-transfer-detail.html',
  styleUrl: './material-transfer-detail.scss',
})
export class MaterialTransferDetail implements OnInit {

  issueTypes = IssueTypes;
  lstTechnician = TechnicianList;

  formData = {
    prefix: '',
    issueNumber: '',
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
    itemRate: 0,
    stock: 0,
    issueType: '',
    issueSubType: '',
    inwardsrno: '',
    issuesrno: '',
    technician: '',
    amount: 0,
    mrp: 0,
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
    createdBy: '1',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null
    //#endregion
  }

  private materialTransferId: number = 0;
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
    private storageService: StorageService
  ) {
    this.router.params.subscribe(params => {
      this.materialTransferId = Number(params['id']);
    });
    this.dealerCode = this.storageService.getDealerCode();
  }

  ngOnInit() {
    if (this.materialTransferId === 0) {
      this.getMaterialIssueId();
    } else {
      // Logic to fetch and populate material transfer details based on materialTransferId
    }
    this.getItemList();
    this.getLocationList();
    this.getMaterialTransferList(10);
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
    this.itemmasterService.getItems(1).subscribe({
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

  getLocationList() {
    this.loader.show();
    this.locationService.getLocationByDealerCode(this.dealerCode).subscribe({
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
        this.items = res;
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

    this.loader.show();
    const lstAdded: any[] = this.items.filter(x => x.status === "Added");
    const lstModified: any[] = this.items.filter(x => x.status === "Modified");
    // const lstDeleted: any[] = this.items.filter(x => x.status === "Deleted");
    const lstDeleted: number[] = this.items.filter(x => x.status === "Deleted").map(x => x.id);

    if (lstAdded.length > 0) {
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
      this.materialTransferService.update(lstModified).subscribe({
        next: (result) => {
          this.loader.hide();
          console.log(result);
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

      itemToSave.jobId = this.formData.jobNo

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

    // const invoiceDetails = this.vehicleDispatch.filter(x => x.invoiceNo === invoiceData.invoiceNumber);
    // Pass data to the modal component
    // modalRef.componentInstance.invoiceDetails = invoiceDetails;

    // Optional: handle modal close or dismiss
    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          // this.loader.show();
          // this.Job.acceptInvoiceHeader(invoiceData.invoiceNumber).subscribe({
          //   next: (res) => {
          //     this.updateNotificationStatusByInvoice(invoiceData.invoiceNumber);
          //     this.loader.hide();
          //   },
          //   error: (err) => {
          //     this.loader.hide();
          //     console.error(err);
          //   }
          // });
          console.log('Implement API call to accept job with data:');
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
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
      itemRate: 0,
      stock: 0,
      issueType: '',
      issueSubType: '',
      inwardsrno: '',
      issuesrno: '',
      technician: '',
      amount: 0,
      mrp: 0,
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
      createdBy: '1',
      createdDate: new Date(),
      updatedBy: null,
      updatedDate: null
      //#endregion
    };
  }

  onBlurQuantity(value: number) {
    if (value > 0) {
      let rate = this.itemList.find(x => x.id === Number(this.newItem.itemId)).dlrprice;
      this.newItem.amount = (rate || 0) * (this.newItem.quantity || 0);
    }
  }

  onChangeItem(itemId: number) {
    const selectedItem = this.itemList.find(item => item.id === Number(itemId));
    if (selectedItem) {
      this.newItem.itemdesc = selectedItem.itemdesc;
      this.newItem.itemname = selectedItem.itemname;
      this.newItem.itemRate = selectedItem.dlrprice;
    }
  }

  editItem(row: any) {
    console.log(row);
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
      mrp: 0,
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

}

export const TechnicianList = [
  { name: 'Technician Rajesh', value: 1 },
  { name: 'Technician Amit', value: '2' },
  { name: 'Technician Suresh', value: 3 },
  { name: 'Technician Rakesh', value: 4 },
  { name: 'Technician Manoj', value: 5 },
  { name: 'Technician Mitesh', value: 6 },
  { name: 'Technician Manish', value: 7 }
]