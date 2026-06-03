import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LedgerMaster } from '../../ViewModels/LedgerMasterViewModel';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';

@Component({
  selector: 'app-vehicle-registrationdetails',
  imports: [FormsModule,CommonModule],
  templateUrl: './vehicle-registrationdetails.html',
  styleUrl: './vehicle-registrationdetails.scss',
})

export class VehicleRegistrationdetails implements OnInit {
  today = new Date().toISOString().split('T')[0];
  insurance: LedgerMaster[] = [];
  insuranceNotFound: boolean = false;
  showInsuranceDropdown: boolean = false;
  filteredInsurance: LedgerMaster[];
  constructor(private activeModal: NgbActiveModal,
    private receiptEntryService: ReceiptEntryService
    
  ) { }
  vehicleList: any[] = [];
  isInvoiced: boolean = false;
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
    insuranceName: '',
    insuranceId: null

  };
ngOnInit(): void {
  this.getInsuranceCompanies();
}
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
  
  this.selectedRow = row;
  this.editChassisNo = row.chassisNo;

  this.model = {
    chassisNo: row.chassisNo,
    regNo: row.regNo,
    regAmount: row.regAmount,
    insNo: row.insNo,
    insAmount: row.insuranceAmount,
    insStartDate: row.insStartDate,
    insExpDate: row.insExpDate,
    insuranceName: row.insuranceName,
    insuranceId: row.insuranceId
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
    insExpDate: this.model.insExpDate,
    insuranceName: this.model.insuranceName,
    insuranceId: this.model.insuranceId
  };

  this.editChassisNo = null;
}
addRow() {
  if (!this.selectedRow) return;

  // update selected row immediately (temporary UI update)
  this.selectedRow.chassisNo = this.model.chassisNo;
  this.selectedRow.regNo = this.model.regNo;
  this.selectedRow.regAmt = this.model.regAmount;
  this.selectedRow.insNo = this.model.insNo;
  this.selectedRow.insAmt = this.model.insAmount;
  this.selectedRow.insStartDate = this.model.insStartDate;
  this.selectedRow.insExpDate = this.model.insExpDate;
  this.selectedRow.insuranceName = this.model.insuranceName;
  this.selectedRow.insuranceId = this.model.insuranceId;
  

  // optional: clear selection after update
  this.selectedRow = null;
}
getInsuranceCompanies(){
  this.receiptEntryService.getLedgerByType('Insurance').subscribe({
      next: (res) => {
        this.insurance = res;
      }
    });
}
filterInsurance() {
  const search = (this.model.insuranceName || '').trim().toLowerCase();

  if (!search) {
    this.filteredInsurance = [];
    this.insuranceNotFound = false;
    return;
  }

  this.filteredInsurance = this.insurance.filter(x =>
    x.ledgerName?.toLowerCase().includes(search)
  );

  this.insuranceNotFound = this.filteredInsurance.length === 0;
}

selectInsurance(party: LedgerMaster) {
  this.model.insuranceName = party.ledgerName;
  this.model.insuranceId = party.id;
  this.filteredInsurance = [];
  this.insuranceNotFound = false;
}
onInsuranceFocus() {
  this.showInsuranceDropdown = true;
  this.filteredInsurance = [...this.insurance];
}

onInsuranceBlur() {
  setTimeout(() => {
    this.showInsuranceDropdown = false;
  }, 200);
}
}
