import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { PrefixService } from '../../core/services/prefix';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { LocationMasterService } from '../../core/services/location-master-service';
import { JobCardService } from '../../core/services/job-card-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { WarrantyJCClaimService } from '../../core/services/warranty-jcclaim-service';
import { WarrantyOrderService } from '../../core/services/warranty-order-service';
// ASSUMPTION: adjust the import path/class name if your Dealer service
// lives elsewhere - this matches the DealerService file you shared.
import { DealerService } from '../../core/services/dealer-service';

@Component({
  selector: 'app-warranty-job-card-claim',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-job-card-claim.html',
  styleUrl: './warranty-job-card-claim.scss',
})
export class WarrantyJobCardClaim implements OnInit {
  jobCardList: any[] = [];
  WjobClaimprefix: string = '';
  supplierList: any[] = [];
  selectedSupplierId: number | null = null;
  selectedLocationId: string | null = null;
  selectedJob: any = {};
  claimType: string = 'Warranty';
  claimAccount: string = 'Warranty Claim';
  partsGridData: any[] = [];
  labourGridData: any[] = [];

  // Dealer dropdown - lets this claim be filed against ANY dealer, not
  // just the currently logged-in one (e.g. OEM/support staff filing on a
  // dealer's behalf). Everything below that used to read
  // storageService.getDealerCode() directly now reads this instead.
  dealerList: any[] = [];
  selectedDealerCode: string | null = null;

  totalPartsQty: number = 0;
  totalPartsRate: number = 0;
  totalPartsIgst: number = 0;
  totalPartsAmount: number = 0;

  totalLabourQty: number = 0;
  totalLabourRate: number = 0;
  totalLabourIgst: number = 0;
  totalLabourAmount: number = 0;
  viewClaimId: number | null = null;
  isViewMode: boolean = false;

  jobSearch: any = {
    jobNo: 0,
    rBillfromDate: '',
    rBilltoDate: '',
    locationId: ''
  };
  claimNo: number = 0;
  fromDate: string;
  toDate: string;
  locationList: any[] = [];
  dealerObservation: string;
  rootCauseAnalysis: string;
  constructor(
    private loader: LoaderService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private locationService: LocationMasterService,
    private jobcardService: JobCardService,
    private prefixService: PrefixService,
    private toaster: ToastService,
    private warrantyJCClaimService: WarrantyJCClaimService,
    private warrantyOrderService: WarrantyOrderService,
    private dealerService: DealerService,
    private router: Router
  ) { }
  ngOnInit(): void {

    const today = new Date();

    // Current month first date
    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const lastnintyDayeOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      90
    )

    this.fromDate = this.formatDate(lastnintyDayeOfMonth);
    this.toDate = this.formatDate(today);

    this.jobSearch.rBillfromDate = this.formatDate(firstDayOfMonth);
    this.jobSearch.rBilltoDate = this.formatDate(today);

