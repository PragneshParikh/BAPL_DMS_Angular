import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { PrefixService } from '../../core/services/prefix';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { LocationMasterService } from '../../core/services/location-master-service';
import { JobCardService } from '../../core/services/job-card-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { WarrantyJCClaimService } from '../../core/services/warranty-jcclaim-service';

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

  totalPartsQty: number = 0;
  totalPartsRate: number = 0;
  totalPartsIgst: number = 0;
  totalPartsAmount: number = 0;

  totalLabourQty: number = 0;
  totalLabourRate: number = 0;
  totalLabourIgst: number = 0;
  totalLabourAmount: number = 0;


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
    private warrantyJCClaimService: WarrantyJCClaimService
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

    this.loadPrefix();
    this.loadSuplier();
    this.loadlocation();
    // this.loadJobCarDetails();


  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadPrefix(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    const module = 'wclaim_prefix';
    this.prefixService.getPrefixByDealerByModule(dealerCode, module).subscribe({
      next: (res: string) => {
        this.loader.hide();
        this.WjobClaimprefix = res;
        this.claimNo = Number(res.split('/').pop());
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
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();

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
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    let jobNo = this.jobSearch.jobNo;
    let fromDate = this.jobSearch.rBillfromDate;
    let toDate = this.jobSearch.rBilltoDate;
    let serviceloc = this.selectedLocationId;


    this.jobcardService.getIssueTypebasedJobDetails(dealerCode, jobNo, serviceloc, fromDate, toDate).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.jobCardList = res;
        const allDetails = this.jobCardList[0].repairBillDetails || [];


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
    this.loadlocation();
    this.loadJobCarDetails();
    this.modalService.open(content, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
      scrollable: true
    });

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
    this.totalLabourAmount = this.labourGridData.reduce((sum, item) => sum + (item.totalWithTax || 0), 0);
  }
  selectJob(item: any, modal: any) {

    this.selectedJob = { ...item };
    this.selectedJob.repairBillDetails?.forEach((x: any) => {
      x.dealerObservation = '';
      x.rootCauseAnalysis = '';
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

    if (!this.selectedSupplierId) {
      this.toaster.show('Please Select Supplier !', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }

    if (this.selectedJob?.repairBillDetails?.length == 0) {
      this.toaster.show('No Claim details Found !', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
    }

    const invalidPartDealer = this.partDetails.findIndex(x =>
      !x.dealerObservation || x.dealerObservation.trim() === ''
    );

    if (invalidPartDealer !== -1) {
      this.toaster.show(
        `Please enter Dealer Observation for Part row ${invalidPartDealer + 1}.`,
        {
          classname: 'bg-warning text-white',
          delay: 3000
        }
      );
      return;
    }
    const invalidLabourDealer = this.labourDetails.findIndex(x =>
      !x.dealerObservation || x.dealerObservation.trim() === ''
    );

    if (invalidLabourDealer !== -1) {
      this.toaster.show(
        `Please enter Dealer Observation for Labour row ${invalidLabourDealer + 1}.`,
        {
          classname: 'bg-warning text-white',
          delay: 3000
        }
      );
      return;
    }
    const invalidPartRoot = this.partDetails.findIndex(x =>
      !x.rootCauseAnalysis || x.rootCauseAnalysis.trim() === ''
    );

    if (invalidPartRoot !== -1) {
      this.toaster.show(
        `Please enter Root Cause Analysis for Part row ${invalidPartRoot + 1}.`,
        {
          classname: 'bg-warning text-white',
          delay: 3000
        }
      );
      return;
    }
    const invalidLabourRoot = this.labourDetails.findIndex(x =>
      !x.rootCauseAnalysis || x.rootCauseAnalysis.trim() === ''
    );

    if (invalidLabourRoot !== -1) {
      this.toaster.show(
        `Please enter Root Cause Analysis for Labour row ${invalidLabourRoot + 1}.`,
        {
          classname: 'bg-warning text-white',
          delay: 3000
        }
      );
      return;
    }
    const dealerCode = this.storageService.getDealerCode();
    const model = {

      dealerCode: dealerCode,
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

    this.warrantyJCClaimService
      .insertWarrantyJCClaim(model)
      .subscribe({

        next: (res: any) => {

          this.loader.hide();

          if (res > 0) {
            this.toaster.show('Warranty Claim Saved Successfully.', {
              classname: 'bg-sucess text-white',
              delay: 300
            });


            this.resetForm();

          }
          else {

            this.toaster.show('Failed to save Warranty Claim.', {
              classname: 'bg-danger text-white',
              delay: 300
            });

          }

        },

        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toaster.show('Something went wrong.', {
            classname: 'bg-danger text-white',
            delay: 3000
          });

        }

      });

  }
  resetForm() {

    this.selectedSupplierId = null;

    this.claimType = '';

    this.selectedJob = {};

  }

}
