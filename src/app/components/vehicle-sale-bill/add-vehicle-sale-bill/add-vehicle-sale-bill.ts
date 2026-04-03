import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-vehicle-sale-bill',
  imports: [FormsModule],
  templateUrl: './add-vehicle-sale-bill.html',
  styleUrl: './add-vehicle-sale-bill.scss',
})
export class AddVehicleSaleBill {
    form!: FormGroup;

   today = new Date().toISOString().split('T')[0];;
model = {
    // Sale Info
    saleDate: this.today,
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
    preGSTDiscount: null,
    regAmount: null,
    insAmount: null,
    mfgYear: null,
    segment: '',
    institutional:'',
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

}
