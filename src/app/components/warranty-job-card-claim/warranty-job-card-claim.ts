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
  constructor(
    private loader: LoaderService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private locationService: LocationMasterService,
    private jobcardService: JobCardService,
    private prefixService: PrefixService
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

  selectJob(item: any, modal: any) {

    this.selectedJob = { ...item };

    modal.close();
  }

  get partDetails() {
    return this.selectedJob?.repairBillDetails?.filter(x => x.itemType === 'Part') || [];
  }

  get labourDetails() {
    return this.selectedJob?.repairBillDetails?.filter(x => x.itemType === 'Labour') || [];
  }

}
