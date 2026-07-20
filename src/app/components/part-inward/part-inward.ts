import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationMasterService } from '../../core/services/location-master-service';
import { LoaderService } from '../../core/services/loader';

@Component({
  selector: 'app-part-inward',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './part-inward.html',
  styleUrl: './part-inward.scss',
})
export class PartInward {
  partsInwardData: any = {
    poDate: '',
    selectedLocation: '',
    prefixNo: '',
    orderNo: '',
    partyName: '',
  }

  page = 1;
  pageSize = 10;

  partsPurchaseDetails: any[] = [];
  lstLocations: any[] = [];

  constructor(
    private locationMasterService: LocationMasterService,
    private loader: LoaderService
  ) { }

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
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
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



}
