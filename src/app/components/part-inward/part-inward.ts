// src\app\components\part-inward\part-inward.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { PartsInwardService } from '../../core/services/partsinwardservice';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-part-inward',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './part-inward.html',
  styleUrl: './part-inward.scss',
})
export class PartInward implements OnInit {
  @ViewChild('partsInwardForm') partsInwardForm!: NgForm;
  readonly SUBMENU_ID = 99;
  canEdit = false;

  partsInwardData: any = {
    invoiceNo: '',
    invoiceDate: '',
    receiptDate: '',
    selectedLocation: '',
    prefixNo: '',
    purchaseNo: '',
    documentNo: '',
    partyCode: '',
    sourceType: '',
    isAccepted: false,
    poType: 'B2C'
  }

  page = 1;
  pageSize = 10;

  partsPurchaseDetails: any[] = [];
  lstLocations: any[] = [];
  ledgerList: any[] = [];

  isSuperAdmin: boolean = false;
  dealerCode: string = '';
  invoiceNo: string = '';

  isFormDisabled: boolean = false;

  constructor(
    private locationMasterService: LocationMasterService,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private partInwardService: PartsInwardService,
    private ledgerMasterService: LedgerMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private menuAccess: MenuAccessService   // ADDED
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);   // ADDED
  }

  ngOnInit(): void {

    this.route.params.subscribe(params => {

      const encClaim = params['invoiceNo'];
      const decoded = atob(encClaim);

      this.invoiceNo = decoded.split('|')[1];

      if (this.invoiceNo && this.invoiceNo !== '') {
        this.getInwardDetailsByInvoice();
      }
    });

    this.getLocationList();
    this.getLedgerList();
  }

  getLocationList() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.lstLocations = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getLedgerList() {
    this.loader.show();
    const ledgerTypes = ["Company", "Dealer"]
    this.ledgerMasterService.getLedgersByLedgerTypes(ledgerTypes).subscribe({
      next: (res) => {
        this.ledgerList = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', dealy: 5000 });
      }
    })
  }

  getInwardDetailsByInvoice() {
    this.loader.show();
    this.partInwardService.getInwardPartDetailByInvoiceNo(this.invoiceNo).subscribe({
      next: (res) => {
        this.loader.hide();

        if (res === null) {
          this.returnToList();
        }

        const to = new Date();
        this.partsInwardData = {
          invoiceNo: res.invoiceNo,
          invoiceDate: res.invoiceDate,
          selectedLocation: res.locationCode,
          receiptDate: res.receiptDate === null ? to.toISOString().split('T')[0] : res.receiptDate,
          prefixNo: res.prefixNo,
          purchaseNo: res.prefixNo.split('/').pop(),
          documentNo: res.documentNo,
          partyCode: 'LED1',
          sourceType: 'erp',
          isAccepted: res.isAccepted,
          poType: 'B2C'
        }
        this.partsPurchaseDetails = res.partInwards;

        if (res.isAccepted) {
          this.isFormDisabled = true;
        }
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onSave() {
    if (this.partsInwardForm.invalid)
      return;

    this.partsInwardData.updatedBy = this.storageService.getUserId();
    this.partsInwardData.updatedDate = new Date();

    this.loader.show();
    this.partInwardService.updatePartInwardDetailByInvoiceNo(this.partsInwardData).subscribe({
      next: (res) => {
        this.loader.hide();
        this.toaster.show("Data updated sucessfully.", { classname: 'bg-success text-white', delay: 5000 });
        this.notificationService.refreshPartsNotification.next();
        this.returnToList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  get totalQty() {
    return this.partsPurchaseDetails.reduce(
      (total, item) => total + Number(item.itemQty || 0),
      0
    );;
  }

  get totalAmount() {
    return this.partsPurchaseDetails.reduce(
      (total, item) => total + (item.itemAmount || 0),
      0
    );
  }

  returnToList() {
    this.router.navigate(['/parts-inward']);
  }

}
