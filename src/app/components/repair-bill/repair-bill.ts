// src\app\components\repair-bill\repair-bill.ts
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
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-repair-bill',
  imports: [FormsModule, CommonModule, NgbDropdownModule],
  templateUrl: './repair-bill.html',
  styleUrl: './repair-bill.scss',
})
export class RepairBill implements OnInit {
  readonly SUBMENU_ID = 51;
  canCreate = false;
  canEdit = false;

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
  selectedJobCard: any = {
    jobCardHeader: {},
    jobCardCustomer: {}
  };
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
  repairBillStatus = '';
  issuetypeId = 0;
  issuetypeName = '';

  repairBillId: number = 0;
  isEditMode = false;
  qty = 1;

  rate = 0;

  discount = 0;

  discountType = 'Value';
  discountPartType = 'Value';

  totalGrossAmount = 0;
  totalCgstAmount = 0;
  totalSgstAmount = 0;
  totalIgstAmount = 0;

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
  totalTaxPer: number = 0;
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
  labourHsnCode: string;
  dealerCode: string;
  isPartEditMode: boolean;
  editPartIndex: number;
  // CHANGED: defaulted to 1, matching qty's own default for the Labour side.
  // Previously undefined until something set it — addPart() still guarded
  // this with `|| 1`, but a real default is clearer than relying on that.
  selectedPartQty: number = 1;
  selectedPartIssueType: number;
  partdiscount: number;
  dealerState: string;
  discountValue: number;
  showLabourSuggestionPopup = false;
  suggestedLabourList: any[] = [];
  selectedSuggestedLabourIds = new Set<number>();



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
    private router: Router,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);

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
        this.showJobDetails = true;
        this.getRepairBillById(this.repairBillId);
      }
    });

  }

  saveOrUpdateRepairBill() {

    if (this.selectedJobCard?.jobCardHeader?.jobtype != 1) {
      this.updateRepairBill();
    } else {
      this.saveRepairBill();
    }
  }
    loadPrefix(): void {
      this.loader.show();

      const dealerCode = this.storageService.getDealerCode();
      const module = 'Repair_bill';

      this.prefixService.getPrefixByDealerByModule(dealerCode, module).subscribe({
        next: (res: string) => {
          this.loader.hide();

          const parts = res.split('/');

          // Last part is the bill number
          this.billNo = Number(parts.pop());

          // Remaining part is the actual prefix
          this.RepairBillprefix = parts.join('/') + '/';
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
        }
      });
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
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }
    this.locationService.getLocationList(this.dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop
        this.loader.hide();
        this.locations = data.filter(x => x.locareadidNo === 2);
        // auto select first workshop location
        if (this.locations.length > 0) {
          this.selectedLocation = this.locations[0].locname;
         // this.selectedLocationCode = this.locations[0].locCode;
          this.selectedLocationCode = this.locations[0].loccode ?? this.locations[0].locCode;

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
  // loadJobCardList(): void {
  //   let dealerCode = '';

  //   if (!this.isSuperAdmin) {
  //     dealerCode = this.storageService.getDealerCode();
  //   }

  //   // FIXED: dealerCode was computed above but never assigned onto
  //   // searchModel, so searchModel.dealerCode stayed '' (its initial value)
  //   // for every user, SuperAdmin or not. getJobCardListRepairBill()'s
  //   // params-builder only sends dealerCode when it's truthy, so the query
  //   // silently went out with no dealer filter at all — showing every
  //   // dealer's job cards to every logged-in dealer.
  //   this.searchModel.dealerCode = dealerCode;

  //   this.loader.show();

  //   this.jobCardService.getJobCardListRepairBill(this.searchModel).subscribe({
  //     next: (res: any[]) => {
  //       this.loader.hide();

  //       // Remove duplicate Job Cards using Job Card Header ID
  //       const uniqueJobCards = (res || []).filter(
  //         (jobCard: any, index: number, self: any[]) => {
  //           const jobCardId = jobCard?.jobCardHeader?.id;

  //           return (
  //             jobCardId != null &&
  //             index === self.findIndex(
  //               (item: any) =>
  //                 item?.jobCardHeader?.id === jobCardId
  //             )
  //           );
  //         }
  //       );

  //       this.jobCardList = uniqueJobCards;
  //     },

  //     error: (err) => {
  //       this.loader.hide();
  //       console.error('Error fetching job cards', err);

  //       this.jobCardList = [];
  //     }
  //   });
  // }

  loadJobCardList(): void {

  let dealerCode = '';

  if (!this.isSuperAdmin) {
    dealerCode = this.storageService.getDealerCode();
  }

 
  this.searchModel.dealerCode = dealerCode;

  this.loader.show();

  this.jobCardService
    .getJobCardListRepairBill(this.searchModel)
    .subscribe({

      next: (res: any[]) => {

        this.loader.hide();

        console.log('API Job Card List:', res);

        const uniqueJobCards = new Map<string, any>();

(res || []).forEach((jobCard: any) => {

  const header = jobCard?.jobCardHeader;

  if (!header) {
    return;
  }

  const jobNo = String(header.jobNo || '')
    .trim()
    .toLowerCase();

  if (!jobNo) {
    return;
  }

  if (!uniqueJobCards.has(jobNo)) {
    uniqueJobCards.set(jobNo, jobCard);
  }

});

this.jobCardList =
  Array.from(uniqueJobCards.values());

      },

      error: (err) => {

        this.loader.hide();

        console.error(
          'Error fetching job cards',
          err
        );

        this.jobCardList = [];
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

  // loadMaterialedJobCardList(): void {

  //   this.loader.show();

  //   const jobId = this.selectedJobCard?.jobCardHeader?.id;
  //   const dealerCode = this.storageService.getDealerCode();

  //   this.isPartSelected = true;
  //   this.isLabourSelected = true;

  //   this.jobCardService.getMaterialedJobCardList(jobId, dealerCode).subscribe({

  //     next: (res) => {

  //       this.loader.hide();

  //       this.materialedJobCarDList = res;
  //       // Part Grid
  //       this.materialedJobCarDList = res.map((x: any) => ({
  //         ...x,
  //         issuetypeName: this.IssueType.find(i => i.id === Number(x.issueType))?.name || '',
  //         issuetypeId: this.IssueType.find(i => i.id == Number(x.issueType))?.id || 0
  //       }));

  //       this.materialedJobCarDList.forEach(item => {

  //         item.discount = Number(item.discount || 0);

  //         // Taxable Amount
  //         item.taxableAmount =
  //           (item.issuetypeName === 'U/W' || item.issuetypeName === 'FSC') ? 0 :
  //             (Number(item.partQty) * Number(item.partRate)) - item.discount;

  //         // Net Amount
  //         item.netAmount =
  //           (item.issuetypeName === 'U/W' || item.issuetypeName === 'FSC')
  //             ? 0
  //             : item.taxableAmount +
  //             Number(item.cgstAmount || 0) +
  //             Number(item.sgstAmount || 0) +
  //             Number(item.igstAmount || 0);
  //         item.discountValue = item.discountValue || 0;
  //         // item.netAmount =
  //         //   item.taxableAmount +
  //         //   Number(item.cgstAmount || 0) +
  //         //   Number(item.sgstAmount || 0) +
  //         //   Number(item.igstAmount || 0);
  //       });

  //       this.partItems = [...this.materialedJobCarDList];

  //       this.calculateTotals();

  //       // Labour Grid

  //       // For Add Mode only
  //       if (!this.isEditMode) {
  //         this.labourItems = [];
  //       }

  //       res.forEach((part: any) => {

  //         if (part.labourCodeDetailslist?.length > 0) {

  //           part.labourCodeDetailslist.forEach((labour: any) => {

  //             const exists = this.labourItems.some(x =>
  //               x.partWiseLabourId === labour.partwiseLabourId
  //             );

  //             if (!exists) {

  //               this.labourItems.push({
  //                 partWiseLabourId: labour.partwiseLabourId,
  //                 labourId: 0,
  //                 labourCode: labour.labourCode,
  //                 description: labour.labourName,

  //                 qty: 1,
  //                 rate: labour.labourRate ?? 0,
  //                 waveRate: this.waveRate ?? 0,
  //                 labourHsnCode: labour.labourHsnCode ?? '',
  //                 discountValue: 0,
  //                 discount: 0,
  //                 discountType: this.discountType,

  //                 igst: labour.igst ?? 0,
  //                 igstAmount: 0,

  //                 cgst: labour.cgst ?? 0,
  //                 cgstAmount: 0,

  //                 sgst: labour.sgst ?? 0,
  //                 sgstAmount: 0,

  //                 taxableAmount: 0,
  //                 taxAmount: 0,
  //                 totalTaxPer: 0,

  //                 netAmount: labour.labourRate ?? 0,

  //                 issuetypeId: part.issueType,
  //                 issuetypeName: '',

  //                 isAutoGenerated: true,
  //                 partCode: part.partCode
  //               });

  //             }

  //           });

  //         }

  //       });
  //     },

  //     error: (err) => {
  //       this.loader.hide();
  //       console.error(err);
  //     }

  //   });

  // }

  loadMaterialedJobCardList(): void {

  this.loader.show();

  const jobId = this.selectedJobCard?.jobCardHeader?.id;
  const dealerCode = this.storageService.getDealerCode();

  this.isPartSelected = true;
  this.isLabourSelected = true;

  this.jobCardService.getMaterialedJobCardList(jobId, dealerCode).subscribe({

    next: (res: any[]) => {

      this.loader.hide();

      // ============================================
      // MATERIAL TRANSFER PARTS
      // ============================================

      const processedParts = (res || []).map((x: any) => {

        const issueType = this.IssueType.find(
          i => i.id === Number(x.issueType)
        );

        const issueTypeName = issueType?.name || '';

        const discount = Number(x.discount || 0);

        const grossAmount =
          Number(x.partQty || 0) *
          Number(x.partRate || 0);

        const taxableAmount =
          (issueTypeName === 'U/W' || issueTypeName === 'FSC')
            ? 0
            : grossAmount - discount;

        const cgstAmount =
          (issueTypeName === 'U/W' || issueTypeName === 'FSC')
            ? 0
            : Number(x.cgstAmount || 0);

        const sgstAmount =
          (issueTypeName === 'U/W' || issueTypeName === 'FSC')
            ? 0
            : Number(x.sgstAmount || 0);

        // const igstAmount =
        //   (issueTypeName === 'U/W' || issueTypeName === 'FSC')
        //     ? 0
        //     : Number(x.igstAmount || 0);

        // const netAmount =
        //   taxableAmount +
        //   cgstAmount +
        //   sgstAmount +
        //   igstAmount;

        const igstAmount =
  (issueTypeName === 'U/W' || issueTypeName === 'FSC')
    ? 0
    : Number(x.partRate || 0) * Number(x.igst || 0) / 100;

// const netAmount =
//   Number(x.partRate || 0) + igstAmount;
  
const netAmount =
  (issueTypeName === 'U/W' || issueTypeName === 'FSC')
    ? 0
    : Number(x.partRate || 0) + igstAmount;

    
        return {
          ...x,

          // IDs
          id: x.id || 0,
          materialId: x.materialTransferId || x.materialId || 0,
          partItemId: x.itemId || x.partItemId || 0,

          // Part details
          partCode: x.partCode || x.itemcode || '',
          partDesc: x.partDesc || x.itemdesc || '',

          partQty: Number(x.partQty || 0),
          partRate: Number(x.partRate || 0),
          partMRP: Number(x.partMRP || x.mrp || 0),

          partHsnCode:
            x.partHsnCode ||
            x.hsncode ||
            '',

          // Discount
          discountValue: Number(
            x.discountValue || x.discount || 0
          ),

          discount: discount,

          discountType:
            x.discountType || 'Value',

          // Issue Type
          issuetypeId: Number(x.issueType || 0),
          issuetypeName: issueTypeName,

          // GST
          cgst: Number(x.cgst || 0),
          sgst: Number(x.sgst || 0),
          igst: Number(x.igst || 0),

          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          igstAmount: igstAmount,

          totalTaxPer:
            Number(x.totalTaxPer || 0),

          // Amount
          taxableAmount: taxableAmount,

          taxAmount:
            cgstAmount +
            sgstAmount +
            igstAmount,

          netAmount: netAmount,

          // States
          dealerState: this.dealerState,
          custState:
            this.selectedJobCard?.partyState,

          // Material Transfer
          isAutoGenerated: true
        };

      });

      // ============================================
      // IMPORTANT:
      // ONLY ONE SOURCE FOR PARTS
      // ============================================

      this.partItems = processedParts;

      // Keep this only if some other old code needs it.
      // Do NOT use it for Save/Update.
      this.materialedJobCarDList = [...this.partItems];

      // ============================================
      // LABOUR
      // ============================================

      if (!this.isEditMode) {
        this.labourItems = [];
      }

      // (res || []).forEach((part: any) => {

      //   if (
      //     part.labourCodeDetailslist &&
      //     part.labourCodeDetailslist.length > 0
      //   ) {

      //     part.labourCodeDetailslist.forEach((labour: any) => {

      //       const exists = this.labourItems.some(
      //         x =>
      //           x.partWiseLabourId &&
      //           labour.partwiseLabourId &&
      //           x.partWiseLabourId === labour.partwiseLabourId
      //       );

      //       if (exists) {
      //         return;
      //       }

      //       this.labourItems.push({

      //         partWiseLabourId:
      //           labour.partwiseLabourId,

      //         labourId:
      //           labour.labourId || 0,

      //         labourCode:
      //           labour.labourCode,

      //         description:
      //           labour.labourName,

      //         qty: 1,

      //         rate:
      //           Number(labour.labourRate || 0),

      //         waveRate:
      //           this.waveRate || 0,

      //         labourHsnCode:
      //           labour.labourHsnCode || '',

      //         discountValue: 0,
      //         discount: 0,

      //         discountType:
      //           this.discountType,

      //         igst:
      //           Number(labour.igst || 0),

      //         igstAmount: 0,

      //         cgst:
      //           Number(labour.cgst || 0),

      //         cgstAmount: 0,

      //         sgst:
      //           Number(labour.sgst || 0),

      //         sgstAmount: 0,

      //         taxableAmount:
      //           Number(labour.labourRate || 0),

      //         taxAmount: 0,

      //         totalTaxPer: 0,

      //         netAmount:
      //           Number(labour.labourRate || 0),

      //         issuetypeId:
      //           Number(part.issueType || 0),

      //         issuetypeName:
      //           this.IssueType.find(
      //             i =>
      //               i.id === Number(part.issueType)
      //           )?.name || '',

      //         isAutoGenerated: true,

      //         partCode:
      //           part.partCode || null,

      //         dealerState:
      //           this.dealerState,

      //         custState:
      //           this.selectedJobCard?.partyState
      //       });

      //     });

      //   }

      // });
      (res || []).forEach((part: any) => {
  // const list = part.labourCodeDetailslist || [];
  const list = (part.labourCodeDetailslist || []).filter((l: any) =>
  (l.labourCode || '').trim().toUpperCase().startsWith('WL')
);

  if (list.length === 0) return;

  // const issueName =
  //   this.IssueType.find(i => i.id === Number(part.issueType))?.name || '';
  // const isZeroTax = issueName === 'U/W' || issueName === 'FSC';

 
const uwType = this.IssueType.find(i => i.name === 'U/W');
const partIssueName =
  this.IssueType.find(i => i.id === Number(part.issueType))?.name || '';

 
  const isInterState = Number(part.igst || 0) > 0;

  list.forEach((labour: any) => {
    const pwId = labour.partwiseLabourId ?? labour.partWiseLabourId ?? 0;

    const exists = this.labourItems.some(x =>
      x.partWiseLabourId && pwId && x.partWiseLabourId === pwId);
    if (exists) return;

    const isWarrantyLabour = (labour.labourCode || '').trim().toUpperCase().startsWith('WL');
    const issueName = isWarrantyLabour ? 'U/W' : partIssueName;
    const issueId = isWarrantyLabour ? (uwType?.id ?? 0) : Number(part.issueType || 0);
    const isZeroTax = issueName === 'U/W' || issueName === 'FSC';

    const rate = Number(labour.labourRate || 0);
    const cgst = Number(labour.cgst || 0);
    const sgst = Number(labour.sgst || 0);
    const igst = Number(labour.igst || 0);

    const taxable = isZeroTax ? 0 : rate;
    const cgstAmount = isZeroTax || isInterState ? 0 : taxable * cgst / 100;
    const sgstAmount = isZeroTax || isInterState ? 0 : taxable * sgst / 100;
    const igstAmount = isZeroTax || !isInterState ? 0 : taxable * igst / 100;
    const taxAmount = cgstAmount + sgstAmount + igstAmount;

    this.labourItems.push({
      partWiseLabourId: pwId,
      labourId: 0,
      
      labourCode: labour.labourCode,
      description: labour.labourName ?? '',
      qty: 1,
      rate: rate,
      waveRate: this.waveRate || 0,
      labourHsnCode: labour.labourHsnCode || '',
      discountValue: 0,
      discount: 0,
      discountType: 'Value',
      cgst, sgst, igst,
      cgstAmount, sgstAmount, igstAmount,
      taxableAmount: taxable,
      taxAmount: taxAmount,
      totalTaxPer: isInterState ? igst : cgst + sgst,
      netAmount: taxable + taxAmount,
      // issuetypeId: Number(part.issueType || 0),
      // issuetypeName: issueName,
      issuetypeId: issueId,
      issuetypeName: issueName,
      isAutoGenerated: true,
      partCode: part.partCode || null,
      dealerState: this.dealerState,
      custState: this.selectedJobCard?.partyState
    } as LabourItem);
  });
});

      // ============================================
      // CALCULATE TOTAL
      // ============================================

      this.calculateTotals();

    },

    error: (err) => {

      this.loader.hide();

      console.error(
        'Error loading Material Transfer items',
        err
      );

    }

  });

}


  loadLabourCodelist(): void {
    this.loader.show();
    this.oemmodelName = this.selectedJobCard?.jobCardCustomer?.modelName
    this.customerLedgerId = this.selectedJobCard?.jobCardCustomer?.customerLedgerId
    const dealerCode = this.storageService.getDealerCode();
    this.labourMasterService.getLabourRateDropDown(this.oemmodelName, this.customerLedgerId, dealerCode).subscribe({
  //     next: (res) => {
  //       this.loader.hide();
  //       this.labourCodeList = res;
  //     },
  //     error: (err) => {
  //       this.loader.hide();
  //       console.error("error", err)
  //     }


  next: (res) => {
  this.loader.hide();
  this.labourCodeList = (res || []).map((x: any) => ({
    ...x,
    labourId: x.labourId || 0,
    partWiseLabourId: x.partWiseLabourId || 0,
    labourDescription: x.labourDescription || '',
    hsnCode: x.labourHsnCode || ''
  }));
}
     })
  }
  

  // onLabourSearch(): void {

  //   if (!this.labourCode?.trim()) {
  //     this.filteredLabourList = [];
  //     this.showLabourDropdown = false;
  //     return;
  //   }

  //   this.filteredLabourList = this.labourCodeList.filter(x =>
  //     x.labourCode.toLowerCase().includes(this.labourCode.toLowerCase())
  //   );


  //   this.showLabourDropdown = this.filteredLabourList.length > 0;
  // }

  onLabourSearch(): void {
  const term = (this.labourCode || '').trim().toLowerCase();
  if (!term) {
    this.filteredLabourList = [];
    this.showLabourDropdown = false;
    return;
  }
  this.filteredLabourList = this.labourCodeList
    .filter(x =>
      (x.labourCode || '').toLowerCase().includes(term) ||
      (x.labourDescription || '').toLowerCase().includes(term) ||
      (x.partCode || '').toLowerCase().includes(term))
    .slice(0, 50);
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

  // selectLabour(item: any): void {
  //   this.selectedLabour = item;
  //   this.labourId = item.labourId;
  //   this.labourCode = item.labourCode;
  //   this.selectedDescription = item.labourDescription;
  //   this.selectedRate = item.labourRate;

  //   this.showLabourDropdown = false;
  // }

  selectLabour(item: any): void {
  this.selectedLabour = item;
  this.labourId = item.labourId || 0;
  this.partwiseLabourId = item.partWiseLabourId || 0;
  this.labourCode = item.labourCode;
  this.selectedDescription = item.labourDescription;
  this.selectedRate = item.labourRate ?? 0;
  this.labourHsnCode = item.hsnCode || '';
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

  // addLabour(): void {
  //   const isSameState =
  //     (this.selectedLabour?.dealerState || '').trim().toUpperCase() ===
  //     (this.selectedLabour?.custState).trim().toUpperCase();
  addLabour(): void {
    if (!this.labourCode) {
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please select a Labour.' });
      return;
    }

    if (!this.selectedLabour) {
      this.selectedLabour = {};
    }

    const dealerState = (this.selectedLabour?.dealerState || this.dealerState || '').toString().trim().toUpperCase();
    const custState = (this.selectedLabour?.custState || this.selectedJobCard?.partyState || '').toString().trim().toUpperCase();
    const isSameState = !!dealerState && dealerState === custState;


    const grossAmount = this.qty * this.selectedRate;

    const selectedIssue = this.IssueType.find(
      x => x.id == this.selectedIssueType
    );

    this.discountValue = this.discount || 0;
    let discountAmount = this.discount || 0;

    if (this.discountType === '%') {

      discountAmount =
        grossAmount * discountAmount / 100;
    }

    let taxableAmount =
      grossAmount - discountAmount;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (selectedIssue?.name === 'U/W' || selectedIssue?.name === 'FSC') { cgstAmount = 0; sgstAmount = 0; igstAmount = 0; taxableAmount = 0; this.totalTaxPer = 0; }
    else {
      if (isSameState) {

        // Intrastate
        cgstAmount = taxableAmount * (this.selectedLabour?.cgst || 0) / 100;
        sgstAmount = taxableAmount * (this.selectedLabour?.sgst || 0) / 100;
        igstAmount = 0;
        this.totalTaxPer = this.selectedLabour?.cgst + this.selectedLabour?.sgst


      } else {

        // Interstate
        cgstAmount = 0;
        sgstAmount = 0;
        igstAmount = taxableAmount * (this.selectedLabour?.igst || 0) / 100;
        this.totalTaxPer = this.selectedLabour?.igst || 0
      }
    }

    // const cgstAmount =
    //   taxableAmount * (this.selectedLabour?.cgst || 0) / 100;

    // const sgstAmount =
    //   taxableAmount * (this.selectedLabour?.sgst || 0) / 100;

    // const igstAmount =
    //   taxableAmount * (this.selectedLabour?.igst || 0) / 100;

    this.totalTax =
      cgstAmount +
      sgstAmount +
      igstAmount;


    const netAmount =
      taxableAmount + this.totalTax;


    const alreadyExists = this.labourItems.some(x =>
      this.editIndex === null &&
      (
        x.labourId === this.labourId ||
        x.labourCode?.trim().toLowerCase() ===
        this.labourCode?.trim().toLowerCase()
      )
    );

    if (alreadyExists) {

      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Labour',
        text: 'This labour is already added.'
      });

      return;
    }


    const labourItem: LabourItem = {

      labourId: this.labourId,
      partWiseLabourId: this.partwiseLabourId,

      labourCode: this.labourCode,

      description: this.selectedDescription,

      qty: this.qty,

      rate: this.selectedRate,
      waveRate: this.waveRate,
      labourHsnCode: this.labourHsnCode,

      discountValue: this.discount,
      discount: discountAmount,

      discountType: this.discountType,

      cgst: this.selectedLabour?.cgst || 0,

      sgst: this.selectedLabour?.sgst || 0,

      igst: this.selectedLabour?.igst || 0,

      taxableAmount: taxableAmount,

      taxAmount: this.totalTax,
      totalTaxPer: this.totalTaxPer,

      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,


      netAmount: netAmount,

      issuetypeId: this.selectedIssueType,
      issuetypeName: selectedIssue?.name || '',
      // NEW
      // isAutoGenerated: false,
      // partCode: null
      isAutoGenerated: false,
      partCode: null,
      dealerState: this.dealerState,
      custState: this.selectedJobCard?.partyState
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

//   calculateTotals(): void {
//     // Gross Amount - full pre-discount, pre-tax value regardless of issue type,
//     // so a warranty/FSC line still shows what it would have cost.
//     const labourGross =
//       this.labourItems.reduce((sum, x) => sum + ((x.qty || 0) * (x.rate || 0)), 0);
//     const partGross =
//       //this.materialedJobCarDList.reduce((sum, x) => sum + ((x.partQty || 0) * (x.partRate || 0)), 0);
//        this.partItems.reduce((sum, x) => sum + ((x.partQty || 0) * (x.partRate || 0)), 0);
//     this.totalGrossAmount = labourGross + partGross;

//     const labourDiscount =
//       this.labourItems.reduce(
//         (sum, x) => sum + (x.discount || 0),
//         0
//       );

//     const partDiscount =
//       this.materialedJobCarDList.reduce(
//         (sum, x) => sum + (x.discount || 0),
//         0
//       );

//     this.totalDiscount =
//       labourDiscount + partDiscount;

//     const labourTaxable =
//       this.labourItems.reduce(
//         (sum, x) => sum + (x.taxableAmount || 0),
//         0
//       );
//     const partTaxable =
//       this.materialedJobCarDList.reduce(
//         (sum, x) => sum + (x.taxableAmount || 0),
//         0
//       );

//     this.totalTaxableAmount =
//       labourTaxable + partTaxable;

//     // CGST/SGST/IGST - Labour items already carry properly-zeroed tax
//     // amounts for U/W/FSC (set at addLabour()/auto-generation time), but
//     // Part items' cgstAmount/sgstAmount come straight from the backend
//     // without that zeroing, so guard them here to stay consistent with
//     // taxableAmount/netAmount, which ARE already zeroed for those rows.
//     const isPartZeroed = (x: any) => x.issuetypeName === 'U/W' || x.issuetypeName === 'FSC';

//     const labourCgst =
//       this.labourItems.reduce((sum, x) => sum + (x.cgstAmount || 0), 0);
//     const partCgst =
//       this.materialedJobCarDList.reduce((sum, x) => sum + (isPartZeroed(x) ? 0 : (x.cgstAmount || 0)), 0);
//     this.totalCgstAmount = labourCgst + partCgst;

//     const labourSgst =
//       this.labourItems.reduce((sum, x) => sum + (x.sgstAmount || 0), 0);
//     const partSgst =
//       this.materialedJobCarDList.reduce((sum, x) => sum + (isPartZeroed(x) ? 0 : (x.sgstAmount || 0)), 0);
//     this.totalSgstAmount = labourSgst + partSgst;

//     const labourIgst =
//       this.labourItems.reduce((sum, x) => sum + (x.igstAmount || 0), 0);
//     const partIgst =
//       this.materialedJobCarDList.reduce((sum, x) => sum + (isPartZeroed(x) ? 0 : (x.igstAmount || 0)), 0);
//     this.totalIgstAmount = labourIgst + partIgst;

//     const labourNet =
//       this.labourItems.reduce(
//         (sum, x) => sum + (x.netAmount || 0),
//         0
//       );

//     const partNet =
//       this.materialedJobCarDList.reduce(
//         (sum, x) => sum + (x.netAmount || 0),
//         0
//       );

//     this.totalNetAmount =
//       labourNet + partNet;
//     // this.discountValue = partDiscount + labourDiscount;
//     this.amountReceived =
//       this.totalNetAmount;
// }
calculateTotals(): void {

  // ============================================
  // GROSS AMOUNT
  // ============================================

  const labourGross =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        (Number(x.qty || 0) *
          Number(x.rate || 0)),
      0
    );

  const partGross =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        (Number(x.partQty || 0) *
          Number(x.partRate || 0)),
      0
    );

  this.totalGrossAmount =
    labourGross + partGross;


  // ============================================
  // DISCOUNT
  // ============================================

  const labourDiscount =
    this.labourItems.reduce(
      (sum, x) =>
        sum + Number(x.discount || 0),
      0
    );

  const partDiscount =
    this.partItems.reduce(
      (sum, x) =>
        sum + Number(x.discount || 0),
      0
    );

  this.totalDiscount =
    labourDiscount + partDiscount;


  // ============================================
  // TAXABLE
  // ============================================

  const labourTaxable =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        Number(x.taxableAmount || 0),
      0
    );

  const partTaxable =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        Number(x.taxableAmount || 0),
      0
    );

  this.totalTaxableAmount =
    labourTaxable + partTaxable;


  // ============================================
  // CGST
  // ============================================

  const labourCgst =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        Number(x.cgstAmount || 0),
      0
    );

  const partCgst =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        Number(x.cgstAmount || 0),
      0
    );

  this.totalCgstAmount =
    labourCgst + partCgst;


  // ============================================
  // SGST
  // ============================================

  const labourSgst =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        Number(x.sgstAmount || 0),
      0
    );

  const partSgst =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        Number(x.sgstAmount || 0),
      0
    );

  this.totalSgstAmount =
    labourSgst + partSgst;


  // ============================================
  // IGST
  // ============================================

  const labourIgst =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        Number(x.igstAmount || 0),
      0
    );

  const partIgst =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        Number(x.igstAmount || 0),
      0
    );

  this.totalIgstAmount =
    labourIgst + partIgst;


  // ============================================
  // NET AMOUNT
  // ============================================

  const labourNet =
    this.labourItems.reduce(
      (sum, x) =>
        sum +
        Number(x.netAmount || 0),
      0
    );

  const partNet =
    this.partItems.reduce(
      (sum, x) =>
        sum +
        Number(x.netAmount || 0),
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
    this.selectedLabour = this.labourCodeList.find(
      x => x.labourCode === item.labourCode
    );


    this.labourId = item.labourId;
    this.partwiseLabourId = item.partWiseLabourId;

    //this.selectedCashAccount = 

    this.qty = item.qty;
    this.selectedRate = item.rate;
    this.labourHsnCode = item.labourHsnCode;
    this.discount = item.discount;
    this.discountType = item.discountType;
    this.issuetypeId = item.issuetypeId;
    this.issuetypeName = item.issuetypeName;
    this.selectedIssueType = item.issuetypeId;

    if (!this.selectedLabour) {
 
    this.selectedLabour = { cgst: item.cgst, sgst: item.sgst, igst: item.igst,
      dealerState: item.dealerState, custState: item.custState };
  }
  this.labourHsnCode = item.labourHsnCode;

  }
  editPart(index: number) {
    const item = this.partItems[index];

    // const item = this.materialedJobCarDList[index];

    item.custState = this.selectedJobCard?.partyState;
    item.dealerState = this.dealerState;

    this.isPartEditMode = true;
    this.editPartIndex = index;

    // Only editable fields

    this.partdiscount = item.discount;
    this.discountPartType = item.discountType;
    this.discountValue = this.partDiscount;

    // Display only (read-only)
    this.itemcode = item.partCode;
    this.selectedPartDescription = item.partDesc;
    this.selectedPartQty = item.partQty;
    this.selectedPartRate = item.partRate;
    this.issuetypeId = item.issuetypeId;
    this.issuetypeName = item.issuetypeName;
    this.selectedPartIssueType = item.issuetypeId;
  }
  updatePart(): void {

    const item = this.partItems[this.editPartIndex];

    //item.discountValue = Number(this.discountValue||0);
    item.discount = Number(this.partdiscount || 0);
    item.discountType = this.discountPartType;
    item.discountValue = Number(this.partdiscount || 0);

    item.issuetypeId = this.selectedPartIssueType;

    const issue = this.IssueType.find(
      x => x.id === this.selectedPartIssueType
    );

    item.issuetypeName = issue?.name || '';


    this.calculatePart(item);

    this.isPartEditMode = false;
    this.editPartIndex = -1;
  }
  calculatePart(item: PartItem): void {
    const grossAmount = Number(item.partQty || 0) * Number(item.partRate || 0);

    let discountAmount = Number(item.discount || 0);
    let discountValue = Number(item.discount || 0);

    if (item.discountType === '%') {
      discountAmount = grossAmount * discountAmount / 100;
    }

    const taxableAmount = grossAmount - discountAmount;

    const isSameState =
      (item.dealerState || '').trim().toUpperCase() ===
      (item.custState || '').trim().toUpperCase();

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isSameState) {

      cgstAmount = taxableAmount * (item.cgst || 0) / 100;
      sgstAmount = taxableAmount * (item.sgst || 0) / 100;

    } else {

      igstAmount = taxableAmount * (item.igst || 0) / 100;

    }

    item.discountValue = discountValue;
    item.discount = discountAmount;
    item.taxableAmount = taxableAmount;

    item.cgstAmount = cgstAmount;
    item.sgstAmount = sgstAmount;
    item.igstAmount = igstAmount;

    item.taxAmount =
      cgstAmount +
      sgstAmount +
      igstAmount;

    item.netAmount =
      taxableAmount +
      item.taxAmount;

    item.totalTaxPer = isSameState
      ? (item.cgst || 0) + (item.sgst || 0)
      : (item.igst || 0);

    this.calculateTotals();
    this.clearPartForm();
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
      this.selectedIssueType = item.issuetypeId;
      const isSameState =
        (item.dealerState || '').trim().toUpperCase() ===
        (item.custState || '').trim().toUpperCase();

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

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isSameState) {

        // Intrastate
        cgstAmount = taxableAmount * (item.cgst || 0) / 100;
        sgstAmount = taxableAmount * (item.sgst || 0) / 100;
        igstAmount = 0;
        // this.totalTaxPer = this.selectedLabour?.cgst + this.selectedLabour?.sgst

        this.totalTaxPer =
          (item.cgst || 0) +
          (item.sgst || 0);





      } else {

        // Interstate
        cgstAmount = 0;
        sgstAmount = 0;
        igstAmount = taxableAmount * (item.igst || 0) / 100;
        //this.totalTaxPer = this.selectedLabour?.igst

        this.totalTaxPer =
          (item.igst || 0);

      }

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

      item.cgstAmount = cgstAmount;
      item.sgstAmount = sgstAmount;
      item.igstAmount = igstAmount;

      item.netAmount =
        taxableAmount +
        totalTax;
    });
  }
  applyPartDiscount(): void {
    this.partItems.forEach(item => {

      const isSameState =
        (item.dealerState || '').trim().toUpperCase() ===
        (item.custState || '').trim().toUpperCase();

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

    // this.labourCode = '';

    // this.selectedDescription = '';

    // this.qty = 1;

    // this.selectedRate = 0;

    // this.discount = 0;

    // this.discountType = 'Value';

    // this.selectedIssueType = null;
    this.selectedLabour = null;
    this.labourId = 0;
    this.partwiseLabourId = 0;
    this.labourHsnCode = '';

  }
  clearPartForm(): void {

    this.itemcode = '';

    this.selectedPartDescription = '';

    this.selectedPartQty = 1;

    this.selectedPartRate = 0;

    this.partdiscount = 0;

    this.discountPartType = 'Value';

    //this.selectedIssueType = null;

  }

  //insurance popup
  saveInsurance(): void {
    this.showInsurancePopup = false;
  }

  onNavigate() {
    this.router.navigate(['/repair-bill-list']);
  }

  isSaveClicked = false;
  saveRepairBill(): void {
    this.isSaveClicked = true;
    const dealerCode = this.storageService.getDealerCode();
    if (this.selectedCashAccount == null || this.selectedCashAccount == 0) {

      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please select a Cash Account.'
      });
      return;
    }


    const payload = {

            repairBillheader: {
        id: 0,
        locationCode: this.selectedLocationCode || this.selectedLocation,
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
        //contactNumber: this.contactNumber || '',
        contactNumber: this.contactNumber ? Number(this.contactNumber) : null,


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
      // repairBillheader: {
      //   id: 0,
      //   locationCode: this.selectedLocation,
      
      
      //   dealerCode: dealerCode,
      //   prefix: this.RepairBillprefix,
      //   billNo: this.billNo,

      //   billType: this.billType,
      //   cashAccount: this.selectedCashAccount || 0,

      //   customerLedgerId:
      //     this.selectedJobCard?.jobCardCustomer?.customerLedgerId || 0,

      //   jobId:
      //     this.selectedJobCard?.jobCardHeader?.id || 0,

      //   remarks: this.remarks || '',

      //   totalDiscount: this.totalDiscount || 0,
      //   taxableAmount: this.totalTaxableAmount || 0,
      //   netAmount: this.totalNetAmount || 0,

      //   insuranceId: this.selectedInsuranceId || 0,
      //   insDescription: this.insuranceDescription || '',
      //   surveyorName: this.surveyorName || '',
      //   contactNumber: this.contactNumber || 0,

      //   policyNo: Array.isArray(this.policyNo)
      //     ? this.policyNo[0]
      //     : this.policyNo,

      //   insValidTill: this.insValidTill || null,

      //   zeroDepo: this.zeroDep === 'Y',

      //   totalTaxableAmount: this.totalTaxableAmount || 0,
      //   totalNetAmount: this.totalNetAmount || 0,


      //   amountRecived: this.amountReceived || 0,

      //   isActive: true,
      //   isSavedPerforma: true,
      //   isSavedInvoice: false,
      //   repairBillStatus:
      //     this.selectedJobCard?.jobCardHeader?.jobtype == 1
      //       ? 'Billed'
      //       : 'Performa created'
      // },
      repairBillDetail: [

        // ---------- PART ITEMS ----------
        ...this.partItems.map((item: any) => ({
          id: 0,
          itemType: 'Part',

          materialId: item.materialTransferId || item.materialId || 0,
          partItemId: item.itemId || item.partItemId || 0,

          labourId: 0,
          partWiseLabourId: 0,

          qty: 0,
          rate: 0,
          partHsnCode: item.partHsnCode || '',

          discountValue: Number(item.discountValue || 0),
          discount: Number(item.discount || 0),
          discountType: item.discountType || 'Value',

          igstAmount: Number(item.igstAmount || 0),
          cgstAmount: Number(item.cgstAmount || 0),
          sgstAmount: Number(item.sgstAmount || 0),

          taxableAmount: 0,
          netAmount: 0,

          issueType: Number(item.issuetypeId || item.issueType || 0),
          isAutoGenerated: item.isAutoGenerated ?? false,

          partQty: Number(item.partQty || 0),
          partRate: Number(item.partRate || 0),
          fscRate: Number(item.fscRate || 0),

          partDiscount: Number(item.discount || 0),
          partTaxbleAmount: Number(item.taxableAmount || 0),
          partNetAmount: Number(item.netAmount || 0),
          totalTaxPer: Number(item.totalTaxPer || 0)
        })),

        // ---------- LABOUR ITEMS ----------
        ...this.labourItems.map((item: any) => ({
          id: 0,
          itemType: 'Labour',

          materialId: 0,
          partItemId: 0,

          labourId: item.labourId || 0,
          partWiseLabourId: item.partWiseLabourId || 0,

          qty: Number(item.qty || 0),
          rate: Number(item.rate || 0),
          labourHsnCode: item.labourHsnCode || '',

          discountValue: Number(item.discountValue || 0),
          discount: Number(item.discount || 0),
          discountType: item.discountType || 'Value',

          igstAmount: Number(item.igstAmount || 0),
          cgstAmount: Number(item.cgstAmount || 0),
          sgstAmount: Number(item.sgstAmount || 0),

          taxableAmount: Number(item.taxableAmount || 0),
          netAmount: Number(item.netAmount || 0),

          issueType: Number(item.issuetypeId || 0),
          isAutoGenerated: item.isAutoGenerated || false,

          partQty: 0,
          partRate: 0,
          fscRate: 0,

          partDiscount: 0,
          partTaxbleAmount: 0,
          partNetAmount: 0,
          totalTaxPer: Number(item.totalTaxPer || 0)
        }))
      ]
    };
      // repairBillDetail: [
      //   // Your Existing Part Mapping
      //   ...this.partItems.map((item: any) => ({
      //     id: 0,
      //     itemType: 'Part',
      //     partwiseLabourId: item.labourCodeDetailslist?.partwiseLabourId || 0,
      //     materialId: item.materialTransferId || 0,
      //     partItemId: item.itemId || 0,

      //     qty: 0,
      //     rate: 0,
      //     partHsnCode: item.partHsnCode || '',

      //     discountValue: item.discountValue || 0,
      //     discount: item.discount || 0,
      //     discountType: item.discountType || 'Value',

      //     igstAmount: item.igstAmount || 0,
      //     cgstAmount: item.cgstAmount || 0,
      //     sgstAmount: item.sgstAmount || 0,

      //     taxableAmount: 0,
      //     netAmount: 0,

      //     issueType: Number(item.issueType) || 0,

      //     isAutoGenerated: false,

      //     partQty: item.partQty || 0,
      //     partRate: item.partRate || 0,
      //     fscRate: item.fscRate || 0,

      //     partDiscount: item.discount || 0,
      //     partTaxbleAmount: item.taxableAmount || 0,
      //     partNetAmount: item.netAmount || 0,
      //     totalTaxPer: item.igst || 0

      //   })),

      //   // Your Existing Labour Mapping
      //   ...this.labourItems.map((item: any) => ({
      //     id: 0,
      //     itemType: 'Labour',

      //     materialId: 0,

      //     labourId: item.labourId || 0,
      //     partWiseLabourId: item.partWiseLabourId || 0,

      //     partItemId: 0,

      //     qty: item.qty || 0,
      //     rate: item.rate || 0,
      //     labourHsnCode: item.labourHsnCode || '',
      //     discountValue: item.discountValue || 0,
      //     discount: item.discount || 0,
      //     discountType: item.discountType || 'Value',

      //     igstAmount: item.igstAmount || 0,
      //     cgstAmount: item.cgstAmount || 0,
      //     sgstAmount: item.sgstAmount || 0,

      //     taxableAmount: item.taxableAmount || 0,
      //     netAmount: item.netAmount || 0,

      //     issueType: item.issuetypeId || 0,

      //     isAutoGenerated: item.isAutoGenerated || false,

      //     partQty: 0,
      //     partRate: 0,
      //     fscRate: 0,

      //     partDiscount: 0,
      //     partTaxbleAmount: 0,
      //     partNetAmount: 0
      //   }))
      // ]
//       ...this.partItems.map((item: any) => ({
//   id: 0,
//   itemType: 'Part',

//   materialId:
//     item.materialTransferId ||
//     item.materialId ||
//     0,

//   partItemId:
//     item.itemId ||
//     item.partItemId ||
//     0,

//   qty: 0,
//   rate: 0,

//   partHsnCode:
//     item.partHsnCode || '',

//   discountValue:
//     item.discountValue || 0,

//   discount:
//     item.discount || 0,

//   discountType:
//     item.discountType || 'Value',

//   igstAmount:
//     item.igstAmount || 0,

//   cgstAmount:
//     item.cgstAmount || 0,

//   sgstAmount:
//     item.sgstAmount || 0,

//   taxableAmount: 0,
//   netAmount: 0,

//   issueType:
//     Number(
//       item.issuetypeId ||
//       item.issueType ||
//       0
//     ),

//   isAutoGenerated:
//     item.isAutoGenerated || true,

//   partQty:
//     item.partQty || 0,

//   partRate:
//     item.partRate || 0,

//   fscRate:
//     item.fscRate || 0,

//   partDiscount:
//     item.discount || 0,

//   partTaxbleAmount:
//     item.taxableAmount || 0,

//   partNetAmount:
//     item.netAmount || 0,

//   totalTaxPer:
//     item.totalTaxPer || 0
// }))

    //};

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

        // error: (err) => {

        //   this.loader.hide();

        //   console.error(err);

        //   this.toaster.show(
        //     'Failed to Save Repair Bill',
        //     {
        //       classname: 'bg-danger text-dark',
        //       delay: 5000
        //     }
        //   );
        // }
                error: (err) => {
          this.loader.hide();
          console.error('InsertRepairBill error:', err);

          // 400 = validation errors, 500 = Details
          const validation = err?.error?.errors
            ? Object.values(err.error.errors).flat().join(' | ')
            : '';
          const msg = validation
            || err?.error?.Details
            || err?.error?.details
            || err?.error?.title
            || 'Failed to Save Repair Bill';

          this.toaster.show(msg, {
            classname: 'bg-danger text-dark',
            delay: 10000
          });
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
        this.RepairBillprefix =this.normalizeRepairBillPrefix(header.prefix);
        this.billNo = header.billNo;
        this.billNo = header.billNo;
        this.billType = header.billType;
        this.selectedJobCard.jobCardCustomer.customerLedgerId = header.customerLedgerId;
        this.selectedCashAccount = header.cashAccount;
        this.selectedJobCard.partyName = header.partyName;
        this.selectedJobCard.partyMobileNo = header.mobileNumber;
        this.selectedJobCard.partyState = header.partyState;
        this.selectedJobCard.jobCardHeader.id = header.jobId;
        this.selectedJobCard.jobCardHeader.jobinDate = header.jobInDate;
        this.selectedJobCard.jobCardHeader.jobNo = header.jobNo;
        this.selectedJobCard.jobCardCustomer.registerNo = header.registerNo;
        this.selectedJobCard.jobCardCustomer.modelName = header.modelName;
        this.selectedJobCard.jobCardHeader.vehiclekms = header.vehicleKms;
        this.selectedJobCard.jobCardCustomer.chassisNo = header.chassisNo;
        this.selectedJobCard.jobCardHeader.technician = header.technician;
        this.dealerState = header.dealerState;
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
              materialId: d.materialId || d.materialTransferId,
              partItemId: d.partItemId || d.itemId,
              partCode: d.partCode || '',
              partDesc: d.partDesc || '',

              partQty: Number(d.partQty || 0),
              partRate: Number(d.partRate || 0),
              partMRP: Number(d.partMRP || 0),
              fscRate: (d.issuetypeName === 'U/W'
                ? d.partRate
                : d.issuetypeName === 'FSC'
                  ? d.fscRate
                  : 0),
              partHsnCode: d.partHsnCode || '',

              discountValue: Number(d.discountValue),
              discount: Number(d.partDiscount || d.discount),
              discountType: d.discountType || 'Value',

              taxableAmount: Number(d.partTaxbleAmount || 0),
              taxAmount: Number(d.taxAmount || 0),
              netAmount: Number(d.partNetAmount || 0),
              totalTaxPer: Number(d.totalTaxPer || 0),

              issuetypeId: Number(d.issueType || 0),
              issuetypeName:
                this.IssueType.find(
                  x => x.id == Number(d.issueType)
                )?.name || '',

              cgst: Number(d.cgst || d.totalTaxPer / 2 || 0),
              sgst: Number(d.sgst || d.totalTaxPer / 2 || 0),
              igst: Number(d.igst || d.totalTaxPer || 0),
              cgstAmount: Number(d.cgstAmount || 0),
              sgstAmount: Number(d.sgstAmount || 0),
              igstAmount: Number(d.igstAmount || 0),
              dealerState: header.dealerState,
              custState: header.partyState
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
              labourHsnCode: d.labourHsnCode || 0,

              discountValue: d.discountValue || 0,
              discount: d.discount || 0,
              discountType: d.discountType || 'Value',

              cgst: Number(d.cgst) || 0,
              sgst: Number(d.sgst) || 0,
              igst: Number(d.igst) || 0,

              taxableAmount: d.taxableAmount || 0,

              taxAmount:
                (d.cgstAmount || 0) +
                (d.sgstAmount || 0) +
                (d.igstAmount || 0),

              netAmount: d.netAmount || 0,
              totalTaxPer: this.totalTaxPer ?? 0,

              issuetypeId: Number(d.issueType) || 0,

              issuetypeName:
                this.IssueType.find(
                  x => x.id == Number(d.issueType)
                )?.name || '',

              cgstAmount: d.cgstAmount || 0,
              sgstAmount: d.sgstAmount || 0,
              igstAmount: d.igstAmount || 0,

              isAutoGenerated: d.isAutoGenerated || false,

              partCode: d.partCode || '',
              dealerState: d.dealerState

            });

          });
        this.isPartSelected = this.partItems.length > 0;
        this.isLabourSelected = this.labourItems.length > 0;

        // if (this.repairBillStatus !== "Billed") {
        //   this.loadMaterialedJobCardList();
        // }

        this.loadLabourCodelist();

        if (!this.isEditMode) {
          this.applyLabourDiscount();
          this.calculateTotals();
        }

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
       // contactNumber: this.contactNumber || 0,
       contactNumber: this.contactNumber ? Number(this.contactNumber) : null,
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

        // // PART ITEMS

        // ...this.materialedJobCarDList.map((item: any) => ({
        //   id: item.id,
        //   itemType: 'Part',

        //   materialId: item.materialTransferId || item.materialId || 0,
        //   partItemId: item.itemId || item.partItemId || 0,

        //   labourId: item.labourId || 0,
        //   partWiseLabourId: item.partWiseLabourId || 0,

        //   //partItemId: item.itemId || 0,

        //   qty: 0,
        //   rate: 0,
        //   partHsnCode: item.partHsnCode || '',
        //   discountValue: item.discountValue || 0,
        //   discount: item.discount || 0,
        //   discountType: item.discountType || 'Value',

        //   igstAmount: item.igstAmount || 0,
        //   cgstAmount: item.cgstAmount || 0,
        //   sgstAmount: item.sgstAmount || 0,

        //   taxableAmount: 0,
        //   netAmount: 0,


        //   issueType: Number(item.issueType) || 0,

        //   isAutoGenerated: false,

        //   partQty: item.partQty || 0,
        //   partRate: item.partRate || 0,
        //   fscRate: item.issuetypeName === 'U/W'
        //     ? item.partRate
        //     : item.issuetypeName === 'FSC'
        //       ? item.fscRate
        //       : 0,

        //   partDiscount: item.discount || 0,

        //   partTaxbleAmount: item.taxableAmount || 0,

        //   partNetAmount: item.netAmount || 0,
        //   totalTaxPer: item.igst
        // })),

        // // LABOUR ITEMS
        // ...this.labourItems.map((item: any) => ({
        //   id: item.id,
        //   itemType: 'Labour',

        //   materialId: 0,
        //   partItemId: 0,

        //   labourId: item.labourId || 0,
        //   partWiseLabourId: item.partWiseLabourId || 0,

        //   qty: item.qty || 0,
        //   rate: item.rate || 0,
        //   labourHsnCode: item.labourHsnCode || '',

        //   discountValue: item.discountValue || 0,
        //   discount: item.discount || 0,
        //   discountType: item.discountType || 'Value',

        //   igstAmount: item.igstAmount || 0,
        //   cgstAmount: item.cgstAmount || 0,
        //   sgstAmount: item.sgstAmount || 0,

        //   taxableAmount: item.taxableAmount || 0,
        //   netAmount: item.netAmount || 0,

        //   issueType: Number(item.issuetypeId) || 0,

        //   isAutoGenerated: item.isAutoGenerated || false,

        //   partQty: 0,
        //   fscRate: 0,

        //   partDiscount: 0,
        //   partTaxbleAmount: 0,
        //   partNetAmount: 0
        // }))
        // ============================================
