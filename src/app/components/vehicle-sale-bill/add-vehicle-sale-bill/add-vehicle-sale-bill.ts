import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LocationName, ReceiptEntryModel } from '../../../ViewModels/ReceiptEntryModel';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { CommonModule } from '@angular/common';
import { BillFromOptions, BillingTypeOptions, CashTypeOptions, ERP_STATUS, SaleTypeOptions } from '../../../constant';
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


@Component({
  selector: 'app-add-vehicle-sale-bill',
  imports: [FormsModule, CommonModule, NgbPaginationModule, NgbTooltipModule,
     VehicleRegistrationdetails,NgbModalModule,NgbDropdownModule],
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
  erpStatus: any;
  isErpLocked: boolean;
  isInvoiced: boolean;

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
  ) {

  }

  locations: LocationName[] = [];
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
  ERP_STATUS = ERP_STATUS;
  today = new Date().toISOString().split('T')[0];
  model = {
    itemCode: '',
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
    billingName: '',
    billingType: '',
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
    insExpDate: this.getInsuranceExpiryDate(this.today),


    // Extra Charges
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
    sgstPer: 0,
    sgst: 0,
    regNo: '',

    cgstPer: 0,
    cgst: 0,

    igstPer: 0,
    igst: 0,
    cess: 0,
    tcs: 0,
    finalAmount: 0,
    key: '',
    book: '',
    erpstatus: ''

  };


  ngOnInit(): void {
    this.model.customerType = 'B2C';
    this.onCustomerTypeChange();
    this.loadChassisList();
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


  loadBillForEdit(bill: any) {
    console.log(bill, "sd");

    //  Header fields
    this.model.saleBillNo = bill.saleBillNo;
    this.model.saleDate = bill.saleDate ? bill.saleDate.split('T')[0] : '';
    this.model.location = bill.location;
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
    this.model.tempRegRequired = bill.isTempRegNo ? 'yes' : 'no';

    this.vehicleList = bill.details.map((d: any) => ({

      chassisNo: d.chassisNo,
      model: d.itemName || d.modelName || '',
      colour: d.colour || '',
      mfgYear: d.mfgYear || '',
      insNo: d.insNo || '',
      regNo: d.regNo || '',

      rate: d.itemRate,
      regAmt: d.regAmount,
      insAmt: d.insuranceAmount,
      preGstDiscount: d.preGstDiscount,
      insStartDate: d.insStartDate ? d.insStartDate.split('T')[0] : null,
      insExpDate: d.insExpDate ? d.insExpDate.split('T')[0] : null,

      amount: (d.itemRate || 0) - (d.preGstDiscount || 0),

      sgst: d.sgstamnt ?? d.sgst ?? 0,
      cgst: d.cgstamnt ?? d.cgst ?? 0,
      igst: d.igstamnt ?? d.igst ?? 0,

      sgstPer: d.sgstper ?? 0,
      cgstPer: d.cgstper ?? 0,
      igstPer: d.igstper ?? 0,
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
      saleDate: d.saleDate

    }));
  this.mergeBillChassisIntoDropdown();


    this.model.finalAmount = this.getGrandTotal();
  }
 


  loadChassisList(callback?: () => void) {
    const dealerCode = this.storageService.getDealerCode();

    this.vehicleSaleBillService.getChassisListPDIOK(dealerCode)
      .subscribe({
        next: (res) => {
          this.chassisList = res;
          console.log('Chassis API Response:', res); 

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
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        console.log('Bill Data:', res);

        this.erpStatus = res.erpStatus || '';
        this.isErpLocked =
        this.erpStatus.toLowerCase() === 'pushedtoerp';
        this.isInvoiced = this.erpStatus.toLowerCase() === 'invoiced';
        
        // Load chassis FIRST, then bind bill
        this.loadChassisList(() => {
          this.loadBillForEdit(res);
          if(this.erpStatus=='Alloted' && this.vehicleList.some(v=>v.regNo ==''&& v.insNo=='' || (v.regAmt === 0 || v.insAmt === 0))) {
            this.openRegistrationModal();
          }
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  fetchLocations(): void {
    const dealerCode: any = this.storageService.getDealerCode();

    this.locationService.getLocationByDealerCode(dealerCode).subscribe({
      next: (data: any[]) => {
        this.locations = data;

        if (this.locations.length > 0 && !this.billId) {
          this.model.location = this.locations[0].locname || this.locations[0].locname;
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
    this.vehicleSaleBillService.getNextSaleBillNo().subscribe({
      next: (data) => {
        this.model.saleBillNo = data;
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
    console.log('Payload for Vehicle Details Only:', payload);

    this.vehicleSaleBillService.createVehicleSaleBill(payload).subscribe({
      next: () => {
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
    this.onChassisChange(); // reapply rate + GST logic
  }

  addVehicle(form: NgForm) {

    if (
      this.model.billingType === 'Counter Sale[single]' &&
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

    // const gstTotal = this.model.isD2D
    //   ? 0
    //   : (this.model.sgst + this.model.cgst + this.model.igst);
    const gstTotal = this.model.sgst + this.model.cgst + this.model.igst; 

    const finalAmount =
      taxable +
      gstTotal +
      (this.model.cess || 0) +
      (this.model.tcs || 0) +
      (this.model.insAmount || 0) +
      (this.model.regAmount || 0);

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

      rate: this.model.itemRate,
      regAmt: this.model.regAmount,
      insAmt: this.model.insAmount,
      preGstDiscount: this.model.preGSTDiscount,
      ledgerId: this.selectedCustomerId || null,

      sgstPer: this.model.sgstPer,
      sgst: this.model.sgst,
      cgstPer: this.model.cgstPer,
      cgst: this.model.cgst,
      igstPer: this.model.igstPer,
      igst: this.model.igst,

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

    this.model.finalAmount = this.getGrandTotal();;
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

    return rate - discount;
  }


  editVehicle(dataRow: any) {

    const selected = dataRow;
    console.log(selected, "sele");
    this.model.chassisNo = selected.chassisNo;
    this.model.itemName = selected.modelName || selected.model || '';
    this.model.itemRate = selected.rate ?? 0;
    this.model.preGSTDiscount = selected.preGstDiscount || 0;

    this.model.itemCode = selected.model;
    this.model.itemRate = selected.rate ?? 0;
    this.model.preGSTDiscount = selected.preGstDiscount || 0;

    this.model.regAmount = selected.regAmt ?? 0;
    this.model.insAmount = selected.insAmt ?? 0;

    this.model.amount = selected.amount ?? 0;
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
      this.model.billingType = 'Dealer Sale/Institutional';
    }
    if (this.model.customerType === 'B2C') {
      this.model.billingType = 'Counter Sale[single]';
    }
  }
  updateVehicleSaleBill() {
    const payload = this.buildPayload();

    if (!this.billId) {
      this.toaster.show('Invalid Bill ID', { classname: 'bg-danger text-light', delay: 3000 });
      return;
    }

    this.vehicleSaleBillService.updateVehicleSaleBill(this.billId, payload).subscribe({
      next: () => {
        this.toaster.show('Updated Successfully', { classname: 'bg-success text-light', delay: 3000 });
        // this.router.navigate(['/vehicle-sale-bill']);
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
      erpStatus: !this.billId ? ERP_STATUS.PENDING : '',


      totalAmount: this.model.finalAmount,

      details: this.vehicleList.map(v => ({
        id: v.id || 0,
        ChassisNo: v.chassisNo,

        ItemRate: Number(v.rate) || 0,
        PreGstDiscount: Number(v.preGstDiscount) || 0,
        taxableAmount: (Number(v.itemRate) || 0) - (Number(v.preGstDiscount) || 0),
        RegAmount: Number(v.regAmt) || 0,
        InsuranceAmount: Number(v.insuranceAmount) || 0,
        Sgstper: Number(v.sgstPer) || 0,
        SgstAmnt: Number(v.sgst) || 0,
        Cgstper: Number(v.cgstPer) || 0,
        CgstAmnt: Number(v.cgst) || 0,
        Igstper: Number(v.igstPer) || 0,
        IgstAmnt: Number(v.igst) || 0,

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

        ModelName: v.modelName || v.itemName || '',
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
        customerSaleDate: v.customerSaleDate || null
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
  openCustomerLedgerAdd() {
    const modalRef = this.modalService.open(CustomerLedger, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.defaultLedgerType = 'Party';

    modalRef.result.then((newId) => {
      if (newId) {

        // subscribe and act AFTER data comes
        this.receiptEntryService.getLedgerByType('Party').subscribe({
          next: (res) => {
            this.parties = res;

            // Force change detection via new reference
            this.parties = [...this.parties];

            //  OPTIONAL: auto-select newly added
            const added = this.parties.find(f => f.id === newId);
            if (added) {
              this.model.customerName = added.ledgerName;
              this.model.billingName = added.ledgerName;
            }
          }
        });
      }
    }).catch(() => { });
  }


  getParties() {
    this.receiptEntryService.getLedgerByType('Party').subscribe({
      next: (res) => {
        this.parties = res.filter(p =>
          p.ledgerType?.toLowerCase() === 'party'
        );

        //       FIX: Rebind selectedCustomerId using name
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

    this.selectedCustomerId = party.id;

    this.filteredParties = [];
  }



  onSubmitToERP() {
    this.loader.show();
    const saleBillNo = this.billId;

    if (!saleBillNo) {
      this.toaster.show('Sale No is required!', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    this.vehicleSaleBillService.sendToERP(saleBillNo).subscribe({
      next: (res) => {
        this.loader.hide();
        this.redirectToSaleList();
        this.toaster.show('Successfully pushed to ERP', {
          classname: 'bg-success text-white',
          delay: 5000
        });
      },
      error: (err) => {
        this.toaster.show('Failed to push to ERP', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }



  onChassisChange() {
    const selected = this.chassisList.find(
      c => c.chassisNo === this.model.chassisNo
    );

    if (!selected) return;

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
    this.model.sgstPer = selected.sgstPer;
    this.model.cgstPer = selected.cgstPer;
    this.model.igstPer = selected.igstPer;

    // Discount
    this.model.preGSTDiscount = selected.preGstDisc;

    //   D2D LOGIC
    if (this.model.isD2D) {
      this.model.itemRate = selected.dealerPrice;
    } else {
      this.model.itemRate = selected.customerPrice;
    }
    this.calculateTaxes();
  }

  calculateTaxes() {
    const baseAmount = this.calculateAmount();

    //   If D2D → NO GST
    if (this.model.isD2D) {
      this.model.sgst = 0;
      this.model.cgst = 0;
      this.model.igst = 0;
      return;
    }

    //   Normal GST
    this.model.sgst = (baseAmount * (this.model.sgstPer || 0)) / 100;
    this.model.cgst = (baseAmount * (this.model.cgstPer || 0)) / 100;
    this.model.igst = (baseAmount * (this.model.igstPer || 0)) / 100;
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
  }

  resetSelectedFields() {
    this.model.chassisNo = '';
    this.model.regNo = '';
    this.model.regAmount = 0;

    this.model.insNo = '';
    this.model.insAmount = 0;
  }

  
  isSaleInfoValid(): boolean {
    return !!(
      this.model.location &&
      this.model.saleType &&
      this.model.customerName &&
      this.isCustomerValid() &&
      this.model.billingName

    );
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

//for edit chassis
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
        sgstPer: 0,
        cgstPer: 0,
        igstPer: 0,
        dealerPrice: 0,
        customerPrice: 0
      } as any);
    }
  });
}

calculateVehicleAmounts() {
  this.vehicleList = this.vehicleList.map(v => {

    const taxable =
      (v.rate || 0) - (v.preGstDiscount || 0);

    const gst =
      (v.sgst || 0) +
      (v.cgst || 0) +
      (v.igst || 0);

    const finalAmount =
      taxable +
      gst +
      (v.cess || 0) +
      (v.tcs || 0) +
      (v.regAmt || 0) +        // REGISTRATION ADDED
      (v.insAmt || 0);         //  INSURANCE ADDED

    return {
      ...v,
      finalAmount
    };
  });
}


printLastSaved() {
  console.log('Print Last Saved');
}

printInvoice() {
  console.log('Print Invoice');
}

printSaleLetter() {
  console.log('Print Sale Letter');
}

printDeliverySlip() {
  console.log('Print Delivery Slip');
}

printForm22() {
  console.log('Print Form 22');
}

printDeliveryChecklist() {
  console.log('Print Delivery Checklist');
}

//temporary implementation--will modify once we have delivery certificate API ready
printDeliveryCertificate() {
  this.router.navigate(['/delivery-certificate'], {
    state: {
      data: {
        certificateNo: this.model.saleBillNo,
        variant: this.vehicleList[0]?.model|| this.vehicleList[0]?.itemName,
        vinNo: this.vehicleList[0]?.chassisNo,
        motorSerialNo: this.vehicleList[0]?.motorNo || this.vehicleList[0]?.itemName || '',
        dealerName: this.model.customerName,
        dealerCode:this.storageService.getDealerCode(),
        saleDate: this.model.saleDate,
        deliveryDate: new Date()
      }
    }
  });
}

navigateToPerformaInvoice() {
  this.router.navigate(['add-vehicle-sale-bill/performaInvoice', this.model.saleBillNo]);
}

//To be modified later based on API response
connfirmInvoiceGeneration(){
  this.vehicleSaleBillService.confirmInvoice(this.model.saleBillNo).subscribe({
    next:()=>{
      this.toaster.show('Invoice Generated Successfully', { classname: 'bg-success text-light', delay: 3000 });
    },
    error:()=>{
      this.toaster.show('Failed to Generate Invoice', { classname: 'bg-danger text-light', delay: 3000 });
    }
  });
}
}
