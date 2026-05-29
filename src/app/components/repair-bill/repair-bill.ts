import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { StorageService } from '../../core/services/storage';
import { cashAccounts, IssueTypes } from '../../constant';
import { SchemeName } from '../../constant';
import { JobCardService } from '../../core/services/job-card-service';
import { LabourmaasterService } from '../../core/services/labourmaaster-service';
import { LabourItem, PartItem } from '../../ViewModels/RepairBillModel';
import Swal from 'sweetalert2';
import { ItemMasterService } from '../../core/services/item-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { it } from 'node:test';
import { PrefixService } from '../../core/services/prefix';
import { LedgerMaster } from '../../core/services/ledger-master';
import { VehicleSaleBillService } from '../../core/services/vehicle-sale-bill-service';

@Component({
  selector: 'app-repair-bill',
  imports: [FormsModule, CommonModule],
  templateUrl: './repair-bill.html',
  styleUrl: './repair-bill.scss',
})
export class RepairBill implements OnInit {

  currentDate: string = new Date().toISOString().split('T')[0];
  RepairBillprefix: string = '';
  billNo: number = 0;
  selectedLocation: string = '';
  locations: any[] = [];
  jobCardList: any[] = [];
  labourCodeList: any[] = [];
  partCodeList: any[] = [];
  materialedJobCarDList: any[] = [];
  insurancelist: any[] = [];
  selectedJobCard: any = {};
  itemdesc: any;
  showJobDetails = false;
  selectedLocationCode: any;
  selectedCashAccount: number | null = null;
  selectedScheme: number | null = null;
  selectedIssueType: number | null = null;
  selectedLabour: any;
  selectedLabourCode: any;
  modalService: any;
  cashAccounts = cashAccounts;
  SchemeName = SchemeName;
  IssueType = IssueTypes;
  technician: string = ''
  showPreviousYearJobs: boolean = false;
  isSuperAdmin: boolean;
  showSelectedJob: boolean;
  billType: string = 'Cash';
  labourCode = '';
  selectedDescription = '';
  selectedPartDescription = '';
  selectedRate = 0;
  selectedPartRate = 0;
  filteredLabourList: any[] = [];
  filteredPartList: any[] = [];
  showLabourDropdown = false;
  showPartDropdown = false;
  oemmodelName: string = '';
  labourItems: LabourItem[] = [];
  partItems: PartItem[] = [];
  editIndex: number | null = null;
  waveRate: 0;
  FirstFill: '';
  FirstFillStock: 0;
  selectedItemType: string = 'Labour';
  isPartSelected = false;
  isLabourSelected = false;
  isAccessorySelected = false;

  qty = 1;

  rate = 0;

  discount = 0;

  discountType = 'Value';

  cgst = 0;
  sgst = 0;
  igst = 0;

  totalDiscount = 0;
  totalTaxableAmount = 0;
  totalNetAmount = 0;
  amountReceived = 0;

  // Add discount variable
  showDiscountPopup = false;

  partDiscount = 0;
  partDiscountType = 'Value';

  accessoryDiscount = 0;
  accessoryDiscountType = 'Value';

  oilDiscount = 0;
  oilDiscountType = 'Value';

  labourDiscount = 0;
  labourDiscountType = 'Value';
  itemcode: any;
  selectedPart: any;
  dateFrom: string = this.currentDate;
  dateTo: string;
  jobNo: string;
  registerNo: string;
  chassisNo: string;

  //insurance popup
  showInsurancePopup = false;

  insuranceParty = '';
  insuranceDescription = '';

  surveyorName = '';
  contactNumber = '';

  policyNo = '';
  validTill = '';

  zeroDep = 'N';

filteredInsuranceList: any[] = [];

showInsuranceDropdown = false;
  selectedInsuranceId: any;


  constructor(private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private jobCardService: JobCardService,
    private labourMasterService: LabourmaasterService,
    private itemService: ItemMasterService,
    private prefixService: PrefixService,
    private ledgerMasterService: LedgerMaster,
    private vehicleSaleBillService : VehicleSaleBillService,
    private loader: LoaderService,
    private toaster: ToastService
  ) {

  }
  ngOnInit(): void {
    this.loadPrefix();
    this.fetchLocations();
    this.loadPartNo();
    this.loadInsuranceName();
  }

