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
    receiptDate: '',   // now stored/displayed as dd-MM-yyyy text, matching Invoice Date's format
    selectedLocation: '',
    prefixNo: '',
    purchaseNo: '',
    documentNo: '',
    partyCode: '',
    partyName: 'BGAUSS Auto Private Ltd',
    sourceType: 'dms',
    sourceTypeDisplay: 'DMS',
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

  private invoiceDataLoaded = false;

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
    private menuAccess: MenuAccessService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

  ngOnInit(): void {

    this.getLocationList();
    this.getLedgerList();

    this.route.params.subscribe(params => {

      const encClaim = params['invoiceNo'];

      console.log('Encoded invoice:', encClaim);

      if (!encClaim) {
        console.error('Invoice route parameter is missing.');
        return;
      }

      try {

        const decoded = atob(encClaim);

        console.log('Decoded invoice:', decoded);

        const parts = decoded.split('|');

        this.invoiceNo = parts[1]?.trim();

        console.log('Final invoice number sent to API:', this.invoiceNo);

        if (this.invoiceNo) {
          this.getInwardDetailsByInvoice();
        }

      } catch (error) {
        console.error('Invalid encoded invoice:', error);
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
      next: (res: any) => {
        this.ledgerList = (res ?? []).map((l: any) => ({
          ...l,
          ledgerCode: String(l.ledgerCode)
        }));
        this.loader.hide();

        this.resolvePartyCode();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  getInwardDetailsByInvoice(): void {

    console.log('Getting inward details for invoice:', this.invoiceNo);

    if (!this.invoiceNo) {
      console.error('Invoice number is empty.');
      return;
    }

    this.loader.show();

    this.partInwardService
      .getInwardPartDetailByInvoiceNo(this.invoiceNo)
      .subscribe({
        next: (res: any) => {

          console.log('Part Inward API response:', res);

          if (!res) {
            this.loader.hide();
            this.toaster.show(
              `No Part Inward details found for invoice ${this.invoiceNo}.`,
              { classname: 'bg-warning text-dark', delay: 5000 }
            );
            return;
          }

          /*
           * ================================
           * HEADER DATA
           * ================================
           */

          this.partsInwardData.invoiceNo = res.invoiceNo ?? '';
          this.partsInwardData.invoiceDate = res.invoiceDate ?? '';

          // CHANGED — Receipt Date is now stored/displayed as dd-MM-yyyy
          // text, matching Invoice Date's numeric format exactly. Convert
          // the API's ISO string on the way in; default to today when unset.
          this.partsInwardData.receiptDate = res.receiptDate
            ? this.isoToDisplayDate(res.receiptDate)
            : this.getTodayDisplayDate();

          this.partsInwardData.selectedLocation = res.locationCode ?? '';
          this.partsInwardData.prefixNo = res.prefixNo ?? '';
          this.partsInwardData.documentNo = res.documentNo ?? '';
          this.partsInwardData.isAccepted = res.isAccepted ?? false;
          this.partsInwardData.purchaseNo = res.purchaseNo ?? '';

          const backendSource = (res.sourceType ?? '').toString().trim().toLowerCase();
          this.partsInwardData.sourceType =
            backendSource === 'erp' || backendSource === 'dms' ? backendSource : 'dms';
          this.partsInwardData.sourceTypeDisplay = this.partsInwardData.sourceType.toUpperCase();

          /*
           * ================================
           * PART DETAILS
           * ================================
           */

          this.partsPurchaseDetails = res.partInwards ?? [];

          console.log('Header data:', this.partsInwardData);
          console.log('Part details:', this.partsPurchaseDetails);

          this.loader.hide();

          this.invoiceDataLoaded = true;
          this.resolvePartyCode();
        },

        error: (err) => {
          console.error('Error loading Part Inward details:', err);

          this.loader.hide();

          this.toaster.show(
            'Unable to load Part Inward details.',
            { classname: 'bg-danger text-white', delay: 5000 }
          );
        }
      });
  }

  private resolvePartyCode(): void {
    if (!this.invoiceDataLoaded) return;
    if (!this.ledgerList.length) return;

    const target = 'bgauss auto private ltd';

    let match = this.ledgerList.find((l: any) =>
      (l.ledgerName ?? '').toString().trim().toLowerCase() === target
    );

    if (!match) {
      match = this.ledgerList.find((l: any) =>
        (l.ledgerName ?? '').toString().trim().toLowerCase().includes('bgauss auto')
      );
      if (match) {
        console.warn('Exact match for "BGAUSS Auto Private Ltd" not found; used partial match:', match.ledgerName);
      }
    }

    if (match) {
      this.partsInwardData.partyCode = match.ledgerCode;
      this.partsInwardData.partyName = match.ledgerName;
    } else {
      console.warn('Ledger "BGAUSS Auto Private Ltd" not found in ledgerList — partyCode will be sent empty on Save.');
    }
  }

  // ===== Date helpers — dd-MM-yyyy display <-> yyyy-MM-dd (ISO) for the API =====

  private isoToDisplayDate(iso: string): string {
    const [yyyy, mm, dd] = iso.substring(0, 10).split('-');
    if (!yyyy || !mm || !dd) return '';
    return `${dd}-${mm}-${yyyy}`;
  }

  private displayDateToIso(display: string): string {
    const parts = (display ?? '').trim().split('-');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy) return '';
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  private getTodayDisplayDate(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  onSave() {
    if (this.partsInwardForm.invalid)
      return;

    // Build the payload separately so the ISO conversion doesn't overwrite
    // the dd-MM-yyyy value still shown in the form while the request is in flight.
    const payload = {
      ...this.partsInwardData,
      receiptDate: this.displayDateToIso(this.partsInwardData.receiptDate),
      updatedBy: this.storageService.getUserId(),
      updatedDate: new Date()
    };

    this.loader.show();
    this.partInwardService.updatePartInwardDetailByInvoiceNo(payload).subscribe({
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