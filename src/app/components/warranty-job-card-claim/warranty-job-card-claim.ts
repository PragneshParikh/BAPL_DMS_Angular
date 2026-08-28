// src\app\components\warranty-job-card-claim\warranty-job-card-claim.ts
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
import { DealerService } from '../../core/services/dealer-service';
import { locationAreaMaster } from '../../constant';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-warranty-job-card-claim',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-job-card-claim.html',
  styleUrl: './warranty-job-card-claim.scss',
})
export class WarrantyJobCardClaim implements OnInit {
  readonly SUBMENU_ID = 74;
  canCreate = false;
  canEdit = false;
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
  claimLocationName: string | null = null;
  claimLocationCode: string | null = null;
  claimLocationArea: string | null = null;
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
  isDealerUser: boolean = false;

  jobSearch: any = {
    jobNo: null,
    rBillfromDate: '',
    rBilltoDate: '',
    locationId: ''
  };
  claimNo: number = 0;
  fromDate: string;
  toDate: string;
locationList: { locname: string; loccode: string | null; areaName: string | null }[] = [];
  private allLocations: any[] = [];
  private lastRawJobCards: any[] = [];

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
    private router: Router,
    private menuAccess: MenuAccessService
  ) { 
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

  ngOnInit(): void {

    const today = new Date();

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
    const viewClaimIdRaw = sessionStorage.getItem('viewWarrantyJCClaimId');
    if (viewClaimIdRaw) {
      sessionStorage.removeItem('viewWarrantyJCClaimId');
      this.isViewMode = true;
      this.viewClaimId = Number(viewClaimIdRaw);
      this.loadClaimForView(this.viewClaimId);
    }

    this.loadDealers();
    this.loadSuplier();
    // this.loadJobCarDetails();

  }

    private get workshopAreaId(): number | null {
      const match = locationAreaMaster.find(
        (a: any) => (a.name || '').toString().trim().toLowerCase() === 'workshop'
      );
      return match ? match.id : null;
  }
  // Populates the Dealer dropdown, then defaults the selection to the
  // logged-in user's own dealer - the dropdown lets them override it.
    loadDealers(): void {
      this.loader.show();
      this.dealerService.getDealerDropdown(null).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.dealerList = res?.data || [];

          // ASSUMPTION: role matched case-insensitively via .includes('admin')
          // so both "Admin" and "SuperAdmin"/"Super Admin" are covered -
          // adjust if your app uses a different exact role string.
          const role = (this.storageService.getRole() || '').toLowerCase().replace(/\s+/g, '');
          const isAdminRole = role.includes('admin');
          this.isDealerUser = !isAdminRole;

          if (this.isDealerUser) {
            const currentDealerCode = this.storageService.getDealerCode();
            if (currentDealerCode) {
              // A dealer-logged-in user only ever files as themselves - use
              // their own code regardless of whether this particular
              // dropdown list happens to include it.
              this.selectedDealerCode = currentDealerCode;
            }
          }

          // FIX: while viewing an existing claim, loadClaimForView() owns
          // selectedDealerCode - defaulting/overriding it here would
          // overwrite the correct values the moment this response lands.
          if (this.isViewMode) {
            return;
          }

          this.applyDefaultDealerSelection();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toaster.show('Failed to load dealer list.', { classname: 'bg-danger text-white', delay: 3000 });
        }
      });
  }

  private applyDefaultDealerSelection(): void {
      // Only defaults from storage for admin logins - a dealer login's
      // selectedDealerCode was already set (to their own code) above in
      // loadDealers(), and shouldn't be re-derived or overridden here.
      if (!this.isDealerUser) {
        const currentDealerCode = this.storageService.getDealerCode();
        if (currentDealerCode && this.dealerList.some((d: any) => d.dealerCode === currentDealerCode)) {
          this.selectedDealerCode = currentDealerCode;
        }
      }

      this.onDealerChange();
  }

