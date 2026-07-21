import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { PartsInwardService } from '../../core/services/partsinwardservice';
import { error } from 'console';
import { LedgerMasterService } from '../../core/services/ledger-master';

@Component({
  selector: 'app-part-inward',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './part-inward.html',
  styleUrl: './part-inward.scss',
})
export class PartInward implements OnInit {
  partsInwardData: any = {
    poDate: '',
    selectedLocation: '',
    prefixNo: '',
    orderNo: '',
    partyName: '',
  }

  page = 1;
  pageSize = 10;

  lstPartsPurchaseDetails: any[] = [];
  partsPurchaseDetails: any[] = [];
  lstLocations: any[] = [];
  ledgerList: any[] = [];

  isSuperAdmin: boolean = false;
  dealerCode: string = '';

  constructor(
    private locationMasterService: LocationMasterService,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private partInwardService: PartsInwardService,
    private ledgerMasterService: LedgerMasterService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
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
        console.log(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', dealy: 5000 });
      }
    })
  }

  onLocationChange(event: any) {
    const locationCode = event.target.value;
    console.log(locationCode);
    this.getPartInwardByLocation(locationCode);
  }

  getPartInwardByLocation(locationCode: string) {
    this.loader.show();
    this.partInwardService.getPendingPartInwardDetailByLocation(locationCode).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onSave() {

  }

  get totalQty() {
    return 1;
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
    return 10;
  }

  refreshPage() {

  }

  searchRecords() {

  }


}