  loadPrefix(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const module = 'Repair_bill';
    this.prefixService.getPrefixByDealerByModule(dealerCode, module).subscribe({
      next: (res: string) => {
        this.loader.hide();
        this.RepairBillprefix = res;
        this.billNo = Number(res.split('/').pop());
      }, error: (err) => {
        this.loader.hide();
        console.log(err);

      }
    })
  }

  loadInsuranceName(): void {

  this.loader.show();

  this.ledgerMasterService.getInsuranceLedgers().subscribe({

    next: (res: any[]) => {

      this.loader.hide();

      this.insurancelist = res || [];

      this.filteredInsuranceList = [...this.insurancelist];
    },

    error: (err) => {

      this.loader.hide();

      console.log(err);
    }
  });
}


  onInsuranceSearch(): void {

  if (!this.insuranceParty?.trim()) {

    this.filteredInsuranceList = [];

    this.showInsuranceDropdown = false;

    return;
  }

  this.filteredInsuranceList =
    this.insurancelist.filter((x: any) =>

      x.ledgerName
        .toLowerCase()
        .includes(this.insuranceParty.toLowerCase())

    );

  this.showInsuranceDropdown =
    this.filteredInsuranceList.length > 0;
}
selectInsurance(item: any): void {

  this.insuranceParty = item.ledgerName;
  this.selectedInsuranceId = item.id;

  this.showInsuranceDropdown = false;

  console.log(item);
}

  loadPartNo(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const itemType = 2;
    this.itemService.getItemsByItemType(itemType).subscribe({
      next: (data: any[]) => {
        this.loader.hide();
        this.partCodeList = data;
        //console.log("PArcodeList", this.partCodeList);
      },
      error: (err) => {
        this.loader.hide();
        console.log(err);

      }
    })
  }


