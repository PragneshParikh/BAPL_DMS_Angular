import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LocationName, ReceiptEntryModel } from '../../../ViewModels/ReceiptEntryModel';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { log } from 'node:console';
import { CommonModule } from '@angular/common';
import { BillFromOptions, BillingTypeOptions, CashTypeOptions, SaleTypeOptions } from '../../../constant';
import { ReceiptEntryService } from '../../../core/services/receipt-entry-service';
import { LedgerMaster } from '../../../ViewModels/LedgerMasterViewModel';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';
import { NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ItemMasterService } from '../../../core/services/item-master-service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CustomerLedger } from '../../customer-ledger/customer-ledger';
import { VehicleSaleChasisResponse } from '../../../ViewModels/VehicleSaleBill';
import { VehicleSaleListChasisResponse } from '../../../ViewModels/VehicleSaleChasisResponse';


@Component({
  selector: 'app-add-vehicle-sale-bill',
  imports: [FormsModule, CommonModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './add-vehicle-sale-bill.html',
  styleUrl: './add-vehicle-sale-bill.scss',
})
export class AddVehicleSaleBill implements OnInit {
  @ViewChild('ReceiptEntryModal') receiptEntryModal!: TemplateRef<any>;

  form!: FormGroup;
  nextSaleNo: string;
  selectedReceipt: ReceiptEntryModel;
  private modalRef!: NgbModalRef;
  searchClicked: boolean;
  selectedCustomerId: number;
  chassisList: VehicleSaleListChasisResponse[] = [];

  /**
   *
   */
  constructor(private storageService: StorageService,
    private locationService: LocationMasterService,
    private receiptEntryService: ReceiptEntryService,
    private vehicleSaleBillService: VehicleSaleBillService,
    private modalService: NgbModal,
    private itemService: ItemMasterService,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router,


  ) {


  }

  locations: LocationName[] = [];
  receiptList: ReceiptEntryModel[] = [];
  paginatedReceipts: ReceiptEntryModel[] = [];
  selectedRow: ReceiptEntryModel | null = null;

  vehicleList: any[] = [];

  currentVehicle: any = this.getEmptyVehicle();

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

  today = new Date().toISOString().split('T')[0];
  receipt: any = {
    fromDate: this.getLast7DaysDate(),
    toDate: this.today,
    receiptNo: '',
    itemCode: '',
    partyName: '',
    bookingId: '',
    model: '',
  };
  ItemModels: any[] = [];
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

    // Vehicle Details
    chassisNo: '',
    itemRate: null,
    battery: '',
    delivered: 'Y',
    preGSTDiscount: null,
    regAmount: null,
    insAmount: null,
    mfgYear: null,
    segment: '',
    institutional: '',
    scheme: '',
    kit: 'N',
    exchange: 'N',

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
    sgst: 0,
    cgst: 0,
    igst: 0,
    cess: 0,
    tcs: 0,

  };
  ngOnInit(): void {
    this.fetchLocations();
    this.getFinanciers();
    this.getParties();
    //this.getNextSaleBillNo();
    this.loadProducts();
    const bill = history.state?.bill;
    console.log('bill', bill);

    if (bill) {
      this.billId = bill.id;
      this.loadBillForEdit(bill);
    } else {
      this.getNextSaleBillNo();
    }
  }


  loadBillForEdit(bill: any) {
    this.selectedCustomerId = bill.ledgerId;

    this.loadChasisPricing(() => {
      // ✅ now list is ready
      this.model.chassisNo = bill.details?.[0]?.chassisNo;
    });

    this.model.saleDate = bill.saleDate.split('T')[0]; // format date for input
    this.model.financier = bill.financier || '';
    this.model.saleBillNo = bill.saleBillNo;
    this.model.customerName = bill.customerName;
    this.model.billingName = bill.customerName;
    this.model.location = bill.location;
    this.model.saleType = bill.saleType;
    this.model.customerType = bill.customerType === 'B2B' ? 'B2B' : 'B2C';
    this.model.referralName = bill.referralName || '';
    this.model.billFrom = 'direct'; // assuming edit is only allowed for receipt-based bills
    this.model.cashAccount = bill.cashAc || '';
    this.model.salesExecutive = bill.salesExecutive || '';
    this.model.isD2D = bill.isD2d;
    this.model.tempRegRequired = bill.tempRegRequired || 'N';
    this.model.tempRegNo = bill.tempRegNo || '';
    this.model.bookingId = bill.bookingId || '';
    this.model.printType = bill.printType || '';
    this.model.tempRegRequired = bill.isTempRegNo == '' ? 'no' : 'yes';
    this.model.tempRegNo = bill.isTempRegNo || '';
    this.model.billingType = bill.billType || '';


    // Table data
    this.vehicleList = (bill.details || []).map((d: any) => ({
      chassisNo: d.chassisNo,
      itemRate: d.itemRate,
      preGstDisc: d.preGstDiscount,
      regAmt: d.regAmount,
      insAmt: d.insuranceAmount,
      mfgYear: d.mfgYear,
      delivered: d.isDelivered ? 'Y' : 'N',
      finalAmount: d.finalAmount
    }));

    // ✅ Enable edit mode
    this.isSubmitted = false;
  }
  getLast7DaysDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }
  fetchLocations(): void {
    const dealerCode: any = this.storageService.getDealerCode();

    this.locationService.getLocationByDealerCode(dealerCode).subscribe({
      next: (data: any[]) => {
        console.log('API Response:', data);
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

    // Close only the currently open modal
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null; // reset reference
    }
  }
  onBillFromChange(event: any) {
    if (this.model.billFrom === 'receipt') {
      // Open modal and store the reference
      this.modalRef = this.modalService.open(this.receiptEntryModal, { size: 'xl' });
    }
  }

  searchReceipts() {
    this.searchClicked = true;
    console.log('Searching receipts with:', this.receipt);

    this.receiptEntryService.getReceiptEntryList(this.receipt).subscribe({
      next: (res) => {
        console.log('Receipt List:', res);

        this.receiptList = res || [];


        this.page = 1;
        this.updatePagination();  // ← THIS WAS MISSING

      },
      error: (err) => {
        console.error('Error fetching receipts:', err);
      }
    });
  }

  clearFilters() {
    this.modalRef.close();
    this.modalRef = null;
    this.receipt = {
      fromDate: this.getLast7DaysDate(),
      toDate: this.today,                 // reset to today
      receiptNo: '',
      bookingId: '',
      partyName: '',
      itemCode: ''
    };

    this.receiptList = [];  // clear previous results
    this.paginatedReceipts = [];
    this.page = 1;
  }

  loadProducts(grpId?: number, search?: string): Promise<any> {
    return new Promise((resolve) => {
      this.itemService.getItems(grpId ?? 6, search ?? '').subscribe(
        (res) => {
          this.products = res;
          resolve(res);
        },
        (err) => {
          resolve(true);
          console.error('Error fetching products', err);
        }
      );
    });
  }
  updatePagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedReceipts = this.receiptList.slice(start, end);
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePagination();
  }

  // Called when a row is clicked
  selectRow(row: ReceiptEntryModel) {
    this.selectedRow = row;

  }

  // Called when Proceed is clicked
  proceed() {
    if (this.selectedRow) {
      this.modalRef.close();
      this.model.bookingId = this.selectedRow.bookingId || '';
      this.model.customerName = this.selectedRow.partyName || '';
      this.model.billingName = this.selectedRow.partyName || '';
    }
  }


  saveVehicleDetailsOnly() {

    const payload = {
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
      ledgerId: this.selectedCustomerId,

      refName: '',
      refAddress: '',
      refEmail: '',
      refPoint: 0,
      refRemarks: '',

      totalAmount: this.getTotalAmount(),

      // REAL DATA FROM TABLE
      details: this.vehicleList.map(v => ({
        chassisNo: v.chassisNo,
        itemRate: v.itemRate,
        preGstDiscount: v.preGstDisc,
        regAmount: v.regAmt,
        insuranceAmount: v.insAmt,
        hasDevice: false,
        hasKit: false,
        isDelivered: v.delivered === 'Y',
        segment: '',
        institutionalType: '',
        schemeName: '',
        narration: '',
        finalAmount: v.finalAmount,
        isAgainstExchange: false
      }))
    };

    this.vehicleSaleBillService.createVehicleSaleBill(payload).subscribe({
      next: (res) => {
        console.log('Success:', res);
        this.toaster.show('Vehicle Details Saved', { classname: 'bg-success text-light', delay: 3000 });
      },
      error: (err) => {
        console.error('Error:', err);
        this.toaster.show('Failed to save', { classname: 'bg-danger text-light', delay: 3000 });
      }
    });
  }
  getTotalAmount() {
    return this.vehicleList.reduce((sum, v) => sum + (v.finalAmount || 0), 0);
  }

  getEmptyVehicle() {
    return {
      chassisNo: this.model?.chassisNo || '',
      itemRate: 0,
      preGstDisc: 0,
      regAmt: 0,
      insAmt: 0,
      mfgYear: '',
      delivered: 'N',
      finalAmount: 0
    };
  }

  addVehicle() {
    if (!this.model.chassisNo) {
      alert("Please select chassis");
      return;
    }

    const vehicleData = {
      chassisNo: this.model.chassisNo,
      model: this.model.itemCode,
      colour: this.model.colour,
      mfgYear: this.model.mfgYear,

      rate: this.model.itemRate,
      regAmt: this.model.regAmount,
      insAmt: this.model.insAmount,
      preGstAmt: this.model.preGSTDiscount,
      amount: this.model.amount,

      sgst: this.model.sgst,
      cgst: this.model.cgst,
      igst: this.model.igst,

      delivered: this.model.delivered
    };

    // 🔥 CHECK DUPLICATE (SMART LOGIC)
    const exists = this.vehicleList.some((x, index) =>
      x.chassisNo === this.model.chassisNo &&
      index !== this.editingIndex   // ignore current row when editing
    );

    if (exists) {
      alert("Chassis already exists in the table!");
      return;
    }

    // ✅ UPDATE MODE
    if (this.editingIndex !== -1) {
      this.vehicleList[this.editingIndex] = vehicleData;
      this.editingIndex = -1;
    }
    else {
      // ✅ ADD MODE
      this.vehicleList.push(vehicleData);
    }

    this.resetVehicleForm();
  }

  editVehicle(index: number) {
    const selected = this.vehicleList[index];

    this.model.chassisNo = selected.chassisNo;
    this.model.itemCode = selected.model;
    this.model.colour = selected.colour;
    this.model.mfgYear = selected.mfgYear;

    // ✅ FIXED KEYS
    this.model.itemRate = selected.rate;
    this.model.preGSTDiscount = selected.preGstAmt;
    this.model.regAmount = selected.regAmt;
    this.model.insAmount = selected.insAmt;

    this.model.amount = selected.amount;

    this.model.sgst = selected.sgst;
    this.model.cgst = selected.cgst;
    this.model.igst = selected.igst;

    this.model.delivered = selected.delivered;

    this.editingIndex = index;
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

  updateVehicleSaleBill() {
    const payload = this.buildPayload();
    console.log('Update Payload:', payload);

    if (!this.billId) {
      this.toaster.show('Invalid Bill ID', { classname: 'bg-danger text-light', delay: 3000 });
      return;
    }

    this.vehicleSaleBillService.updateVehicleSaleBill(this.billId, payload).subscribe({
      next: () => {
        this.toaster.show('Updated Successfully', { classname: 'bg-success text-light', delay: 3000 });
        this.router.navigate(['/vehicle-sale-bill']);
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

      refName: '',
      refAddress: '',
      refEmail: '',
      refPoint: 0,
      refRemarks: '',

      totalAmount: this.getTotalAmount(),

      details: this.vehicleList.map(v => ({
        chassisNo: v.chassisNo,
        itemRate: v.itemRate,
        preGstDiscount: v.preGstDisc,
        regAmount: v.regAmt,
        insuranceAmount: v.insAmt,
        hasDevice: false,
        hasKit: false,
        isDelivered: v.delivered === 'Y',
        segment: '',
        institutionalType: '',
        schemeName: '',
        narration: '',
        finalAmount: v.finalAmount,
        isAgainstExchange: false
      }))
    };

    console.log(this.buildPayload);

  }
  getLedgerIdFromName(): number | null {
    const match = this.parties.find(p =>
      p.ledgerName?.toLowerCase() === this.model.customerName?.toLowerCase()
    );
    return match ? match.id : null;
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
      }
    });
  }

  filterParties() {
    const search = this.model.customerName?.trim().toLowerCase();

    // Reset ID when typing
    this.selectedCustomerId = null;

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

    //store ID here
    this.selectedCustomerId = party.id;

    this.filteredParties = [];
    this.loadChasisPricing();
  }


  loadChasisPricing(callback?: () => void) {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const ledgerId = this.selectedCustomerId;

    if (!dealerCode || !ledgerId) return;

    this.vehicleSaleBillService
      .getChasisPricing(dealerCode, ledgerId)
      .subscribe({
        next: (res) => {
          this.chassisList = res;
          this.loader.hide();
          if (callback) callback();
        },
        error(err) {
          this.loader.hide();
          this.toaster.show('Failed to fetch pricing details of the chassis!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        },
      });
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
        console.log('Success:', res);
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


  onChassisChange(chassisNo?: string) {
    const selected = this.chassisList.find(
      x => x.chassisNo === this.model.chassisNo || x.chassisNo === chassisNo
    );

    if (!selected) return;
    this.loader.show();

    // Fill model fields from selected chassis
    this.model.itemCode = selected.itemCode;
    this.model.itemRate = selected.customerRate;
    this.model.preGSTDiscount = selected.preGstDis;
    this.model.mfgYear = selected.mfgYear;

    // Taxes
    this.model.sgst = selected.sgstAmt;
    this.model.cgst = selected.cgstAmt;
    this.model.igst = selected.igstAmt;

    // Amount calculation
    this.model.amount =
      (this.model.itemRate - this.model.preGSTDiscount) +
      this.model.sgst +
      this.model.cgst +
      this.model.igst;
    this.loader.hide();
  }

  resetVehicleForm() {
    this.model.chassisNo = '';
    this.model.itemRate = 0;
    this.model.preGSTDiscount = 0;
    this.model.amount = 0;
    this.model.sgst = 0;
    this.model.cgst = 0;
    this.model.igst = 0;
  }

}