// PART ITEMS
// ============================================

...this.partItems.map((item: any) => ({

  id: item.id || 0,

  itemType: 'Part',

  materialId:
    item.materialTransferId ||
    item.materialId ||
    0,

  partItemId:
    item.itemId ||
    item.partItemId ||
    0,

  labourId:
    item.labourId || 0,

  partWiseLabourId:
    item.partWiseLabourId || 0,

  qty: 0,

  rate: 0,

  partHsnCode:
    item.partHsnCode || '',

  discountValue:
    Number(item.discountValue || 0),

  discount:
    Number(item.discount || 0),

  discountType:
    item.discountType || 'Value',

  igstAmount:
    Number(item.igstAmount || 0),

  cgstAmount:
    Number(item.cgstAmount || 0),

  sgstAmount:
    Number(item.sgstAmount || 0),

  taxableAmount: 0,

  netAmount: 0,

  issueType:
    Number(
      item.issuetypeId ||
      item.issueType ||
      0
    ),

  isAutoGenerated:
    item.isAutoGenerated || true,

  partQty:
    Number(item.partQty || 0),

  partRate:
    Number(item.partRate || 0),

  fscRate:
    item.issuetypeName === 'U/W'
      ? Number(item.partRate || 0)
      : item.issuetypeName === 'FSC'
        ? Number(item.fscRate || 0)
        : 0,

  partDiscount:
    Number(item.discount || 0),

  partTaxbleAmount:
    Number(item.taxableAmount || 0),

  partNetAmount:
    Number(item.netAmount || 0),

  totalTaxPer:
    Number(item.totalTaxPer || 0)

})),

