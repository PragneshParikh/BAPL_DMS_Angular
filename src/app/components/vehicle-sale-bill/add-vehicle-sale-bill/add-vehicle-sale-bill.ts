import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LocationName } from '../../../ViewModels/ReceiptEntryModel';
import { LocationMasterService } from '../../../core/services/location-master-service';

@Component({
  selector: 'app-add-vehicle-sale-bill',
  imports: [FormsModule],
  templateUrl: './add-vehicle-sale-bill.html',
  styleUrl: './add-vehicle-sale-bill.scss',
})
export class AddVehicleSaleBill {
  form!: FormGroup;

  /**
   *
   */
  constructor(private storageService: StorageService,
    private locationService: LocationMasterService) {
  }
  locations: LocationName[] = [];
  today = new Date().toISOString().split('T')[0];
  model = {
    // Sale Info
    saleDate: this.today,
    d2d: '',
    location: '',
    saleType: '',
    saleTypeSwitch: 'B2C',
    cashAccount: '',
    customerName: '',
    billingName: '',

    // Vehicle Details
    chassisNo: '',
    itemRate: null,
    battery: '',
    delivered: '',
    preGSTDiscount: null,
    regAmount: null,
    insAmount: null,
    mfgYear: null,
    segment: '',
    institutional: '',
    scheme: '',

    // Extra Charges
    accessoryAmount: null,
    discount: null,
    handlingCharges: null,
    hpAmount: null,

    // Accessories
    itemName: '',
    qty: null,
    rate: null,

    // Referral
    referralName: '',
    referralMobile: '',
    referralEmail: '',
    referralPoint: null,
    referralRemarks: '',
  };

  fetchLocations(): void {
    // this.getNextReceiptNo();
    const dealerCode = this.storageService.getDealerCode();

    this.locationService.getLocationByDealerCode(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
        // if (!this.isEditMode && this.locations.length > 0) {
          this.model.location = this.locations[0].locname;
        // }
        console.log('Fetched locations:', this.locations);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
}
