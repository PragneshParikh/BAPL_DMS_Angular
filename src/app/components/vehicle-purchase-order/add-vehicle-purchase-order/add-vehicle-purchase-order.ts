import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-vehicle-purchase-order',
  imports: [FormsModule],
  templateUrl: './add-vehicle-purchase-order.html',
  styleUrl: './add-vehicle-purchase-order.scss',
})
export class AddVehiclePurchaseOrder {
model = {
    // Sale Info
    saleDate: '',
    d2d: '',
    location: '',
    saleType: '',
    saleTypeSwitch:'B2C',
    cashAccount: '',
    customerName: '',
    billingName: '',

    // Vehicle Details
    chassisNo: '',
    itemRate: null,
    battery: '',
    delivered: '',

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
    referralEmail: ''
  };
}
