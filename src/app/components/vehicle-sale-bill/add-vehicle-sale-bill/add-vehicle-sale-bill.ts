import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LocationName, ReceiptEntryModel } from '../../../ViewModels/ReceiptEntryModel';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { CommonModule } from '@angular/common';
import { BillFromOptions, BillingTypeOptions, CashTypeOptions, ErpOptions, SaleTypeOptions } from '../../../constant';
import { ReceiptEntryService } from '../../../core/services/receipt-entry-service';
import { LedgerMaster } from '../../../ViewModels/LedgerMasterViewModel';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';
import { NgbDropdown, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CustomerLedger } from '../../customer-ledger/customer-ledger';
import { VehicleSaleListChasisResponse } from '../../../ViewModels/VehicleSaleChasisResponse';
import { VehicleRegistrationdetails } from '../../../dialogs/vehicle-registrationdetails/vehicle-registrationdetails';
import { VehicleSaleBillResponseViewModel } from '../../../ViewModels/VehicleSaleBill';
import { text } from 'stream/consumers';
import { debug, log } from 'console';
import { PrefixService } from '../../../core/services/prefix';
import { forkJoin } from 'rxjs';
import { LedgerMasterService } from '../../../core/services/ledger-master';


@Component({
  selector: 'app-add-vehicle-sale-bill',
  imports: [FormsModule, CommonModule, NgbPaginationModule, NgbTooltipModule,
    VehicleRegistrationdetails, NgbModalModule, NgbDropdownModule],
  templateUrl: './add-vehicle-sale-bill.html',
  styleUrl: './add-vehicle-sale-bill.scss',
})
export class AddVehicleSaleBill implements OnInit {
  @ViewChild('vehicleSaleForm') vehicleSaleForm!: NgForm;
  form!: FormGroup;
  nextSaleNo: string;
  selectedReceipt: ReceiptEntryModel;
  private modalRef!: NgbModalRef;
  searchClicked: boolean;
  selectedCustomerId: number;
  chassisList: VehicleSaleListChasisResponse[] = [];
  Status: any;
  isErpLocked: boolean;
  isInvoiced: boolean;
  filteredChassis: any[] = [];
  showDropdown = false;
  showNotFound = false;
  insurance: LedgerMaster[];
  filteredInsurance: LedgerMaster[];
  showInsuranceDropdown: boolean;
  insuranceParties: any;
  insuranceNotFound: boolean;
  isSuperAdmin: boolean;
  filterChassisList: VehicleSaleListChasisResponse[];


  /**
   *
   */
  constructor(private storageService: StorageService,
    private locationService: LocationMasterService,
    private receiptEntryService: ReceiptEntryService,
    private vehicleSaleBillService: VehicleSaleBillService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router,
    private prefixService: PrefixService,
    private ledgerService:LedgerMasterService
  ) {

  }

  locations: any[] = [];
  vehicleList: any[] = [];
  editingIndex: number = -1;
  billId: number | null = null;
  isSubmitted: boolean = false;
  page = 1;
  pageSize = 10;
  products: any[] = [];
  saleTypeOptions = SaleTypeOptions;
  billingTypeOptions = BillingTypeOptions;
  billFromOptions = BillFromOptions;
  CashTypeOptions = CashTypeOptions;
  financiers: LedgerMaster[] = [];
  parties: LedgerMaster[] = [];
  filteredParties: LedgerMaster[] = [];
  ERP_STATUS = ErpOptions;
  today = new Date().toISOString().split('T')[0];
  model = {
    itemCode: '',
    dealerCode:'',
    colour: '',
    amount: null,
    stockDetailNo: '',
    vcu: '',
    accessoryAmount: null,
    extWarranty: 'N',
    batteryChemical: '',
    batteryCapacity: '',
    batteryMake: '',
    convertorNo: '',
    chargerNo: '',
    controllerNo: '',
    keyBookNo: '',

    // Sale Info
    saleBillNo: '',
    saleDate: this.today,
    customerSaleDate: null,
    location: '',
    saleType: 'Credit',
    customerType: 'B2C',
    cashAccount: '',
    customerName: '',
    ledgerId:null,
    billingName: '',
    billingType: null,
    billFrom: '',
    salesExecutive: '',
    tempRegRequired: 'no',
    tempRegNo: '',
    bookingId: '',
    printType: '',
    isD2D: false,
    financier: '',
    chargerNoFull: '',

    // Vehicle Details
    chassisNo: '',
    itemRate: null,
    battery: '',
    delivered: 'Y',
    preGSTDiscount: null,
    postGSTDiscount: null,
    regAmount: null,
    insNo: '',
    insAmount: null,
    mfgYear: 0,
    segment: '',
    institutional: '',
    scheme: '',
    kit: 'N',
    exchange: 'N',
    narration: '',
    insStartDate: this.today,
    insuranceName: '',
      insuranceId: null,

    insExpDate: this.getInsuranceExpiryDate(this.today),


    // Extra Charges
    discount: null,
    handlingCharges: null,
    hpAmount: null,

    // Accessories
    itemName: '',
    qty: null,
    rate: null,
    fameIIAmnt: 0,

    // Referral
    referralName: '',
    referralMobile: '',
    referralEmail: '',
    referralPoint: null,
    referralRemarks: '',
    sgstper: 0,
    sgst: 0,
    regNo: '',

    cgstper: 0,
    cgst: 0,

    igstper: 0,
    igst: 0,
    cess: 0,
    tcs: 0,
    finalAmount: 0,
    key: '',
    book: '',
    Status: ''

  };