  fetchLocations(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop
        this.loader.hide();
        this.locations = data.filter(x => x.locareadidNo === 2);
        // auto select first workshop location
        if (this.locations.length > 0) {
          this.selectedLocation = this.locations[0].locname;
          this.selectedLocationCode = this.locations[0].locCode;
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching locations', err);
      }
    });
  }
  showPopup = false;

  openPopup(): void {
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }
  loadJobCardList(): void {
    debugger
    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    this.loader.show();
    
    this.jobCardService.getJobCardList(dealerCode,
      this.dateFrom,
      this.dateTo,
      this.jobNo,
      this.registerNo,
      this.chassisNo
    ).subscribe({
      next: (res) => {
        this.loader.hide();
        this.jobCardList = res;
        console.log("listing : ", this.jobCardList);

        // this.loading = false;
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching job cards', err);
        // this.loading = false;
      }
    });
  }

  showMaterialTransferWarning(item: any): void {
    if (item.isMaterialTransfer === false || item.isMaterialTransfer === null) {
      this.toaster.show('Material Transfer is not completed for this Job Card', {
        classname: 'bg-warning text-dark',
        delay: 5000
      });

    }
  }

  onSelect(item: any) {
    debugger;
    if (item.isMaterialTransfer === false || item.isMaterialTransfer === "null") {
      this.toaster.show('Material Transfer is not completed for this Job Card', {
        classname: 'bg-warning text-dark',
        delay: 5000
      });

    }
    this.selectedJobCard = item;
    console.log(this.selectedJobCard)
    this.chassisNo = this.selectedJobCard.jobCardHeader.chassisno;
    this.vehicleSaleBillService.getPolicyNo(this.chassisNo).subscribe({
      next:(res)=>{
        this.policyNo = res;
        console.log(this.policyNo)
      },
      error : (err)=>{
        console.log(err);
      }
    })
    this.showPopup = false;
    this.showJobDetails = true;
    this.loadLabourCodelist();
    this.loadMaterialedJobCardList();
  }
  toggleJobDetails() {
    this.showJobDetails = !this.showJobDetails;
    this.showSelectedJob = !this.showSelectedJob;
  }

  loadMaterialedJobCardList(): void {
    this.loader.show();
    const jobId = this.selectedJobCard?.jobCardHeader?.id
    this.isPartSelected = true;
    this.isLabourSelected = true;
    //console.log(jobId)
    this.jobCardService.getMaterialedJobCardList(jobId).subscribe({
      next: (res) => {
        this.loader.hide();
        // console.log(res)
        this.materialedJobCarDList = res;

      },
      error: (err) => {
        this.loader.hide();
        console.log(err)

      }
    })
  }

  loadLabourCodelist(): void {
    this.loader.show();
    this.oemmodelName = this.selectedJobCard?.jobCardCustomer?.modelName
    //console.log("test",this.oemmodelName);
    this.labourMasterService.getLabourRateDropDown(this.oemmodelName).subscribe({
      next: (res) => {
        this.loader.hide();
        this.labourCodeList = res;
        console.log(this.labourCodeList)

      },
      error: (err) => {
        this.loader.hide();
        console.error("error", err)
      }
    })
  }

  onLabourSearch(): void {

    if (!this.labourCode?.trim()) {
      this.filteredLabourList = [];
      this.showLabourDropdown = false;
      return;
    }

    this.filteredLabourList = this.labourCodeList.filter(x =>
      x.labourCode.toLowerCase().includes(this.labourCode.toLowerCase())
    );


    this.showLabourDropdown = this.filteredLabourList.length > 0;
  }

  onPartSearch(): void {

    if (!this.itemcode?.trim()) {
      this.filteredPartList = [];
      this.showPartDropdown = false;
      return;
    }

    this.filteredPartList = this.partCodeList.filter(x =>
      x.itemcode.toLowerCase().includes(this.itemcode.toLowerCase())
    );


    this.showPartDropdown = this.filteredPartList.length > 0;
  }

  selectLabour(item: any): void {

    this.selectedLabour = item;
    this.labourCode = item.labourCode;
    this.selectedDescription = item.labourDescription;
    this.selectedRate = item.labourRate;

    this.showLabourDropdown = false;
  }

  selectPart(item: any): void {

    this.selectedPart = item;
    this.itemcode = item.itemcode;
    this.selectedPartDescription = item.itemdesc;
    this.selectedPartRate = item.dlrprice;

    this.showPartDropdown = false;
  }

  addLabour(): void {
    debugger;
    const grossAmount = this.qty * this.selectedRate;
    const selectedIssue = this.IssueType.find(
      x => x.id == this.selectedIssueType
    );

    let discountAmount = this.discount;

    if (this.discountType === '%') {

      discountAmount =
        grossAmount * this.discount / 100;

    } else {

      discountAmount = this.discount;
    }

    const taxableAmount =
      grossAmount - discountAmount;

    const cgstAmount =
      taxableAmount * (this.selectedLabour?.cgst || 0) / 100;

    const sgstAmount =
      taxableAmount * (this.selectedLabour?.sgst || 0) / 100;

    const igstAmount =
      taxableAmount * (this.selectedLabour?.igst || 0) / 100;

    const totalTax =
      cgstAmount +
      sgstAmount +
      igstAmount;

    const netAmount =
      taxableAmount + totalTax;

    const labourItem = {

      labourCode: this.labourCode,

      description: this.selectedDescription,

      qty: this.qty,

      rate: this.selectedRate,

      discount: this.discount,

      discountType: this.discountType,

      cgst: this.selectedLabour?.cgst || 0,

      sgst: this.selectedLabour?.sgst || 0,

      igst: this.selectedLabour?.igst || 0,

      taxableAmount: taxableAmount,

      taxAmount: totalTax,

      netAmount: netAmount,

      issuetypeId: this.selectedIssueType,
      issuetypeName: selectedIssue?.name || '',
      igstAmount: igstAmount,
      technician: this.technician,
      waveRate: this.waveRate,
      FirstFill: this.FirstFill,
      FirstFillStock: this.FirstFillStock
    };
    if (this.editIndex !== null) {

      this.labourItems[this.editIndex] = labourItem;

      this.editIndex = null;

    } else {

      this.labourItems.push(labourItem);
    }

    this.calculateTotals();

    this.clearLabourForm();

  }

  calculateTotals(): void {

    const labourDiscount =
      this.labourItems.reduce(
        (sum, x) => sum + (x.discount || 0),
        0
      );

    const partDiscount =
      this.partItems.reduce(
        (sum, x) => sum + (x.discount || 0),
        0
      );

    this.totalDiscount =
      labourDiscount + partDiscount;

    const labourTaxable =
      this.labourItems.reduce(
        (sum, x) => sum + (x.taxableAmount || 0),
        0
      );

    const partTaxable =
      this.partItems.reduce(
        (sum, x) => sum + (x.taxableAmount || 0),
        0
      );

    this.totalTaxableAmount =
      labourTaxable + partTaxable;

    const labourNet =
      this.labourItems.reduce(
        (sum, x) => sum + (x.netAmount || 0),
        0
      );

    const partNet =
      this.partItems.reduce(
        (sum, x) => sum + (x.netAmount || 0),
        0
      );

    this.totalNetAmount =
      labourNet + partNet;

    this.amountReceived =
      this.totalNetAmount;
  }
  editLabour(index: number): void {

    const item = this.labourItems[index];

    this.editIndex = index;

    this.labourCode = item.labourCode;
    this.selectedDescription = item.description;

    this.qty = item.qty;
    this.selectedRate = item.rate;

    this.discount = item.discount;
    this.discountType = item.discountType;

    this.selectedIssueType = item.issuetypeId;

    this.technician = item.technician;
    this.waveRate = 0;
    this.FirstFill = '';
    this.FirstFillStock = 0.00;


  }
  deleteLabour(index: number): void {

    Swal.fire({
      title: 'Delete Labour?',
      text: 'Are you sure you want to delete this labour record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then((result) => {

      if (result.isConfirmed) {

        this.labourItems.splice(index, 1);

        this.calculateTotals();

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Labour record deleted successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  openDiscountPopup(): void {

    if (
      this.labourItems.length === 0 &&
      this.partItems.length === 0
    ) {

      Swal.fire({
        icon: 'warning',
        title: 'No Items',
        text: 'Please add Labour/Part items first.'
      });

      return;
    }

    this.showDiscountPopup = true;
  }

  applyDiscount(): void {

    // Labour Grid Discount
    this.applyLabourDiscount();

    // Part Grid Discount
    this.applyPartDiscount();

    // Recalculate footer totals
    this.calculateTotals();

    this.showDiscountPopup = false;

    Swal.fire({
      icon: 'success',
      title: 'Discount Applied',
      text: 'Discount applied successfully.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  applyLabourDiscount(): void {
debugger
    this.labourItems.forEach(item => {

      const grossAmount =
        item.qty * item.rate;

      let discountAmount = 0;

      if (this.labourDiscountType === '%') {

        discountAmount =
          grossAmount *
          this.labourDiscount /
          100;

      } else {

        discountAmount =
          this.labourDiscount;
      }

      const taxableAmount =
        grossAmount -
        discountAmount;

      const cgstAmount =
        taxableAmount *
        item.cgst /
        100;

      const sgstAmount =
        taxableAmount *
        item.sgst /
        100;

      const igstAmount =
        taxableAmount *
        item.igst /
        100;

      const totalTax =
        cgstAmount +
        sgstAmount +
        igstAmount;

      item.discount =
        discountAmount;

      item.taxableAmount =
        taxableAmount;

      item.taxAmount =
        totalTax;

      item.igstAmount =
        igstAmount;

      item.netAmount =
        taxableAmount +
        totalTax;
    });
  }
  applyPartDiscount(): void {
debugger
    this.partItems.forEach(item => {

      const grossAmount =
        item.qty * item.rate;

      let discountAmount = 0;

      if (this.partDiscountType === '%') {

        discountAmount =
          grossAmount *
          this.partDiscount / 100;

      } else {

        discountAmount =
          this.partDiscount;
      }

      const taxableAmount =
        grossAmount - discountAmount;

      const igstAmount =
        taxableAmount *
        item.igst / 100;

      item.discount =
        discountAmount;

      item.taxableAmount =
        taxableAmount;

      item.igstAmount =
        igstAmount;

      item.netAmount =
        taxableAmount +
        igstAmount;
    });
  }
  clearLabourForm(): void {

    this.labourCode = '';

    this.selectedDescription = '';

    this.qty = 1;

    this.selectedRate = 0;

    this.discount = 0;

    this.discountType = 'Value';

    this.selectedIssueType = null;

    this.technician = '';

  }

  //insurance popup
  saveInsurance(): void {

    console.log({
      insuranceParty: this.insuranceParty,
      insuranceDescription: this.insuranceDescription,
      surveyorName: this.surveyorName,
      contactNumber: this.contactNumber,
      policyNo: this.policyNo,
      validTill: this.validTill,
      zeroDep: this.zeroDep
    });

    this.showInsurancePopup = false;
  }

}
