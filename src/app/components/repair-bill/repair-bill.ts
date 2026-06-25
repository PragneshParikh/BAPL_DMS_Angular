import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage';
import { cashAccounts, IssueTypes } from '../../constant';
import { SchemeName } from '../../constant';
import { JobCardService } from '../../core/services/job-card-service';
import { LabourMasterService } from '../../core/services/labourmaaster-service';
import { LabourItem, PartItem } from '../../ViewModels/RepairBillModel';
import Swal from 'sweetalert2';
import { ItemMasterService } from '../../core/services/item-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { PrefixService } from '../../core/services/prefix';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { VehicleSaleBillService } from '../../core/services/vehicle-sale-bill-service';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairBillService } from '../../core/services/repair-bill-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Console } from 'console';
import { JobCardSearchModel } from '../../ViewModels/JobCardViewModel';

@Component({
  selector: 'app-repair-bill',
  imports: [FormsModule, CommonModule, NgbDropdownModule],
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
  isSuperAdmin: boolean = false;
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
  showValidation = false;
  repairBillStatus = ''

  repairBillId: number = 0;
  isEditMode = false;
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
  insValidTill: any;

  zeroDep = 'N';

  filteredInsuranceList: any[] = [];

  showInsuranceDropdown = false;
  selectedInsuranceId: any;
  totalTax: any;
  remarks: string;
  labourId: any;
  partwiseLabourId: any;
  customerLedgerId: any;
  searchModel: JobCardSearchModel = {
    dealerCode: '',
    fromDate: '',
    toDate: '',
    serviceLocation: '',
    jobNo: null,
    customerName: '',
    chassisNo: ''
  };



  constructor(private locationService: LocationMasterService,
    private storageService: StorageService,
    private jobCardService: JobCardService,
    private labourMasterService: LabourMasterService,
    private itemService: ItemMasterService,
    private prefixService: PrefixService,
    private ledgerMasterService: LedgerMasterService,
    private vehicleSaleBillService: VehicleSaleBillService,
    private repairBillService: RepairBillService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router
  ) {

  }
  ngOnInit(): void {
    const today = new Date();

    // Current month first date
    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.searchModel.fromDate = this.formatDate(firstDayOfMonth);
    this.searchModel.toDate = this.formatDate(today);
    this.loadPrefix();
    this.fetchLocations();
    this.loadPartNo();
    this.loadInsuranceName();

    this.route.params.subscribe(params => {

      if (params['id']) {
        this.repairBillId = +params['id'];
        this.isEditMode = true;

        this.getRepairBillById(this.repairBillId);
      }
    });

  }

  saveOrUpdateRepairBill() {
    debugger

    this.saveRepairBill();

    if (this.selectedJobCard?.jobCardHeader?.jobtype != 1) {
      this.updateRepairBill();
    }
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
        console.error(err);

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
        console.error(err);
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

  }

  loadPartNo(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const itemType = 2;
    this.itemService.getItemsByItemType(itemType).subscribe({
      next: (data: any[]) => {
        this.loader.hide();
        this.partCodeList = data;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

      }
    })
  }


  fetchLocations(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationList(dealerCode).subscribe({
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
    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    this.loader.show();

    this.jobCardService.getJobCardListRepairBill(this.searchModel
    ).subscribe({
      next: (res) => {
        this.loader.hide();
        this.jobCardList = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error('Error fetching job cards', err);
      }
    });
  }
  //currently not to used
  showMaterialTransferWarning(item: any): void {
    if (item.isMaterialTransfer === false || item.isMaterialTransfer === null) {
      this.toaster.show('Material Transfer is not completed for this Job Card', {
        classname: 'bg-warning text-dark',
        delay: 5000
      });

    }
  }

  onSelect(item: any) {
    if (item.isMaterialTransfer === false || item.isMaterialTransfer === "null") {
      this.toaster.show('Material Transfer is not completed for this Job Card', {
        classname: 'bg-warning text-dark',
        delay: 5000
      });

    }
    this.selectedJobCard = item;
    console.log(this.selectedJobCard);
    this.chassisNo = this.selectedJobCard.jobCardHeader.chassisno;
    this.insValidTill = this.selectedJobCard.jobCardCustomer.insuranceExpDate;
    this.vehicleSaleBillService.getPolicyNo(this.chassisNo).subscribe({
      next: (res) => {
        this.policyNo = res;
      },
      error: (err) => {
        console.error(err);
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

    const jobId = this.selectedJobCard?.jobCardHeader?.id;

    this.isPartSelected = true;
    this.isLabourSelected = true;

    this.jobCardService.getMaterialedJobCardList(jobId).subscribe({

      next: (res) => {

        this.loader.hide();

        this.materialedJobCarDList = res;

        // Part Grid
        this.partItems = [...res];

        // Labour Grid
        this.labourItems = [];

        res.forEach((part: any) => {

          if (
            part.labourCodeDetailslist &&
            part.labourCodeDetailslist.length > 0
          ) {

            part.labourCodeDetailslist.forEach((labour: any) => {

              this.labourItems.push({
                partWiseLabourId: labour.partwiseLabourId,
                labourId: 0,
                labourCode: labour.labourCode,
                description: labour.labourName,

                qty: 1,
                rate: labour.labourRate ?? 0,
                waveRate: this.waveRate ?? 0,

                discount: 0,
                discountType: this.discountType,

                igst: labour.igst ?? 0,
                igstAmount: 0,

                cgst: labour.cgst ?? 0,
                cgstAmount: 0,

                sgst: labour.sgst ?? 0,
                sgstAmount: 0,

                taxableAmount: this.totalTaxableAmount ?? 0,
                taxAmount: this.totalTax ?? 0,

                netAmount: labour.labourRate ?? 0,

                issuetypeId: part.issueType,
                issuetypeName: '',

                isAutoGenerated: true,
                partCode: part.partCode

              });

            });

          }

        });

      },

      error: (err) => {
        this.loader.hide();
        console.error(err);
      }

    });

  }

  loadLabourCodelist(): void {
    this.loader.show();
    this.oemmodelName = this.selectedJobCard?.jobCardCustomer?.modelName
    this.labourMasterService.getLabourRateDropDown(this.oemmodelName).subscribe({
      next: (res) => {
        this.loader.hide();
        this.labourCodeList = res;
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
    this.labourId = item.labourId;
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
    this.partwiseLabourId = item.partwiseLabourId;

    this.showPartDropdown = false;
  }

  addLabour(): void {

    const grossAmount = this.qty * this.selectedRate;

    const selectedIssue = this.IssueType.find(
      x => x.id == this.selectedIssueType
    );

    let discountAmount = this.discount || 0;

    if (this.discountType === '%') {

      discountAmount =
        grossAmount * discountAmount / 100;
    }

    const taxableAmount =
      grossAmount - discountAmount;

    const cgstAmount =
      taxableAmount * (this.selectedLabour?.cgst || 0) / 100;

    const sgstAmount =
      taxableAmount * (this.selectedLabour?.sgst || 0) / 100;

    const igstAmount =
      taxableAmount * (this.selectedLabour?.igst || 0) / 100;

    this.totalTax =
      cgstAmount +
      sgstAmount +
      igstAmount;

    const netAmount =
      taxableAmount + this.totalTax;

    const labourItem: LabourItem = {

      labourId: this.labourId,
      partWiseLabourId: this.partwiseLabourId,

      labourCode: this.labourCode,

      description: this.selectedDescription,

      qty: this.qty,

      rate: this.selectedRate,
      waveRate: this.waveRate,

      discount: discountAmount,

      discountType: this.discountType,

      cgst: this.selectedLabour?.cgst || 0,

      sgst: this.selectedLabour?.sgst || 0,

      igst: this.selectedLabour?.igst || 0,

      taxableAmount: taxableAmount,

      taxAmount: this.totalTax,

      igstAmount: igstAmount,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,

      netAmount: netAmount,

      issuetypeId: this.selectedIssueType[0].issuetypeId,
      issuetypeName: selectedIssue?.name || '',
      // NEW
      isAutoGenerated: false,
      partCode: null
    };

    if (this.editIndex !== null) {

      this.labourItems[this.editIndex] = labourItem;

      this.editIndex = null;

    }
    else {

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
      item.discountType = this.labourDiscountType;
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
    this.partItems.forEach(item => {

      const grossAmount =
        item.partQty * item.partRate;

      let discountAmount = this.partDiscount;

      if (this.partDiscountType === '%') {

        discountAmount = grossAmount * this.partDiscount / 100;

      } else {

        discountAmount = this.partDiscount;
      }

      const taxableAmount = grossAmount - discountAmount;

      const igstAmount = taxableAmount * item.igst / 100;

      item.discount = discountAmount;
      item.discountType = this.partDiscountType;
      item.taxableAmount = taxableAmount;
      item.igstAmount = igstAmount;
      item.netAmount = taxableAmount + igstAmount;
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

  }

  //insurance popup
  saveInsurance(): void {
    this.showInsurancePopup = false;
  }

  onNavigate() {
    this.router.navigate(['/repair-bill-list']);
  }

  saveRepairBill(): void {
    debugger
    const dealerCode = this.storageService.getDealerCode();

    const payload = {
      repairBillheader: {
        id: 0,
        locationCode: this.selectedLocation,
        dealerCode: dealerCode,
        prefix: this.RepairBillprefix,
        billNo: this.billNo,

        billType: this.billType,
        cashAccount: this.selectedCashAccount || 0,

        customerLedgerId:
          this.selectedJobCard?.jobCardCustomer?.customerLedgerId || 0,

        jobId:
          this.selectedJobCard?.jobCardHeader?.id || 0,

        remarks: this.remarks || '',

        totalDiscount: this.totalDiscount || 0,
        taxableAmount: this.totalTaxableAmount || 0,
        netAmount: this.totalNetAmount || 0,

        insuranceId: this.selectedInsuranceId || 0,
        insDescription: this.insuranceDescription || '',
        surveyorName: this.surveyorName || '',
        contactNumber: this.contactNumber || 0,

        policyNo: Array.isArray(this.policyNo)
          ? this.policyNo[0]
          : this.policyNo,

        insValidTill: this.insValidTill || null,

        zeroDepo: this.zeroDep === 'Y',

        totalTaxableAmount: this.totalTaxableAmount || 0,
        totalNetAmount: this.totalNetAmount || 0,

        amountRecived: this.amountReceived || 0,

        isActive: true,
        isSavedPerforma: true,
        isSavedInvoice: false,
        repairBillStatus:
          this.selectedJobCard?.jobCardHeader?.jobtype == 1
            ? 'Billed'
            : 'Performa created'
      },

      repairBillDetail: [
        // Your Existing Part Mapping
        ...this.partItems.map((item: any) => ({
          id: 0,
          itemType: 'Part',
          partwiseLabourId: item.labourCodeDetailslist?.partwiseLabourId || 0,
          materialId: item.materialTransferId || 0,
          partItemId: item.itemId || 0,

          qty: 0,
          rate: 0,

          discount: item.discount || 0,
          discountType: item.discountType || 'Value',

          igstAmount: item.igstAmount || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,

          taxableAmount: 0,
          netAmount: 0,

          issueType: Number(item.issueType) || 0,

          isAutoGenerated: false,

          partQty: item.partQty || 0,
          partRate: item.partRate || 0,
          fscRate: item.fscRate || 0,

          partDiscount: item.discount || 0,
          partTaxbleAmount: item.taxableAmount || 0,
          partNetAmount: item.netAmount || 0
        })),

        // Your Existing Labour Mapping
        ...this.labourItems.map((item: any) => ({
          id: 0,
          itemType: 'Labour',

          materialId: 0,

          labourId: item.labourId || 0,
          partWiseLabourId: item.partWiseLabourId || 0,

          partItemId: 0,

          qty: item.qty || 0,
          rate: item.rate || 0,

          discount: item.discount || 0,
          discountType: item.discountType || 'Value',

          igstAmount: item.igstAmount || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,

          taxableAmount: item.taxableAmount || 0,
          netAmount: item.netAmount || 0,

          issueType: Number(item.issueType) || 0,

          isAutoGenerated: item.isAutoGenerated || false,

          partQty: 0,
          partRate: 0,
          fscRate: 0,

          partDiscount: 0,
          partTaxbleAmount: 0,
          partNetAmount: 0
        }))
      ]
    };

    this.loader.show();

    this.repairBillService
      .insertRepairBill(payload)
      .subscribe({

        next: (res: any) => {

          this.loader.hide();

          this.toaster.show(
            this.selectedJobCard?.jobCardHeader?.jobtype == 1
            ? 'Repair Bill Saved Successfully '
            : 'Proforma Saved Successfully',
            {
              classname: 'bg-success text-dark',
              delay: 3000
            }
          );

          // Open Invoice in New Tab
          if (res?.repairBillId) {

            window.open(
              `/repair-bill-invoice/${res.repairBillId}`,
              '_blank'
            );
          }

          // Navigate Back To List
          this.router.navigate([
            '/repair-bill-list'
          ]);
        },

        error: (err) => {

          this.loader.hide();

          console.error(err);

          this.toaster.show(
            'Failed to Save Repair Bill',
            {
              classname: 'bg-danger text-dark',
              delay: 5000
            }
          );
        }
      });
  }

  getRepairBillById(id: number): void {

    this.loader.show();
    this.repairBillService.getRepairBillById(id).subscribe({

      next: (res: any) => {
        const header = res.repairBillheader;

        // =====================
        // EDIT MODE
        // =====================

        this.isEditMode = true;
        this.repairBillId = header.id;

        // Header Details
        this.selectedLocation = header.locationCode;
        this.RepairBillprefix = header.prefix;
        this.billNo = header.billNo;
        this.billType = header.billType;
        this.customerLedgerId = header.customerLedgerId;
        this.selectedCashAccount = header.cashAccount;
        this.selectedJobCard.partyName = header.partyName;
        this.selectedJobCard.partyMobileNo = header.mobileNumber;
        this.selectedJobCard.partyState = header.partyState;
        this.repairBillStatus = header.repairBillStatus;
        this.remarks = header.remarks;


        // Insurance
        this.selectedInsuranceId = header.insuranceId;
        this.insuranceDescription = header.insDescription;
        this.surveyorName = header.surveyorName;
        this.contactNumber = header.contactNumber;
        this.policyNo = header.policyNo;
        this.insValidTill = header.insValidTill;
        this.zeroDep = header.zeroDepo ? 'Y' : 'N';

        // Totals
        this.totalDiscount = header.totalDiscount || 0;
        this.totalTaxableAmount = header.totalTaxableAmount || 0;
        this.totalNetAmount = header.totalNetAmount || 0;
        this.amountReceived = header.amountRecived || 0;


        // Clear Existing Data
        this.partItems = [];
        this.labourItems = [];

        // =====================
        // PART DETAILS
        // =====================

        res.repairBillDetail
          .filter((x: any) => x.itemType === 'Part')
          .forEach((d: any) => {

            const partItem: PartItem = {

              id: d.id,
              materialId: d.materialId,
              partItemId: d.partItemId,
              partCode: d.partCode || '',
              partDesc: d.partDesc || '',

              partQty: Number(d.partQty || 0),
              partRate: Number(d.partRate || 0),

              discount: Number(d.partDiscount || 0),
              discountType: d.discountType || 'Value',

              taxableAmount: Number(d.partTaxbleAmount || 0),
              netAmount: Number(d.partNetAmount || 0),

              issueType: String(d.issueType || ''),
              issuetypeName:
                this.IssueType.find(
                  x => x.id == Number(d.issueType)
                )?.name || '',

              cgst: Number(d.cgst || 0),
              sgst: Number(d.sgst || 0),
              igst: Number(d.igst || 0),

              igstAmount: Number(d.igstAmount || 0)
            };

            this.partItems.push(partItem);
            this.materialedJobCarDList = [...this.partItems];
          });

        // =====================
        // LABOUR DETAILS
        // =====================

        res.repairBillDetail
          .filter((x: any) => x.itemType === 'Labour')
          .forEach((d: any) => {

            this.labourItems.push({

              labourId: d.labourId || 0,
              partWiseLabourId: d.partWiseLabourId || 0,

              labourCode: d.labourCode || '',
              description: d.labourDescription || '',

              qty: d.qty || 0,
              rate: d.rate || 0,

              waveRate: d.fscRate || 0,

              discount: d.discount || 0,
              discountType: d.discountType || 'Value',

              cgst: d.cgst || 0,
              sgst: d.sgst || 0,
              igst: d.igst || 0,

              taxableAmount: d.taxableAmount || 0,

              taxAmount:
                (d.cgstAmount || 0) +
                (d.sgstAmount || 0) +
                (d.igstAmount || 0),

              netAmount: d.netAmount || 0,

              issuetypeId: Number(d.issueType) || 0,

              issuetypeName:
                this.IssueType.find(
                  x => x.id == Number(d.issueType)
                )?.name || '',

              cgstAmount: d.cgstAmount || 0,
              sgstAmount: d.sgstAmount || 0,
              igstAmount: d.igstAmount || 0,

              isAutoGenerated: d.isAutoGenerated || false,

              partCode: d.partCode || ''

            });

          });
        this.isPartSelected = this.partItems.length > 0;
        this.isLabourSelected = this.labourItems.length > 0;

        this.applyLabourDiscount();
        this.calculateTotals();

        this.loader.hide();

      },

      error: (err) => {

        this.loader.hide();
        console.error(err);

      }

    });

  }

  updateRepairBill(): void {
    let dealerCode = this.storageService.getDealerCode();

    // if (!this.isSuperAdmin) {

    //   this.toaster.show('Only SuperAdmin can be Update.', {
    //     classname: 'bg-warning text-dark',
    //     icons: 'Warning',
    //     delay: 5000
    //   });

    //   return;
    // }

    const payload = {

      repairBillheader: {
        id: this.repairBillId,
        locationCode: this.selectedLocation,
        dealerCode: dealerCode,
        prefix: this.RepairBillprefix,
        billNo: this.billNo,

        billType: this.billType,
        cashAccount: this.selectedCashAccount || 0,

        // partyName: this.selectedJobCard?.partyName || '',
        // mobileNumber: this.selectedJobCard?.partyMobileNo || '',
        customerLedgerId: this.customerLedgerId || 0,

        jobId: this.selectedJobCard?.jobCardHeader?.id || 0,

        remarks: this.remarks || '',

        totalDiscount: this.totalDiscount || 0,
        taxableAmount: this.totalTaxableAmount || 0,
        netAmount: this.totalNetAmount || 0,

        insuranceId: this.selectedInsuranceId || 0,
        insDescription: this.insuranceDescription || '',
        surveyorName: this.surveyorName || '',
        contactNumber: this.contactNumber || 0,
        //policyNo: this.policyNo || '',
        policyNo: Array.isArray(this.policyNo) ? this.policyNo[0] : this.policyNo,

        insValidTill: this.insValidTill || null,

        zeroDepo: this.zeroDep === 'Y',

        totalTaxableAmount: this.totalTaxableAmount || 0,
        totalNetAmount: this.totalNetAmount || 0,

        amountRecived: this.amountReceived || 0,
        isSavedInvoice: true,
        repairBillStatus: "Billed",
        isActive: true
      },

      repairBillDetail: [

        // PART ITEMS
        ...this.partItems.map((item: any) => ({
          id: item.id,
          itemType: 'Part',

          materialId: item.materialId || 0,
          partItemId: item.partItemId || 0,

          labourId: item.labourId || 0,
          partWiseLabourId: item.partWiseLabourId || 0,

          //partItemId: item.itemId || 0,

          qty: 0,
          rate: 0,

          discount: item.discount || 0,
          discountType: item.discountType || 'Value',

          igstAmount: item.igstAmount || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,

          taxableAmount: 0,
          netAmount: 0,

          issueType: Number(item.issueType) || 0,

          isAutoGenerated: false,

          partQty: item.partQty || 0,
          fscRate: item.fscRate || 0,

          partDiscount: item.discount || 0,

          partTaxbleAmount: item.taxableAmount || 0,

          partNetAmount: item.netAmount || 0
        })),

        // LABOUR ITEMS
        ...this.labourItems.map((item: any) => ({
          id: item.id,
          itemType: 'Labour',

          materialId: 0,
          partItemId: 0,

          labourId: item.labourId || 0,
          partWiseLabourId: item.partWiseLabourId || 0,

          qty: item.qty || 0,
          rate: item.rate || 0,

          discount: item.discount || 0,
          discountType: item.discountType || 'Value',

          igstAmount: item.igstAmount || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,

          taxableAmount: item.taxableAmount || 0,
          netAmount: item.netAmount || 0,

          issueType: Number(item.issuetypeId) || 0,

          isAutoGenerated: item.isAutoGenerated || false,

          partQty: 0,
          fscRate: 0,

          partDiscount: 0,
          partTaxbleAmount: 0,
          partNetAmount: 0
        }))
      ]
    };
    this.loader.show();

    this.repairBillService.updateRepairBill(payload)
      .subscribe({
        next: (res) => {

          this.loader.hide();

          this.toaster.show('Repair Bill Saved Successfully', {
            classname: 'bg-success text-dark',
            icons: 'Sucess',
            delay: 5000
          });

          this.router.navigate(['/repair-bill-list']);
        },

        error: (err) => {

          this.loader.hide();

          console.error(err);

          this.toaster.show('Failed to Update Repair Bill', {
            classname: 'bg-danger text-dark',
            icons: 'Danger',
            delay: 5000
          });
        }
      });
  }

  printPerforma() {

    this.router.navigate(
      ['/repair-bill-performa', this.repairBillId]
    )
  }

  printInvoice(): void {

    if (!this.repairBillId) {

      Swal.fire(
        'Warning',
        'Please save bill first',
        'warning'
      );

      return;
    }

    window.open(
      `/repair-bill-invoice/${this.repairBillId}`,
      '_blank'
    );
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

}