  ngOnInit(): void {

    this.model.customerType = 'B2C';
    this.onCustomerTypeChange();
    this.getInsuranceCompanies();
    this.fetchLocations();
    this.getFinanciers();
    this.getParties();
    const bill = history.state?.bill;

    if (bill) {
      this.billId = bill.id;
      this.getBillById(this.billId);
    } else {
      this.getNextSaleBillNo();
    }
  }
  onStartDateChange() {
    if (this.model.insStartDate) {
      this.model.insExpDate = this.getNextYearDate(this.model.insStartDate);
    }
  }

  getNextYearDate(dateString: string): string {
    const date = new Date(dateString);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
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
onLocationChange()
{
  console.log("dsdaa");
  debugger;
   this.filteredChassis = this.chassisList.filter(p=>p.locationCode === this.model.location);
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

  loadBillForEdit(bill: any) {
    console.log(bill);
    if(bill.status === 'invoiced')
    {
      
      this.isInvoiced =true;
    }
    this.loader.show();
    
    //  Header fields
    this.model.saleBillNo = bill.saleBillNo;
    this.model.ledgerId=bill.ledgerId;
    this.model.saleDate = bill.saleDate ? bill.saleDate.split('T')[0] : '';
    this.model.dealerCode =bill.dealerCode;
    // this.model.location = bill.location;
    const locationObj = this.locations.find(
  x => x.locname === bill.location
);

this.model.location = locationObj
  ? locationObj.locCode
  : bill.location;
    this.model.saleType = bill.saleType;
    this.model.customerType = bill.customerType;
    this.model.billingType = bill.billType;
    this.model.customerName = bill.customerName;
    this.model.billingName = bill.billingName;
    this.model.financier = bill.financier;
    this.model.isD2D = bill.isD2d;
    this.selectedCustomerId = bill.ledgerId;
    this.model.cashAccount = bill.cashAc;
    this.model.salesExecutive = bill.salesExecutive;
    this.model.tempRegNo = bill.isTempRegNo;
    this.model.igstper = bill.details[0].igstper ?? '';
    this.model.sgstper = bill.details[0].sgstper ?? '';
    this.model.cgstper = bill.details[0].cgstper ?? '';
    this.model.tempRegRequired = bill.isTempRegNo ? 'yes' : 'no';


    this.vehicleList = bill.details.map((d: any) => ({

      chassisNo: d.chassisNo,
      modelName: d.itemName || d.modelName || '',
      colour: d.colour || '',
      mfgYear: d.mfgYear || '',
      insNo: d.insNo || '',
      regNo: d.regNo || '',
      itemCode: d.itemCode || '',
      rate: d.itemRate,
      regAmount: d.regAmount,
      insuranceAmount: d.insuranceAmount,
      preGstDiscount: d.preGstDiscount,
      postGstDiscount: d.postGstDiscount,
      fameIIAmnt: d.fameIIDisc || 0,
      insStartDate: d.insStartDate ? d.insStartDate.split('T')[0] : null,
      insExpDate: d.insExpDate ? d.insExpDate.split('T')[0] : null,

      amount: d.itemRate,
      taxableAmount: d.taxableAmount || (d.itemRate - d.preGstDiscount) || 0,

      sgstamnt: d.sgstamnt ?? d.sgst ?? 0,
      cgstamnt: d.cgstamnt ?? d.cgst ?? 0,
      igstamnt: d.igstamnt ?? d.igst ?? 0,

      sgstper: d.sgstper ?? 0,
      cgstper: d.cgstper ?? 0,
      igstper: d.igstper ?? 0,
      insuranceName: d.insuranceName || '',
      insuranceId: d.insuranceId || null,

      // sgst: d.sgstAmnt ?? d.sgst ?? 0,
      // cgst: d.cgstAmnt ?? d.cgst ?? 0,
      // igst: d.igstAmnt ?? d.igst ?? d.igstamnt?? 0,

      // sgstper: d.sgstper ?? 0,
      // cgstper: d.cgstper ?? 0,
      // igstper: d.igstper ?? 0,
      battery: d.battery || '',
      convertorNo: d.convertorNo || '',
      chargerNo: d.chargerNo || '',
      controllerNo: d.controllerNo || '',
      bookNo: d.bookNo || '',
      key: d.key || '',
      batteryChemical: d.batteryChemical || '',
      batteryCapacity: d.batteryCapacity || '',
      batteryMake: d.batteryMake || '',
      stockDetailNo: d.stockDetailsNo || '',
      vcu: d.vcu || '',

      kit: d.hasKit ? 'Y' : 'N',

      delivered: d.isDelivered ? 'Y' : 'N',

      cess: d.cess || 0,
      tcs: d.tcs || 0,

      finalAmount: d.finalAmount,
      saleDate: d.saleDate,
      motorNo: d.motorNo

    }));
    this.mergeBillChassisIntoDropdown();


    this.model.finalAmount = this.getGrandTotal();
    this.loader.hide();
    console.log(this.model);
    
  }



  loadChassisList(callback?: () => void) {
    const dealerCode = this.storageService.getDealerCode();

    this.vehicleSaleBillService.getAllChassisWithPDIStatus(dealerCode, this.selectedCustomerId)
      .subscribe({
        next: (res) => {
          this.chassisList=res;;
          console.log(this.chassisList);
          
          this.filteredChassis = res.filter(p=>p.locationCode === this.model.location);
          if (callback) callback();
        },
        error: () => {
          this.toaster.show('Failed to load chassis list', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
  }


  getBillById(id: number) {

    this.loader.show();
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        console.log(res);
        
        this.loader.hide();
        this.selectedCustomerId = res.ledgerId;
        this.Status = res.status || '';
        this.isErpLocked =
          this.Status.toLowerCase() === 'pushedtoerp';
        if (this, this.Status.toLowerCase() === 'invalid') {
          this.toaster.show('The chassis alocated with this bill has been sold out.Please realocate the chassis and try again.',
            {
              classname: 'bg-warning text-white',
              delay: 10000
            }
          );
        }
        this.isInvoiced = this.Status.toLowerCase() === 'invoiced';

        // Load chassis FIRST, then bind bill
        this.loadChassisList(() => {
          this.loadBillForEdit(res);
          if ((this.Status == 'Alloted' || this.Status == 'Pending') && this.vehicleList.some(v => v.regNo == '' && v.insNo == '' || (v.regAmount === 0 || v.insuranceAmount === 0))) {
            this.openRegistrationModal();
          }
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  fetchLocations(): void {
    const dealerCode: any = this.storageService.getDealerCode();

    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        console.log(data);
        
        this.locations = data.filter(i=>i.locareadidNo ===1);

        if (this.locations.length > 0 && !this.billId) {
          this.model.location = this.locations[0].locCode || this.locations[0].locCode;
        }
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  getFinanciers() {

    this.receiptEntryService.getLedgerByType('Financier').subscribe({
      next: (res) => {
        this.financiers = res;

      }
    });
  }
  onSaleTypeChange() {
    if (this.model.saleType === 'Cash') {
      this.model.financier = null;
    } else if (this.model.saleType === 'Credit') {
      this.model.cashAccount = null;
    }
  }

  getNextSaleBillNo() {
    const dealerCode = this.storageService.getDealerCode();

    this.prefixService.getPrefixByDealerByModule(dealerCode, 'sale_bill')
      .subscribe({
        next: (res: string) => {
          this.model.saleBillNo = res;
        },
        error: (err) => {
          console.error('Error fetching prefix:', err);
        }
      });
  }
  selectReceipt(item: ReceiptEntryModel) {
    this.selectedReceipt = item;

    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null; // reset reference
    }
  }


  isCustomerValid(): boolean {
    if (!this.model.customerName) return false;
    return this.parties.some(
      p => p.ledgerName.toLowerCase() === this.model.customerName.toLowerCase()
    );
  }


  saveVehicleDetailsOnly() {
    const payload = this.buildPayload();

    this.vehicleSaleBillService.createVehicleSaleBill(payload).subscribe({
      next: (res: number) => {
        this.billId = res;

        this.toaster.show('Vehicle Details Saved', {
          classname: 'bg-success text-light',
          delay: 3000
        });
        this.router.navigate(['/vehicle-sale-bill']);
      },
      error: () => {
        this.toaster.show('Failed to save', {
          classname: 'bg-danger text-light',
          delay: 3000
        });
      }
    });
  }
  getGrandTotal(): number {
    return this.vehicleList.reduce((sum, row) => {
      return sum + (row.finalAmount || 0);
    }, 0);
  }
  onD2DChange() {
  this.model.customerName = '';
  this.model.billingName = '';
  this.selectedCustomerId = null;
  this.getParties();
  this.onChassisChange();
}

  addVehicle(form: NgForm) {
    if (
      this.model.billingType === 2 &&
      this.vehicleList.length >= 1 &&
      this.editingIndex === -1
    ) {
      this.toaster.show('Only one chassis allowed for Counter Sale!', {
        classname: 'bg-warning text-dark',
        delay: 3000
      });
      return;
    }

    const taxable = this.calculateAmount();
    this.calculateTaxes();
    const gstTotal = this.model.sgst + this.model.cgst + this.model.igst;
    const postGstDisc = this.model.postGSTDiscount || 0;
    const fameDisc = this.model.fameIIAmnt || 0;
    const totalPostDisc = postGstDisc + fameDisc;
    const totalPostAmount = (this.model.cess || 0) +
      (this.model.tcs || 0) +
      (this.model.insAmount || 0) +
      (this.model.regAmount || 0);

    const finalAmount = taxable + gstTotal + totalPostAmount - totalPostDisc;

    const vehicle = {
      id: this.editingIndex > -1 ? this.vehicleList[this.editingIndex].id : undefined,
      chassisNo: this.model.chassisNo,

      modelName: this.model.itemName || '',

      colour: this.model.colour,
      mfgYear: this.model.mfgYear,
      insNo: this.model.insNo,
      regNo: this.model.regNo,
      insStartDate: this.model.insStartDate || null,
      insExpDate: this.model.insExpDate || null,
      taxableAmount: taxable,
      insuranceName: this.model.insuranceName || '',
      insuranceId: this.model.insuranceId || null,

      rate: this.model.itemRate,
      regAmount: this.model.regAmount,
      insuranceAmount: this.model.insAmount,
      preGstDiscount: this.model.preGSTDiscount,
      fameIIAmnt: this.model.fameIIAmnt,
      postGstDiscount: this.model.postGSTDiscount,
      ledgerId: this.selectedCustomerId || null,

      sgstper: this.model.sgstper,
      sgst: this.model.sgst,
      cgstper: this.model.cgstper,
      cgst: this.model.cgst,
      igstper: this.model.igstper,
      igst: this.model.igst,
      itemCode: this.model.itemCode || '',
      battery: this.model.battery || '',
      convertorNo: this.model.convertorNo || '',
      chargerNo: this.model.chargerNo || '',
      controllerNo: this.model.controllerNo || '',

      key: this.model.key || '',
      bookNo: this.model.book || '',

      extWarranty: this.model.extWarranty || '',

      //    BATTERY
      batteryChemical: this.model.batteryChemical || '',
      batteryCapacity: this.model.batteryCapacity || '',
      batteryMake: this.model.batteryMake || '',

      stockDetailNo: this.model.stockDetailNo || '',
      vcu: this.model.vcu || '',

      delivered: this.model.delivered,
      customerSaleDate: this.model.customerSaleDate,

      finalAmount: finalAmount
    };

    this.model.finalAmount = this.getGrandTotal();
    if (this.editingIndex > -1) {
      this.vehicleList[this.editingIndex] = vehicle;
      this.editingIndex = -1;
    } else {
      this.vehicleList.push(vehicle);
    }
    this.model.finalAmount = this.getGrandTotal();
    if (this.vehicleSaleForm?.controls) {
      const fieldsToReset = ['chassisNo', 'regNo', 'insNo'];

      fieldsToReset.forEach(field => {
        const control = this.vehicleSaleForm.controls[field];
        if (control) {
          control.reset();
          control.markAsPristine();
          control.markAsUntouched();
        }
      });
    }
    this.resetVehicleForm();
  }
  calculateAmount() {
    const rate = this.model.itemRate || 0;
    const discount = this.model.preGSTDiscount || 0;
    const fameIIAmnt = this.model.fameIIAmnt || 0;

    return rate - discount;
  }


  editVehicle(dataRow: any) {
    this.editingIndex = this.vehicleList.findIndex(v => v.chassisNo === dataRow.chassisNo);
    const selected = dataRow;
    this.model.chassisNo = selected.chassisNo;
    this.model.itemName = selected.modelName || selected.model || '';
    this.model.itemRate = selected.rate ?? 0;
    this.model.preGSTDiscount = selected.preGstDiscount || 0;
    this.model.postGSTDiscount = selected.postGstDiscount || 0;
    this.model.fameIIAmnt = selected.fameIIAmnt || 0;

    this.model.itemCode = selected.model;
    this.model.itemRate = selected.rate ?? 0;
    this.model.postGSTDiscount = selected.postGstDiscount || 0;
    this.model.fameIIAmnt = selected.fameIIAmnt || 0;

    this.model.regAmount = selected.regAmount ?? 0;
    this.model.insAmount = selected.insuranceAmount ?? 0;

    this.model.amount = selected.amount - (selected.preGstDiscount || 0) || 0;
    this.model.sgst = selected.sgst ?? 0;
    this.model.cgst = selected.cgst ?? 0;
    this.model.igst = selected.igst ?? 0;


    this.model.colour = selected.colour;
    this.model.mfgYear = selected.mfgYear;

    this.model.insNo = selected.insNo;
    this.model.regNo = selected.regNo;

    this.model.battery = selected.battery;
    this.model.convertorNo = selected.convertorNo;
    this.model.chargerNo = selected.chargerNoFull || selected.chargerNo;
    this.model.controllerNo = selected.controllerNoFull || selected.controllerNo;

    this.model.key = selected.key || selected.keyBookNo;
    this.model.book = selected.bookNo || selected.keyBookNo;

    this.model.stockDetailNo = selected.stockDetailNo || '';
    this.model.vcu = selected.vcu || '';
    this.model.extWarranty = selected.extWarranty || '';

    this.model.batteryChemical = selected.batteryChemical || '';
    this.model.batteryCapacity = selected.batteryCapacity || '';
    this.model.batteryMake = selected.batteryMake || '';

    this.model.customerSaleDate = selected.customerSaleDate;
    this.model.insuranceName = selected.insuranceName || '';
this.model.insuranceId = selected.insuranceId || null;


    // DATES
    this.model.insStartDate = selected.insStartDate
      ? selected.insStartDate.split('T')[0]
      : '';

    this.model.insExpDate = selected.insExpDate
      ? selected.insExpDate.split('T')[0]
      : '';

    // DELIVERY FLAG
    this.model.delivered = selected.delivered || 'N';

    this.calculateVehicleAmounts();
    this.model.finalAmount = this.getGrandTotal();
  }

  deleteVehicle(index: number) {

    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this vehicle!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.vehicleList.splice(index, 1);

        this.toaster.show('Vehicle deleted', { classname: 'bg-success text-light', delay: 3000 });
      }

    });
  }
  onCustomerTypeChange() {
    if (this.model.customerType === 'B2B') {
      this.model.billingType = 1;
    }
    if (this.model.customerType === 'B2C') {
      this.model.billingType = 2;
    }
  }

  updateVehicleSaleBill(string?: string) {
    const payload = this.buildPayload();

    if (!this.billId) {
      this.toaster.show('Invalid Bill ID', { classname: 'bg-danger text-light', delay: 3000 });
      return;
    }

    this.vehicleSaleBillService.updateVehicleSaleBill(this.billId, payload).subscribe({
      next: () => {

        if (string !== 'proforma') {
          this.toaster.show('Updated Successfully', { classname: 'bg-success text-light', delay: 3000 });
          this.router.navigate(['/vehicle-sale-bill']);
        }
      },
      error: (err) => {
        console.error(err);
        this.toaster.show('Update Failed', { classname: 'bg-danger text-light', delay: 3000 });
      }
    });
  }
  buildPayload() {

    return {
      saleDate: new Date(),

      saleBillNo: this.model.saleBillNo,
      isD2d: this.model.isD2D,
      customerType: this.model.customerType,
      location: this.model.location,
      saleType: this.model.saleType,
      cashAccount: this.model.cashAccount,
      financier: this.model.financier,
      billType: this.model.billingType,
      billFrom: this.model.billFrom,
      customerName: this.model.customerName,
      billingName: this.model.billingName,
      salesExecutive: this.model.salesExecutive,
      tempRegNo: this.model.tempRegNo,
      bookingId: this.model.bookingId,
      printType: this.model.printType,
      ledgerId: this.selectedCustomerId || '',
      segment: this.model.segment || '',
      institutionalType: this.model.institutional || '',
      schemeName: this.model.scheme || '',
      narration: this.model.narration || '',
      refName: '',
      refAddress: '',
      refEmail: '',
      refPoint: 0,
      refRemarks: '',
      Status: !this.billId ? 'PerformaCreated' : '',
      dealerCode: this.storageService.getDealerCode(),


      totalAmount: this.model.finalAmount,

      details: this.vehicleList.map(v => ({
        id: v.id || 0,
        ChassisNo: v.chassisNo,

        ItemRate: Number(v.rate) || 0,
        PreGstDiscount: Number(v.preGstDiscount) || 0,
        taxableAmount: (Number(v.itemRate) || Number(v.rate) || 0) - (Number(v.preGstDiscount) || 0),
        RegAmount: Number(v.regAmount) || 0,
        InsuranceAmount: Number(v.insuranceAmount) || Number(v.insAmnt) || 0,
        Sgstper: Number(v.sgstper) || Number(v.sgstper) || 0,
        SgstAmnt: Number(v.sgst) || Number(v.sgstamnt) || 0,
        Cgstper: Number(v.cgstper) || Number(v.cgstper) || 0,
        CgstAmnt: Number(v.cgst) || Number(v.cgstamnt) || 0,
        Igstper: Number(v.igstper) || Number(v.igstper) || 0,
        IgstAmnt: Number(v.igst) || Number(v.igstamnt) || 0,
        PostGstDiscount: Number(v.postGstDiscount) || 0,
        FameIIDisc: Number(v.fameIIAmnt) || 0,

        HasDevice: false,
        HasKit: v.kit === 'Y',
        IsDelivered: v.delivered === 'Y',

        Segment: v.segment || '',
        InstitutionalType: v.institutional || '',
        SchemeName: v.scheme || '',
        Narration: '',

        MfgYear: Number(v.mfgYear) || 0,
        InsNo: v.insNo || '',
        RegNo: v.regNo || '',

        InsStartDate: v.insStartDate || null,
        InsExpDate: v.insExpDate || null,

        ModelName: v.modelName || v.itemName || v.model || '',
        Colour: v.colour || '',
        itemCode: v.itemCode || '',
        Battery: v.battery || '',
        ConvertorNo: v.convertorNo || '',
        ChargerNo: v.chargerNo || '',
        ControllerNo: v.controllerNo || '',

        Key: v.keyNo || '',
        BookNo: v.bookNo || '',

        ExtWarranty: v.extWarranty || '',

        BatteryChemical: v.batteryChemical || '',
        BatteryCapacity: v.batteryCapacity || '',
        BatteryMake: v.batteryMake || '',

        StockDetailsNo: v.stockDetailNo || '',
        Vcu: v.vcu || '',

        FinalAmount: Number(v.finalAmount) || 0,
        IsAgainstExchange: v.exchange === 'Y',
        customerSaleDate: v.customerSaleDate || null,
        insuranceName: v.insuranceName || '',
        insuranceId: v.insuranceId || null,
      }))
    };



  }
  getLedgerIdFromName(): number | null {
    const match = this.parties.find(p =>
      p.ledgerName?.toLowerCase() === this.model.customerName?.toLowerCase()
    );
    return match ? match.id : null;
  }
  isChassisUsed(chassisNo: string): boolean {
    return this.vehicleList.some(v => v.chassisNo === chassisNo);
  }
  // openCustomerLedgerAdd() {
  //   const modalRef = this.modalService.open(CustomerLedger, {
  //     size: 'lg',
  //     backdrop: 'static'
  //   });

  //   modalRef.componentInstance.defaultLedgerType = 'Party';

  //   modalRef.result.then((newId) => {
  //     if (newId) {

  //       // subscribe and act AFTER data comes
  //       this.receiptEntryService.getLedgerByType('Party').subscribe({
  //         next: (res) => {
  //           this.parties = res;

  //           // Force change detection via new reference
  //           this.parties = [...this.parties];

  //           //  OPTIONAL: auto-select newly added
  //           const added = this.parties.find(f => f.id === newId);
  //           if (added) {
  //             this.model.customerName = added.ledgerName;
  //             this.model.billingName = added.ledgerName;
  //           }
  //         }
  //       });
  //     }
  //   }).catch(() => { });
  // }

  openCustomerLedgerAdd(ledgerId?: number) {
    debugger
  const modalRef = this.modalService.open(CustomerLedger, {
    size: 'lg',
    backdrop: 'static'
  });

  modalRef.componentInstance.defaultLedgerType = 'Party';
  modalRef.componentInstance.fromReceiptEntry = true;

  // Edit mode
  if (this.billId) {
    modalRef.componentInstance.ledgerId = this.model.ledgerId;
  }

  modalRef.result.then((resultId) => {
    if (resultId) {
      this.receiptEntryService.getLedgerByType('Party').subscribe({
        next: (res) => {
          this.parties = [...res];

          const party = this.parties.find(x => x.id === resultId);
          if (party) {
            this.model.customerName = party.ledgerName;
            this.model.billingName = party.ledgerName;
          }
        }
      });
    }
  }).catch(() => {});
}


  getParties() {
    const dealerCode =this.storageService.getDealerCode();
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.ledgerService.getLedgerForSale(dealerCode,this.isSuperAdmin).subscribe({
      next: (res) => {
       if (this.model.isD2D) {
        this.parties = res.filter(
          p => p.ledgerType?.toLowerCase() === 'dealer'
        );
      } else {
        this.parties = res.filter(
          p => p.ledgerType?.toLowerCase() !== 'dealer'
        );
      }
        if (this.model.customerName && !this.selectedCustomerId) {
          const match = this.parties.find(p =>
            p.ledgerName?.toLowerCase() === this.model.customerName?.toLowerCase()
          );

          if (match) {
            this.selectedCustomerId = match.id;
          }
        }
      }
    });
  }

  filterParties() {
    const search = this.model.customerName?.trim().toLowerCase();

    if (!search) {
      this.filteredParties = [];
      return;
    }

    this.filteredParties = this.parties.filter(p =>
      p.ledgerName?.toLowerCase().includes(search)
    );
  }

  selectParty(party: LedgerMaster) {
    this.model.customerName = party.ledgerName;
    this.model.billingName = this.model.customerName;
    this.selectedCustomerId = party.id;
    this.filteredParties = [];
    this.chassisList = [];
    this.model.chassisNo = '';
    this.vehicleList = [];
    this.loadChassisList();

  }



  onSubmitToERP() {
    this.loader.show();
    const saleBillNo = this.billId;
    const dealerCode = this.storageService.getDealerCode();

    if (!saleBillNo) {
      this.toaster.show('Sale No is required!', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    this.vehicleSaleBillService.sendToERP(dealerCode, saleBillNo).subscribe({
  next: (res) => {

    const requests = res.vehicle.map((v: any) => {
      const payload = {
        user: res.user,
        vehicle: v
      };

      return this.vehicleSaleBillService.sendSaleBillToERP(payload);
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        this.loader.hide();
        this.redirectToSaleList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }
});
  }



  onChassisChange() {
    // if (!this.isCustomerValid()) {
    //   this.toaster.show('Select customer name before choosing chassis', {
    //     classname: 'bg-warning text-dark',
    //     delay: 3000
    //   });

    //   this.model.chassisNo = '';
    //   return;
    // }

    const selected = this.chassisList.find(      c => c.chassisNo === this.model.chassisNo    );

    if (!selected) return;

    if (!selected.pdiStatus || selected.pdiStatus === 'Not Done') {
      this.toaster.show('Please complete PDI before proceeding', {
        classname: 'bg-danger text-light',
        delay: 3000
      });

      this.model.chassisNo = '';
      return;
    }

    if (selected.proformaCreated) {
      this.toaster.show(
        `Proforma already generated fOR(Bill No: ${selected.proformaCreated}). Please select another chassis.`,
        {
          classname: 'bg-warning text-dark',
          delay: 5000
        }
      );
      this.model.chassisNo = '';
      return;
    }

    // Basic details
    this.model.itemCode = selected.itemCode;
    this.model.colour = selected.itemColor;
    this.model.itemName = selected.itemName;
    this.model.mfgYear = selected.mfgYear;
    this.model.customerSaleDate = selected.customerSaleDate;
    this.model.preGSTDiscount = selected.preGstDisc;

    // Battery & parts
    this.model.battery = selected.batteryNo;
    this.model.convertorNo = selected.converterNo;
    this.model.chargerNo = selected.chargerNo;
    this.model.controllerNo = selected.controllerNo;
    this.model.key = selected.keyNo;
    this.model.book = selected.bookNo;

    // Extra details
    this.model.batteryChemical = selected.batteryChemical;
    this.model.batteryCapacity = selected.batteryCapacity;
    this.model.batteryMake = selected.batteryMake;
    this.model.stockDetailNo = selected.stockNo;

    // GST
    this.model.sgstper = selected.sgstper;
    this.model.cgstper = selected.cgstper;
    this.model.igstper = selected.igstper;

    // Discount
    this.model.preGSTDiscount = selected.preGstDisc;
    this.model.fameIIAmnt = selected.fameIIAmnt;
    this.model.postGSTDiscount = selected.postGstDisc;

    //   D2D LOGIC
    if (this.model.isD2D) {
      this.model.itemRate = selected.dealerPrice;
    } else {
      this.model.itemRate = selected.customerPrice;
    }
    //this.calculateTaxes();
  }

  calculateTaxes() {
    const taxable = this.calculateAmount();


    this.model.sgst = taxable * (this.model.sgstper || 0) / 100;
    this.model.cgst = taxable * (this.model.cgstper || 0) / 100;
    this.model.igst = taxable * (this.model.igstper || 0) / 100;
  }


  resetVehicleForm() {
    this.model.chassisNo = '';
    this.model.itemRate = 0;
    this.model.preGSTDiscount = 0;
    this.model.amount = 0;
    this.model.sgst = 0;
    this.model.cgst = 0;
    this.model.igst = 0;
    this.model.regAmount = 0;
    this.model.insAmount = 0;
    this.model.mfgYear = 0;
    this.model.insNo = '';
    this.model.regNo = '';
    this.model.chassisNo = '';
    this.model.regNo = '';
    this.model.regAmount = 0;
    this.model.insNo = '';
    this.model.insAmount = 0;
    this.model.fameIIAmnt = 0;
    // this.model.postGSTDiscount=0;
  }

  resetSelectedFields() {
    this.model.chassisNo = '';
    this.model.regNo = '';
    this.model.regAmount = 0;

    this.model.insNo = '';
    this.model.insAmount = 0;
  }


  // isSaleInfoValid(): boolean {
  //   return !!(
  //     this.model.location &&
  //     this.model.saleType &&
  //     this.model.customerName &&
  //     this.isCustomerValid() &&
  //     this.model.billingName

  //   );
  // }

  isSaleInfoValid(): boolean {
    const isBasicValid =
      !!this.model.location &&
      !!this.model.saleType &&
      !!this.model.customerName &&
      this.isCustomerValid() &&
      !!this.model.billingName;

    //  Conditional validation
    if (this.model.saleType === 'Credit') {
      return isBasicValid && !!this.model.financier;
    }

    if (this.model.saleType === 'Cash') {
      return isBasicValid && !!this.model.cashAccount;
    }

    return isBasicValid;
  }

  canSave(): boolean {
    return this.isSaleInfoValid() && this.vehicleList.length > 0;
  }
  redirectToSaleList() {
    this.router.navigate(['/vehicle-sale-bill']);
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


  openRegistrationModal() {
    const modalRef = this.modalService.open(VehicleRegistrationdetails, { size: 'xl' });

    modalRef.componentInstance.vehicleList = this.vehicleList;
    modalRef.componentInstance.isInvoiced = this.isInvoiced;

    modalRef.result.then((updatedList) => {
      if (updatedList) {

        this.vehicleList = [...updatedList];


        //recalculate per-row finalAmount
        this.calculateVehicleAmounts();

        //grand total will include reg + ins
        this.model.finalAmount = this.getGrandTotal();

        if (this.billId) {
          this.updateVehicleSaleBill();
        }
      }
    });
  }
  isRegistrationComplete(): boolean {
    if (!this.vehicleList || this.vehicleList.length === 0) return false;

    return this.vehicleList.every(v =>
      v.regNo &&
      v.insNo &&
      v.insStartDate &&
      v.insExpDate
    );
  }

  //for edit chassis(Once resererved)
  mergeBillChassisIntoDropdown() {
    if (!this.vehicleList?.length) return;

    this.vehicleList.forEach(v => {
      const exists = this.chassisList.some(c => c.chassisNo === v.chassisNo);

      if (!exists) {
        this.chassisList.push({
          chassisNo: v.chassisNo,
          itemCode: '',
          itemName: v.modelName,
          itemColor: v.colour,
          mfgYear: v.mfgYear,
          customerSaleDate: null,
          preGstDisc: 0,
          batteryNo: '',
          converterNo: '',
          chargerNo: '',
          controllerNo: '',
          keyNo: '',
          bookNo: '',
          batteryChemical: '',
          batteryCapacity: '',
          batteryMake: '',
          stockNo: '',
          sgstper: 0,
          cgstper: 0,
          igstper: 0,
          dealerPrice: 0,
          customerPrice: 0
        } as any);
      }
    });
  }

  calculateVehicleAmounts() {
    this.vehicleList = this.vehicleList.map(v => {

      const taxable =
        (v.rate || 0) -
        (v.preGstDiscount || 0);

      const sgst = taxable * (v.sgstper || 0) / 100;
      const cgst = taxable * (v.cgstper || 0) / 100;
      const igst = taxable * (v.igstper || 0) / 100;

      const finalAmount =
        taxable +
        sgst +
        cgst +
        igst +
        (v.cess || 0) +
        (v.tcs || 0) +
        (v.regAmount || 0) +       
        (v.insuranceAmount || 0) -
        (v.postGstDiscount || 0)
        - v.fameIIAmnt
        ;       

      return {
        ...v,
        sgst,
        cgst,
        igst,
        finalAmount
      };
    });
  }


 
  printExShowroomInvoice() {

    this.router.navigate(
      ['add-vehicle-sale-bill/performaInvoice', this.billId],
      {
        queryParams: {
          type: 'ex'
        }
      }
    );

  }

  printOnRoadInvoice() {

    this.router.navigate(
      ['add-vehicle-sale-bill/performaInvoice', this.billId],
      {
        queryParams: {
          type: 'onroad'
        }
      }
    );

  }
  printSaleLetter() {
    this.router.navigate(['sale-Letter', this.billId]);
  }

  printDeliverySlip() {
    debugger
    if (!this.vehicleList.length) return;

    const vehicle = this.vehicleList[0];

    this.router.navigate(['/delivery-slip'], {

      queryParams: {
        partyName: this.model.customerName,
        modelName: vehicle.modelName,
        chassisNo: vehicle.chassisNo,
        motorNo: vehicle.motorNo,
        regNo: vehicle.regNo,
        dealerCode:this.model.dealerCode
      }
    });
  }

  printForm22() {
    if (!this.vehicleList.length) return;

    const chassisNo = this.vehicleList[0].chassisNo;

    this.router.navigate(['form22-certificate', chassisNo]);
  }

  printDeliveryChecklist() {
    this.router.navigate(['/delivery-checkList']);
  }

  //temporary implementation--will modify once we have delivery certificate API ready
  printDeliveryCertificate() {
    this.router.navigate(['add-vehicle-sale-bill/delivery-certificate', this.billId]);

  }

  navigateToPerformaInvoice() {
    // this.model.erpstatus = 'Alloted';
    // this.updateVehicleSaleBill("proforma");
    this.router.navigate(['add-vehicle-sale-bill/performaInvoice', this.billId]);
  }

  //To be modified later based on API response
  connfirmInvoiceGeneration() {
    this.isInvoiced = true;
    this.vehicleSaleBillService.confirmInvoice(this.model.saleBillNo).subscribe({
      next: (res: number) => {

        if (res !== 0) {
          this.onSubmitToERP();
          this.toaster.show('Invoice Generated Successfully', { classname: 'bg-success text-light', delay: 3000 });

        }
        else {
          this.toaster.show('Failed to Generate Invoice', { classname: 'bg-danger text-light', delay: 3000 });
          this.isInvoiced = false;
        }
      },
      error: () => {
        this.isInvoiced = false;
        this.toaster.show('Failed to Generate Invoice', { classname: 'bg-danger text-light', delay: 3000 });
      }
    });
  }
  // onCustomerNameChange()
  // {
  //   this.model.billingName =this.model.customerName;
  // }

  filterChassis() {
    const search = (this.model.chassisNo || '').toLowerCase();
 const locationWiseChassis = this.chassisList.filter(
    p => p.locationCode === this.model.location
  );
    this.filteredChassis = locationWiseChassis.filter(c =>
      c.chassisNo.toLowerCase().includes(search)
    );

    this.showNotFound =
      search.length > 0 && this.filteredChassis.length === 0;
  }

  selectChassis(c: any) {
    if (this.isChassisUsed(c.chassisNo)) return;

    this.model.chassisNo = c.chassisNo;
    this.showDropdown = false;
    this.showNotFound = false;

    this.onChassisChange();
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  onFocusChassis() {
    this.showDropdown = true;

    // show all options initially
   this.filteredChassis = this.chassisList.filter(
    p => p.locationCode === this.model.location
  );

    this.showNotFound = false;
  }
}