// ---------- LABOUR ITEMS ----------
        ...this.labourItems.map((item: any) => ({
          id: item.id || 0,
          itemType: 'Labour',

          materialId: 0,
          partItemId: 0,

          labourId: item.labourId || 0,
          partWiseLabourId: item.partWiseLabourId || 0,

          qty: Number(item.qty || 0),
          rate: Number(item.rate || 0),
          labourHsnCode: item.labourHsnCode || '',

          discountValue: Number(item.discountValue || 0),
          discount: Number(item.discount || 0),
          discountType: item.discountType || 'Value',

          igstAmount: Number(item.igstAmount || 0),
          cgstAmount: Number(item.cgstAmount || 0),
          sgstAmount: Number(item.sgstAmount || 0),

          taxableAmount: Number(item.taxableAmount || 0),
          netAmount: Number(item.netAmount || 0),

          issueType: Number(item.issuetypeId || 0),
          isAutoGenerated: item.isAutoGenerated || false,

          partQty: 0,
          partRate: 0,
          fscRate: 0,

          partDiscount: 0,
          partTaxbleAmount: 0,
          partNetAmount: 0,
          totalTaxPer: Number(item.totalTaxPer || 0)
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

    private normalizeRepairBillPrefix(prefix: string): string {
    if (!prefix) {
      return prefix;
    }

    return prefix.replace(/\d+$/, '');
  }

  // NEW — this is the method the Part "+Add" button was missing entirely.
  // Previously, clicking Add on a manually-entered part did nothing unless
  // isPartEditMode was true (editing an existing, auto-populated row).
  addPart(): void {
    if (!this.itemcode) {
      this.toaster.show('Please select a part.', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }

    const partCode = this.itemcode; // captured before calculatePart() clears the form

    const alreadyExists = this.partItems.some(x =>
      x.partCode?.trim().toLowerCase() === partCode.trim().toLowerCase()
    );

    if (alreadyExists) {
      Swal.fire({ icon: 'warning', title: 'Duplicate Part', text: 'This part is already added.' });
      return;
    }

    const selectedItem = this.selectedPart; // set by selectPart()

    // ASSUMPTION: selectedItem carries cgst/sgst/igst/hsncode/custprice/id —
    // inferred from ItemMaster.Cgst/Sgst/Igst being used directly elsewhere
    // in this codebase (RepairBillRepo's GetRepairBillById and
    // generateRepairBillPerformaDetails both read d.PartItem.Cgst/Sgst/Igst).
    // I haven't seen ItemMasterService.getItemsByItemType's actual return
    // shape — if these come back undefined, the part's GST will silently
    // compute as 0, which is the first thing to check if numbers look wrong
    // on a freshly-added manual part.
    const partItem: PartItem = {
      id: 0,
      materialId: 0,
      partItemId: selectedItem?.id || 0,
      partCode: partCode,
      partDesc: this.selectedPartDescription,
      partQty: this.selectedPartQty || 1,
      partRate: this.selectedPartRate || 0,
      partMRP: selectedItem?.custprice || 0,
      fscRate: 0,
      partHsnCode: selectedItem?.hsncode || '',
      discountValue: this.partdiscount || 0,
      discount: this.partdiscount || 0,
      discountType: this.discountPartType,
      taxableAmount: 0,
      taxAmount: 0,
      netAmount: 0,
      totalTaxPer: 0,
      issuetypeId: this.selectedPartIssueType || 0,
      issuetypeName: this.IssueType.find(x => x.id === this.selectedPartIssueType)?.name || '',
      cgst: selectedItem?.cgst || 0,
      sgst: selectedItem?.sgst || 0,
      igst: selectedItem?.igst || 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      dealerState: this.dealerState,
      custState: this.selectedJobCard?.partyState,
      isAutoGenerated: false
    } as PartItem;

    this.partItems.push(partItem);
    //this.materialedJobCarDList.push(partItem); // kept in sync — calculateTotals() reads from materialedJobCarDList, the grid renders from partItems

    this.calculatePart(partItem); // computes GST/net, calls calculateTotals(), clears the entry form

    //this.loadSuggestedLabourForPart(partCode);
    this.autoAddLabourForPart(partItem);
  }

  autoAddLabourForPart(part: PartItem): void {
  const jobId = this.selectedJobCard?.jobCardHeader?.id;
  if (!jobId || !part?.partCode) {
    return;
  }

  this.jobCardService.getLabourCodesByPart(part.partCode, jobId).subscribe({
    next: (res: any[]) => {
      (res || []).forEach(labour => {
        const pwId = labour.partWiseLabourId ?? labour.partwiseLabourId ?? 0;

        // duplicate nako
        const exists = this.labourItems.some(x =>
          (pwId && x.partWiseLabourId === pwId) ||
          (x.labourCode || '').trim().toLowerCase() ===
          (labour.labourCode || '').trim().toLowerCase()
        );
        if (exists) {
          return;
        }

        const isZeroTax = part.issuetypeName === 'U/W' || part.issuetypeName === 'FSC';

        const rate = Number(labour.labourRate || 0);
        const cgst = Number(labour.cgst || 0);
        const sgst = Number(labour.sgst || 0);
        const igst = Number(labour.igst || 0);

      
        const dealer = (this.dealerState || '').trim().toUpperCase();
        const cust = (this.selectedJobCard?.partyState || '').trim().toUpperCase();
        const isSameState = !!dealer && dealer === cust;

        const taxable = isZeroTax ? 0 : rate;
        const cgstAmount = isZeroTax || !isSameState ? 0 : taxable * cgst / 100;
        const sgstAmount = isZeroTax || !isSameState ? 0 : taxable * sgst / 100;
        const igstAmount = isZeroTax || isSameState ? 0 : taxable * igst / 100;
        const taxAmount = cgstAmount + sgstAmount + igstAmount;

        this.labourItems.push({
          partWiseLabourId: pwId,
          labourId: 0,
          labourCode: labour.labourCode,
          description: labour.labourName ?? labour.labourDescription ?? '',
          qty: 1,
          rate: rate,
          waveRate: this.waveRate ?? 0,
          labourHsnCode: labour.labourHsnCode ?? labour.hsnCode ?? labour.hsncode ?? '',
          discountValue: 0,
          discount: 0,
          discountType: 'Value',
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          igstAmount: igstAmount,
          taxableAmount: taxable,
          taxAmount: taxAmount,
          totalTaxPer: isSameState ? cgst + sgst : igst,
          netAmount: taxable + taxAmount,
          issuetypeId: part.issuetypeId || 0,
          issuetypeName: part.issuetypeName || '',
          isAutoGenerated: true,
          partCode: part.partCode,
          dealerState: this.dealerState,
          custState: this.selectedJobCard?.partyState
        } as LabourItem);
      });

      this.calculateTotals();
    },
    error: (err) => {
      console.error('Error fetching labour for part', err);
    }
  });
}

  // NEW
  // loadSuggestedLabourForPart(partCode: string): void {
  //   const jobId = this.selectedJobCard?.jobCardHeader?.id;
  //   if (!jobId) {
  //     return;
  //   }

  //   this.jobCardService.getLabourCodesByPart(partCode, jobId).subscribe({
  //     next: (res: any[]) => {
  //       if (res && res.length > 0) {
  //         this.suggestedLabourList = res;
  //         // Pre-checked by default — user deselects rather than hunting to select.
  //         // Change to `new Set<number>()` if you'd rather they opt in instead.
  //         this.selectedSuggestedLabourIds = new Set(res.map(x => x.partwiseLabourId));
  //         this.showLabourSuggestionPopup = true;
  //       }
  //       // No matching labour codes: no popup, nothing interrupts the flow.
  //     },
  //     error: (err) => {
  //       console.error('Error fetching suggested labour codes', err);
  //     }
  //   });
  // }

  // // NEW
  // toggleSuggestedLabour(id: number): void {
  //   if (this.selectedSuggestedLabourIds.has(id)) {
  //     this.selectedSuggestedLabourIds.delete(id);
  //   } else {
  //     this.selectedSuggestedLabourIds.add(id);
  //   }
  // }

  // // NEW
  // confirmAddSuggestedLabour(): void {
  //   this.suggestedLabourList
  //     .filter(l => this.selectedSuggestedLabourIds.has(l.partwiseLabourId))
  //     .forEach(labour => {
  //       const exists = this.labourItems.some(x => x.partWiseLabourId === labour.partwiseLabourId);
  //       if (exists) return;

  //       this.labourItems.push({
  //         partWiseLabourId: labour.partwiseLabourId,
  //         labourId: 0,
  //         labourCode: labour.labourCode,
  //         description: labour.labourName,
  //         qty: 1,
  //         rate: labour.labourRate ?? 0,
  //         waveRate: this.waveRate ?? 0,
  //         labourHsnCode: labour.labourHsnCode ?? '',
  //         discountValue: 0,
  //         discount: 0,
  //         discountType: this.discountType,
  //         igst: labour.igst ?? 0,
  //         igstAmount: 0,
  //         cgst: labour.cgst ?? 0,
  //         cgstAmount: 0,
  //         sgst: labour.sgst ?? 0,
  //         sgstAmount: 0,
  //         taxableAmount: 0,
  //         taxAmount: 0,
  //         totalTaxPer: 0,
  //         netAmount: labour.labourRate ?? 0,
  //         issuetypeId: 0,
  //         issuetypeName: '',
  //         // Deliberately NOT auto-generated: the user explicitly confirmed
  //         // this one, unlike the silent Material-Transfer-driven rows — so
  //         // it stays editable/deletable like any manually-added labour line.
  //         isAutoGenerated: false,
  //         partCode: null
  //       });
  //     });

  //   this.calculateTotals();
  //   this.closeSuggestedLabourPopup();
  // }

  // // NEW
  // closeSuggestedLabourPopup(): void {
  //   this.showLabourSuggestionPopup = false;
  //   this.suggestedLabourList = [];
  //   this.selectedSuggestedLabourIds = new Set<number>();
  // }

}