    // loadPrefix()/loadlocation() are no longer called directly here -
    // loadDealers() picks a default dealer and then triggers both via
    // onDealerChange(), so they always run scoped to whichever dealer
    // ends up selected.
    this.loadDealers();
    this.loadSuplier();
    // this.loadJobCarDetails();
    const viewClaimIdRaw = sessionStorage.getItem('viewWarrantyJCClaimId');
    if (viewClaimIdRaw) {
      sessionStorage.removeItem('viewWarrantyJCClaimId');
      this.viewClaimId = Number(viewClaimIdRaw);
      this.loadClaimForView(this.viewClaimId);
    }

  }

  // Populates the Dealer dropdown, then defaults the selection to the
  // logged-in user's own dealer - the dropdown lets them override it.
  loadDealers(): void {
    this.loader.show();
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        this.loader.hide();
        // GetDealerDropdown wraps the array in { success, data } - unwrap
        // it here, rather than assuming res itself is the list (this was
        // the actual cause of the dropdown appearing empty earlier).
        this.dealerList = res?.data || [];

        const currentDealerCode = this.storageService.getDealerCode();
        if (currentDealerCode && this.dealerList.some((d: any) => d.dealerCode === currentDealerCode)) {
          this.selectedDealerCode = currentDealerCode;
        }

        this.onDealerChange();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load dealer list.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  // Re-runs everything that's scoped to a single dealer whenever the
  // selection changes - Claim Prefix and Location list. Skips clearing
  // the selected job while in view mode, so this doesn't race with
  // loadClaimForView() wiping out the claim that was just loaded for
  // viewing (both fire from ngOnInit around the same time).
  onDealerChange(): void {
    if (!this.isViewMode) {
      this.selectedJob = {};
      this.partsGridData = [];
      this.labourGridData = [];
      this.calculatePartsTotal();
      this.calculateLabourTotal();
    }

    if (!this.selectedDealerCode) {
      this.locationList = [];
      return;
    }

    this.loadPrefix();
    this.loadlocation();
  }

  loadClaimForView(id: number): void {
    this.loader.show();
    this.warrantyOrderService.getWarrantyJCClaimById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.isViewMode = true;

        // ASSUMPTION: GetWarrantyJCClaimById's response includes
        // dealerCode - if it doesn't yet, this line is a no-op and the
        // dropdown just keeps whatever loadDealers() defaulted it to.
        this.selectedDealerCode = res.dealerCode ?? this.selectedDealerCode;

        this.WjobClaimprefix = res.claimPrefix ?? this.WjobClaimprefix;
        this.claimNo = res.claimNo ?? this.claimNo;
        this.toDate = res.claimDate?.substring(0, 10) ?? this.toDate;
        this.selectedSupplierId = res.supplierId ?? this.selectedSupplierId;
        this.selectedLocationId = res.serviceLocation ?? this.selectedLocationId;

        this.selectedJob = {
          serviceHead: res.serviceHead,
          serviceType: undefined, // not in backend response
          jobNo: res.jobCardNo,
          chassisNo: res.chassisNo,
          motorNo: res.motorNo,
          repairBillNo: res.invoiceNo,
          repairBillDate: res.invoiceDate,
          vehiclekms: res.kms,
          customerName: undefined,
          registrationNo: undefined, 
          saleDate: undefined, 
          failureDate: undefined, 
  
          repairBillDetails: (res.details || []).map((d: any) => ({
            detailId: d.id, // WarrantyJcclaimDetail's own Id - needed to save updates back correctly
            itemType: d.itemType,

            partitemName: d.partName,
            partitemDesc: d.partDescription,
            partItemQty: d.quantity,
            partItemRate: d.rate ?? 0,

            labourName: d.labourCode,
            labourDesc: d.labourDescription,
            labourQty: d.quantity,
            labourRate: d.rate ?? 0,

            igstAmount: d.igstAmount,
            mrp: d.mrp,
            amount: d.totalAmount,       // Part Item Details table's "Amount" column
            totalWithTax: d.totalAmount, // Labour Details table's "Amount" column

            inwardSerial: '',
            outwardSerial: '',

            dealerObservation: d.dealerObservation ?? '',
            rootCauseAnalysis: d.rootCauseAnalysis ?? '',
            claimType: 'Warranty Claim'
          }))
        };

        const allDetails = this.selectedJob.repairBillDetails;
        this.partsGridData = allDetails.filter((x: any) => x.itemType === 'Part');
        this.calculatePartsTotal();
        this.labourGridData = allDetails.filter((x: any) => x.itemType === 'Labour');
        this.calculateLabourTotal();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load the claim.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadPrefix(): void {
    if (!this.selectedDealerCode) return;

    this.loader.show();
    const dealerCode = this.selectedDealerCode;
    const module = 'wclaim_prefix';
    this.prefixService.getPrefixByDealerByModule(dealerCode, module).subscribe({
      next: (res: string) => {
        this.loader.hide();

        // res is the FULL next-claim string, e.g. "wjc/435/26-27/079" -
        // WjobClaimprefix must be only the prefix portion WITHOUT the
        // trailing sequence number, otherwise displaying prefix+claimNo
        // together elsewhere (as this app does everywhere else, e.g.
        // {{claim.claimPrefix}}{{claim.claimNo}}) duplicates the number:
        // "wjc/435/26-27/079" + "79" = "wjc/435/26-27/07979". Splitting
        // off the last segment and keeping the trailing "/" gives
        // "wjc/435/26-27/" + "79" = "wjc/435/26-27/79" - no repetition.
        const parts = res.split('/');
        const lastSegment = parts.pop() ?? '';
        this.WjobClaimprefix = parts.join('/') + '/';
        this.claimNo = Number(lastSegment);
      }, error: (err) => {
        this.loader.hide();
        console.error(err);

      }
    })
  }

  loadSuplier(): void {

    this.loader.show();
    this.ledgerService.getCompanyLedgers().subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.supplierList = res;
        if (this.supplierList.length === 1) {
          this.selectedSupplierId = this.supplierList[0].id;
        }
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    })

  }

  loadlocation(): void {
    if (!this.selectedDealerCode) return;

    this.loader.show();
    const dealerCode = this.selectedDealerCode;

    this.locationService.getLocationDropdownByDealerCode(dealerCode,).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.locationList = res;
        this.locationList = res.filter((x: any) => x.locareaidno === 2);
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    })
  }


  loadJobCarDetails(): void {
    if (!this.selectedDealerCode) {
      this.toaster.show('Please select a Dealer first.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    this.loader.show();
    const dealerCode = this.selectedDealerCode;
    let jobNo = this.jobSearch.jobNo;
    let fromDate = this.jobSearch.rBillfromDate;
    let toDate = this.jobSearch.rBilltoDate;
    let serviceloc = this.selectedLocationId;


    this.jobcardService.getIssueTypebasedJobDetails(dealerCode, jobNo, serviceloc, fromDate, toDate).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.jobCardList = res || [];

        if (this.jobCardList.length === 0) {
          this.toaster.show('No job cards found for the given search.', {
            classname: 'bg-warning text-white',
            delay: 3000
          });
          this.partsGridData = [];
          this.labourGridData = [];
          return;
        }

        const allDetails = this.jobCardList[0]?.repairBillDetails || [];

        this.partsGridData = allDetails.filter((x: any) => x.itemType === 'Part');
        this.calculatePartsTotal();

        this.labourGridData = allDetails.filter((x: any) => x.itemType === 'Labour');
        this.calculateLabourTotal();
      }, error: (err) => {
        this.loader.hide();
        console.error(err)
      }
    })

  }

  openJobSearch(content: any) {
    if (!this.selectedDealerCode) {
      this.toaster.show('Please select a Dealer first.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    this.loadlocation();
    this.loadJobCarDetails();
    this.modalService.open(content, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
      scrollable: true
    });

  }

  goToClaimList(): void {
    this.router.navigate(['/warranty-claim-list']);
  }

  calculatePartsTotal() {
    this.totalPartsQty = this.partsGridData.reduce((sum, item) => sum + (item.partItemQty || 0), 0);
    this.totalPartsRate = this.partsGridData.reduce((sum, item) => sum + (item.partItemRate || 0), 0);
    this.totalPartsIgst = this.partsGridData.reduce((sum, item) => sum + (item.igstAmount || 0), 0);
    this.totalPartsAmount = this.partsGridData.reduce((sum, item) => sum + (item.rowSubTotal || 0), 0);
  }

 calculateLabourTotal() {
  this.totalLabourQty = this.labourGridData.reduce((sum, item) => sum + (item.labourQty || 0), 0);
  this.totalLabourRate = this.labourGridData.reduce((sum, item) => sum + (item.labourRate || 0), 0);
  this.totalLabourIgst = this.labourGridData.reduce((sum, item) => sum + (item.igstAmount || 0), 0);
  this.totalLabourAmount = this.labourGridData.reduce((sum, item) => {
    const base = (item.labourQty || 0) * (item.labourRate || 0);
    const gst = item.igstAmount || 0;
    return sum + (item.totalWithTax ?? (base + gst));
  }, 0);
}
  selectJob(item: any, modal: any) {
    this.selectedJob = { ...item };
    this.selectedJob.repairBillDetails?.forEach((x: any) => {
      x.dealerObservation = '';
      x.rootCauseAnalysis = '';
      if (x.itemType === 'Labour' && !x.mrp) {
        x.mrp = x.labourRate ?? 0;
      }
    });

    modal.close();
  }

  get partDetails() {
    return this.selectedJob?.repairBillDetails?.filter(x => x.itemType === 'Part') || [];
  }

  get labourDetails() {
    return this.selectedJob?.repairBillDetails?.filter(x => x.itemType === 'Labour') || [];
  }

  saveWarrantyClaim() {

    if (this.isViewMode) {
      this.updateExistingClaim();
      return;
    }

    if (!this.selectedDealerCode) {
      this.toaster.show('Please Select Dealer !', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    if (!this.selectedSupplierId) {
      this.toaster.show('Please Select Supplier !', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    if (this.selectedJob?.repairBillDetails?.length == 0) {
      this.toaster.show('No Claim details Found !', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const invalidPartDealer = this.partDetails.findIndex(x => !x.dealerObservation || x.dealerObservation.trim() === '');
    if (invalidPartDealer !== -1) {
      this.toaster.show(`Please enter Dealer Observation for Part row ${invalidPartDealer + 1}.`, { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const invalidLabourDealer = this.labourDetails.findIndex(x => !x.dealerObservation || x.dealerObservation.trim() === '');
    if (invalidLabourDealer !== -1) {
      this.toaster.show(`Please enter Dealer Observation for Labour row ${invalidLabourDealer + 1}.`, { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const invalidPartRoot = this.partDetails.findIndex(x => !x.rootCauseAnalysis || x.rootCauseAnalysis.trim() === '');
    if (invalidPartRoot !== -1) {
      this.toaster.show(`Please enter Root Cause Analysis for Part row ${invalidPartRoot + 1}.`, { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const invalidLabourRoot = this.labourDetails.findIndex(x => !x.rootCauseAnalysis || x.rootCauseAnalysis.trim() === '');
    if (invalidLabourRoot !== -1) {
      this.toaster.show(`Please enter Root Cause Analysis for Labour row ${invalidLabourRoot + 1}.`, { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const model = {
      dealerCode: this.selectedDealerCode,
      claimPrefix: this.WjobClaimprefix,
      claimNo: this.claimNo,
      claimDate: this.toDate,
      chassisNo: this.selectedJob?.chassisNo,

      supplierId: this.selectedSupplierId,
      jobCardHeaderId: this.selectedJob?.jobcardId,
      customerLedgerId: this.selectedJob?.customerLedgerId,
      repairBillHeaderId: this.selectedJob?.repairBillHeaderId,
      ffirId: this.selectedJob?.ffirId,
      claimAccount: this.claimAccount,
      CreatedBy: '',
      repairBillDetails: this.selectedJob?.repairBillDetails
    };

    this.loader.show();

    this.warrantyJCClaimService.insertWarrantyJCClaim(model).subscribe({
      next: (res: any) => {
        this.loader.hide();

        if (res?.claimId > 0) {
          this.toaster.show('Warranty Claim Saved Successfully.', { classname: 'bg-success text-white', delay: 3000 });

          this.resetForm();

          this.router.navigate(['/uw-line-item']);
        } else {
          this.toaster.show('Failed to save Warranty Claim.', { classname: 'bg-danger text-white', delay: 3000 });
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error('Validation errors:', err?.error);
        const serverMsg = err?.error?.title || 'Something went wrong. Check console for details.';
        this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
      }
    });

  }

  updateExistingClaim(): void {
    const lines = (this.selectedJob?.repairBillDetails || [])
      .filter((d: any) => d.detailId) // skip any line without a real id
      .map((d: any) => ({
        detailId: d.detailId,
        dealerObservation: d.dealerObservation || '',
        rootCauseAnalysis: d.rootCauseAnalysis || ''
      }));

    if (lines.length === 0) {
      this.toaster.show('Nothing to update.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    this.loader.show();
    this.warrantyJCClaimService.updateWarrantyJCClaim({
      claimId: this.viewClaimId!,
      lines
    }).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Claim updated successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error('Validation errors:', err?.error);
        const serverMsg = err?.error?.title || err?.error || 'Something went wrong. Check console for details.';
        this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetForm() {

    this.selectedSupplierId = null;

    this.claimType = '';

    this.selectedJob = {};

  }

    cancel(): void {
    if (this.isViewMode) {
      this.router.navigate(['/warranty-claim-list']);
      return;
    }
    this.resetForm();
    this.isViewMode = false;
    this.viewClaimId = null;
    this.partsGridData = [];
    this.labourGridData = [];
  }


}