// Display text for the fixed Dealer field when isDealerUser is true -
// falls back to the raw code if this dealer isn't in dealerList for
// some reason (e.g. the dropdown endpoint scopes differently).
  get loggedInDealerDisplay(): string {
      const match = this.dealerList.find((d: any) => d.dealerCode === this.selectedDealerCode);
      return match ? `${match.dealerName} (${match.dealerCode})` : (this.selectedDealerCode || '');
  }

  // Re-runs everything scoped to a single dealer whenever the selection
  // changes - Claim Prefix and the location lookup catalog. Skips
  // clearing the selected job while in view mode.
  onDealerChange(): void {
    if (!this.isViewMode) {
      this.selectedJob = {};
      this.partsGridData = [];
      this.labourGridData = [];
      this.calculatePartsTotal();
      this.calculateLabourTotal();
      this.claimLocationName = null;
      this.claimLocationCode = null;
      this.claimLocationArea = null; 
      this.locationList = [];
      this.lastRawJobCards = [];
    }

    if (!this.selectedDealerCode) {
      this.allLocations = [];
      return;
    }

    this.loadPrefix();
    this.loadAllLocations();
  }

  loadClaimForView(id: number): void {
    this.loader.show();
    this.warrantyOrderService.getWarrantyJCClaimById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.isViewMode = true;

        this.selectedDealerCode = res.dealerCode ?? this.selectedDealerCode;
        this.WjobClaimprefix = res.claimPrefix ?? this.WjobClaimprefix;
        this.claimNo = res.claimNo ?? this.claimNo;
        this.toDate = res.claimDate?.substring(0, 10) ?? this.toDate;
        this.selectedSupplierId = res.supplierId ?? this.selectedSupplierId;
        this.selectedLocationId = res.serviceLocation ?? this.selectedLocationId;

        // Location was already resolved (Workshop-scoped) and persisted
        // at InsertWarrantyJCClaim time - read it straight back.
        this.claimLocationName = res.locationName ?? this.claimLocationName;
        this.claimLocationCode = res.locationCode ?? this.claimLocationCode;

        this.selectedJob = {
          serviceHead: res.serviceHead,
          serviceType: undefined,
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
            detailId: d.id,
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
            amount: d.totalAmount,
            totalWithTax: d.totalAmount,

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

        this.isViewMode = false;
        this.viewClaimId = null;
        if (this.dealerList.length > 0) {
          this.applyDefaultDealerSelection();
        }
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

        if (!this.isViewMode && this.supplierList.length === 1) {
          this.selectedSupplierId = this.supplierList[0].id;
        }
      }, error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    })

  }

  private getAreaName(locareaidno: number): string {
      const match = locationAreaMaster.find((a: any) => a.id === locareaidno);
      return match?.name || '';
  }
  private loadAllLocations(): void {
    this.locationService.getAllLocationMaster().subscribe({
      next: (res: any) => {
        this.allLocations = res?.data || res || [];

        // Rebuild the popup's dropdown labels now that codes may be
        // available, in case job cards were already searched before
        // this lookup finished loading.
        if (this.lastRawJobCards.length > 0) {
          this.locationList = this.buildLocationOptionsFromJobCards(this.lastRawJobCards);
        }

        if (this.selectedJob?.jobLocation) {
          this.resolveWorkshopLocation(this.selectedJob.jobLocation);
        }
      },
      error: (err) => {
        console.error('Failed to load location catalog:', err);
        this.allLocations = [];
      }
    });
  }

  // The Locareaidno that represents "Workshop" specifically, resolved by
  // name from locationAreaMaster rather than a hardcoded id.
  private resolveLocationByCode(loccode: string | null | undefined): { locname: string | null; areaName: string | null; dealerCode: string | null } {
      if (!loccode) return { locname: null, areaName: null, dealerCode: null };

      const match = this.allLocations.find((loc: any) => loc.loccode === loccode);
      if (!match) {
        console.warn(`No LocationMaster row found for Loccode "${loccode}" - this job card's Serviceloc may be stale or invalid.`);
        return { locname: null, areaName: null, dealerCode: null };
      }

      return {
        locname: match.locname,
        areaName: this.getAreaName(match.locareaidno),
        dealerCode: match.dealercode
      };
  }
    
  // Builds the popup's Location dropdown options directly from the
  // CURRENT job card search results only - each distinct jobLocation
  // name becomes exactly one option, with its Workshop code resolved
  // (if found). This is the only source the dropdown ever shows - it
  // can never display a location unrelated to an actual job card.
