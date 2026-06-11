import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-new-design-prototype',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './new-design-prototype.html',
  styleUrl: './new-design-prototype.scss',
})
export class NewDesignPrototype {

  selectedItem = {
    modelType: 'Parts',
    vehType: 'Spares',
    itemName: '',
    itemDesc: '',
    itemCode: '',
    isElectric: '',
    noOfBatteries: 1,
    batteryType: '',
    batteryVoltage: '',
    motorType: 'PMSM',
    motorWatt: '1000 Watt',
    selectedGroup: 'Spares',
    uom: 'Pcs',
    hsncode: '',
    sgst: 9.00,
    cgst: 9.00,
    igst: 0.00,
    ugst: 0.00,
    gstCess: 0,
    tcs: 0,
    itemCategory: 'Vehicle',
    accessaryBilling: 'Yes',
    itemcc: 10,
    showRoomPrice: 97000,
    ipurrate: 0.00,
    custprice: 120000,
    serviceDays: 10,
    handlingCharge: 0,
    warrantyAmount: 0,
    insuranceAmount: 0,
    registerAmount: 0,
    remarks: 'This is a lorum ip sum',
    variant: '',
    colorName: 'Yellow',
    itemname: '',
    fame2amount: 5000,
    oemModelName: '',
    vehicleCategory: '',
    hsrp: '',
    warrantyPeriod: 60,
    warrantyPeriodUnit: 'Month'
  }

  constructor(private activeModal: NgbActiveModal) {
  }
  close() {
    this.activeModal.close();
  }
}
