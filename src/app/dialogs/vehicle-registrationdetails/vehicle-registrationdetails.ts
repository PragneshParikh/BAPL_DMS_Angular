import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-vehicle-registrationdetails',
  imports: [FormsModule,CommonModule],
  templateUrl: './vehicle-registrationdetails.html',
  styleUrl: './vehicle-registrationdetails.scss',
})

export class VehicleRegistrationdetails {
  today = new Date().toISOString().split('T')[0];
  constructor(private activeModal: NgbActiveModal
    
  ) { }
  vehicleList: any[] = [];
selectedRow: any = null;
editChassisNo: string | null = null;

  model = {
    chassisNo: '',
    regNo: '',
    regAmount: null,
    insNo: '',
    insAmount: null,
    insStartDate: this.today,
    insExpDate: this.getInsuranceExpiryDate(this.today),

  };

  getInsuranceExpiryDate(dateString: string): string {
    const date = new Date(dateString);

    date.setFullYear(date.getFullYear() + 1);
    date.setDate(date.getDate() - 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  updateVehicleSaleBill() {
     this.activeModal.close(this.vehicleList); // send data back

  }
 close() {
    this.activeModal.dismiss("closed");
  }
 editRow(row: any) {
  console.log(row);
  
  this.selectedRow = row;
  this.editChassisNo = row.chassisNo;

  this.model = {
    chassisNo: row.chassisNo,
    regNo: row.regNo,
    regAmount: row.regAmt,
    insNo: row.insNo,
    insAmount: row.insAmt,
    insStartDate: row.insStartDate,
    insExpDate: row.insExpDate
  };
}
saveRow() {
  if (!this.editChassisNo) return;

  const index = this.vehicleList.findIndex(
    v => v.chassisNo === this.editChassisNo
  );

  if (index === -1) return;

  this.vehicleList[index] = {
    ...this.vehicleList[index],
    regNo: this.model.regNo,
    regAmt: this.model.regAmount,
    insNo: this.model.insNo,
    insuranceAmount: this.model.insAmount,
    insStartDate: this.model.insStartDate,
    insExpDate: this.model.insExpDate
  };

  this.editChassisNo = null;
}
}