private buildLocationOptionsFromJobCards(jobCards: any[]): { locname: string; loccode: string | null; areaName: string | null }[] {
    const seen = new Set<string>();
    const options: { locname: string; loccode: string | null; areaName: string | null }[] = [];

    for (const item of jobCards) {
      const key = item.jobLocationCode || (item.jobLocation || '').toUpperCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const resolved = this.resolveLocationByCode(item.jobLocationCode);
      options.push({
        locname: resolved.locname || item.jobLocation || '',
        loccode: item.jobLocationCode || null,
        areaName: resolved.areaName
      });
    }

    return options;
}

  // Called once a job card is selected - resolves and retains its
  // Workshop location (name always exact from the job card; code
private resolveWorkshopLocation(jobLocationName: string | null | undefined): void {
    const name = (jobLocationName || '').toString().trim();
    this.claimLocationName = name || null;

    if (!name) {
      this.claimLocationCode = null;
      this.claimLocationArea = null;
      return;
    }

    const resolved = this.resolveLocationByCode(name);
    //this.claimLocationCode = resolved.loccode;
    this.claimLocationArea = resolved.areaName;
}

  // e.g. "RR Test, Karvenagar (CUS0487W1) [Workshop]"
  getJobCardLocationLabel(item: any): string {
      const resolved = this.resolveLocationByCode(item.jobLocationCode);
      const name = resolved.locname || item.jobLocation || '';
      if (!item.jobLocationCode) return name;
      let label = `${name} (${item.jobLocationCode})`;
      if (resolved.areaName) label += ` [${resolved.areaName}]`;
      return label;
  }

  // e.g. "RR TEST (CUS0487)" - lets a superadmin see which dealer each
  // returned job card actually belongs to, derived from its own location
  // code rather than a guessed job-card field.
  getJobCardDealerLabel(item: any): string {
      const code = this.resolveLocationByCode(item.jobLocationCode).dealerCode;
      if (!code) return '';
      const name = this.dealerList.find((d: any) => d.dealerCode === code)?.dealerName;
      return name ? `${name} (${code})` : code;
  }
  loadJobCarDetails(): void {
    if (!this.selectedDealerCode) {
      this.toaster.show('Please select a Dealer first.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    this.loader.show();
    const dealerCode = this.selectedDealerCode;

    let jobNo = this.jobSearch.jobNo;
    if (jobNo === null || jobNo === undefined || jobNo === '') {
      jobNo = 0;
    } else {
      jobNo = Number(jobNo);
      if (isNaN(jobNo)) jobNo = 0;
    }

    let fromDate = this.jobSearch.rBillfromDate;
    let toDate = this.jobSearch.rBilltoDate;

    // Always fetch WITHOUT a server-side location filter, then build the
    // dropdown from these exact results and narrow client-side if the
    // user picked one - guarantees the dropdown can never disagree with
    // what's actually on a job card (see buildLocationOptionsFromJobCards).
    this.jobcardService.getIssueTypebasedJobDetails(dealerCode, jobNo, null, fromDate, toDate).subscribe({
      next: (res: any) => {
        this.loader.hide();
        const rawResults = res || [];
        this.lastRawJobCards = rawResults;

        this.locationList = this.buildLocationOptionsFromJobCards(rawResults);

        let results = rawResults;

        if (this.selectedLocationId) {
          const selectedLocName = this.selectedLocationId.toString().trim().toUpperCase();
          results = rawResults.filter((item: any) =>
            (item.jobLocation || '').toString().trim().toUpperCase() === selectedLocName
          );
        }

        this.jobCardList = results;

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

    // Reset any previous filter so the first load shows every job card
    // (and therefore every real location) for this dealer.
    this.selectedLocationId = null;
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

    const resolved = this.resolveLocationByCode(item.jobLocationCode);
    this.claimLocationName = resolved.locname || item.jobLocation || null;
    this.claimLocationCode = item.jobLocationCode || null;
    this.claimLocationArea = resolved.areaName;

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

      locationName: this.claimLocationName,
      locationCode: this.claimLocationCode,

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
      .filter((d: any) => d.detailId)
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

    this.claimLocationName = null;
    this.claimLocationCode = null;
    this.claimLocationArea = null;  

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