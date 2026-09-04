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

  this.getLocationList();
  this.getLedgerList();

  this.route.params.subscribe(params => {

    const encClaim = params['invoiceNo'];

    console.log('Encoded invoice:', encClaim);

    if (!encClaim) {
      console.error(
        'Invoice route parameter is missing.'
      );
      return;
    }

    try {

      const decoded = atob(encClaim);

      console.log(
        'Decoded invoice:',
        decoded
      );

      const parts = decoded.split('|');

      this.invoiceNo =
        parts[1]?.trim();

      console.log(
        'Final invoice number sent to API:',
        this.invoiceNo
      );

      if (this.invoiceNo) {
        this.getInwardDetailsByInvoice();
      }

    } catch (error) {

      console.error(
        'Invalid encoded invoice:',
        error
      );
    }
  });
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

  getInwardDetailsByInvoice(): void {

  console.log(
    'Getting inward details for invoice:',
    this.invoiceNo
  );

  if (!this.invoiceNo) {
    console.error('Invoice number is empty.');
    return;
  }

  this.loader.show();

  this.partInwardService
    .getInwardPartDetailByInvoiceNo(this.invoiceNo)
    .subscribe({
      next: (res: any) => {

        console.log(
          'Part Inward API response:',
          res
        );

        if (!res) {

          console.error(
            'Part Inward API returned null for invoice:',
            this.invoiceNo
          );

          this.loader.hide();

          this.toaster.show(
            `No Part Inward details found for invoice ${this.invoiceNo}.`,
            {
              classname: 'bg-warning text-dark',
              delay: 5000
            }
          );

          return;
        }

        /*
         * ================================
         * HEADER DATA
         * ================================
         */

        this.partsInwardData.invoiceNo =
          res.invoiceNo ?? '';

        this.partsInwardData.invoiceDate =
          res.invoiceDate ?? '';

        this.partsInwardData.receiptDate =
          res.receiptDate ?? '';

        this.partsInwardData.selectedLocation =
          res.locationCode ?? '';

        this.partsInwardData.prefixNo =
          res.prefixNo ?? '';

        this.partsInwardData.documentNo =
          res.documentNo ?? '';

        this.partsInwardData.isAccepted =
          res.isAccepted ?? false;

        /*
         * These fields are not currently returned
         * by the API response you showed.
         */
        this.partsInwardData.purchaseNo =
          res.purchaseNo ?? '';

        this.partsInwardData.partyCode =
          res.partyCode ?? '';

        this.partsInwardData.sourceType =
          res.sourceType ?? 'DMS';

        /*
         * ================================
         * PART DETAILS
         * ================================
         */

        this.partsPurchaseDetails =
          res.partInwards ?? [];

        console.log(
          'Header data:',
          this.partsInwardData
        );

        console.log(
          'Part details:',
          this.partsPurchaseDetails
        );

        this.loader.hide();
      },

      error: (err) => {

        console.error(
          'Error loading Part Inward details:',
          err
        );

        this.loader.hide();

        this.toaster.show(
          'Unable to load Part Inward details.',
          {
            classname: 'bg-danger text-white',
            delay: 5000
          }
        );
      }
    });
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
  );
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
