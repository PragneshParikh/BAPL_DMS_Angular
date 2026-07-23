import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, viewChild } from '@angular/core';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { PartsInwardService } from '../../core/services/partsinwardservice';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from '../../layouts/topbar/topbar.component';

@Component({
  selector: 'app-part-inward',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './part-inward.html',
  styleUrl: './part-inward.scss',
})
export class PartInward implements OnInit {
  @ViewChild('partsInwardForm') partsInwardForm!: NgForm;
  @ViewChild(TopbarComponent) topbarComponent!: TopbarComponent;

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
  }

  page = 1;
  pageSize = 10;

  // lstPartsPurchaseDetails: any[] = [];
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
    private router: Router
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
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
          isAccepted: res.isAccepted
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

  // onLocationChange(event: any) {
  //   // const locationCode = event.target.value;
  //   // console.log(locationCode);
  //   // this.getPartInwardByLocation(locationCode);
  // }

  // getPartInwardByLocation(locationCode: string) {
  //   this.loader.show();
  //   this.partInwardService.getPendingPartInwardDetailByLocation(locationCode).subscribe({
  //     next: (res) => {
  //       this.loader.hide();
  //       console.log(res);
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.loader.hide();
  //       this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
  //     }
  //   })
  // }

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
        this.topbarComponent.getPartsInwardNotification();
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

  get totalSgst() {
    return 10;
  }

  get totalCgst() {
    return 10;
  }

  get totalIgst() {
    return 10;
  }

  get totalAmount() {
    return this.partsPurchaseDetails.reduce(
      (total, item) => total + (item.itemMrp || 0),
      0
    );
  }

  // refreshPage() { }

  // searchRecords() { }

  returnToList() {
    this.router.navigate(['/parts-inward']);
  }


}
