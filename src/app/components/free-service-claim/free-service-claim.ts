import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, from, toArray } from 'rxjs';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { FreeServiceClaimService } from '../../core/services/free-service-claim';
import { CommonModule } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { LocationMasterService } from '../../core/services/location-master-service';
import { StorageService } from '../../core/services/storage';
import { PrefixService } from '../../core/services/prefix';
import { SharedModule } from '../../shared/shared.module';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { MenuAccessService } from '../../core/services/menu-access.service';

@Component({
  selector: 'app-free-service-claim',
  imports: [CommonModule, NgbTooltip, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './free-service-claim.html',
  styleUrl: './free-service-claim.scss',
})
export class FreeServiceClaim implements OnInit {
  @ViewChild('claimFilterForm') claimFilterForm!: NgForm;
  readonly SUBMENU_ID = 66;
  canCreate = false;
  canEdit = false;
  canDownload = false;
  claimId: number = 0;
  isEdit: boolean = false;
  dealerCode: string | null = null;

  pendingClaimjobCardList: any[] = [];
  filteredJobList: any[] = [];
  filterStatus: string = '';
  locationList: any[] = [];
  supplierList: any[] = [];
  claimSubmitList: any[] = [];

  isSuperAdmin: boolean;
  user: any;

  claimFormData: any = {
    id: 0,
    locationCode: '',
    dealerCode: '',
    claimPrefix: '',
    claimDate: '',
    claimNo: '',
    supplier: '',
    serviceType: 'Free Service',
    createdBy: '',
    createdDate: '',
    updatedBy: null,
    updatedDate: null,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private freeServiceClaimService: FreeServiceClaimService,
    private locationMasterService: LocationMasterService,
    private storageService: StorageService,
    private prefixMasterService: PrefixService,
    private menuAccess: MenuAccessService,
    private ledgerMasterService: LedgerMasterService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.user = this.storageService.getUser();
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.loadWorkShopLocations();
    this.getSupplierList();

    this.route.params.subscribe(params => {
      const encClaim = params['id'];
      if (encClaim) {
        const decoded = atob(encClaim);
        this.claimId = Number(decoded.split('|')[1]);
      }

      if (this.claimId && this.claimId !== 0) {
        this.isEdit = true;
        this.getDetailsByclaimId();
      } else {
        this.isEdit = false;
        this.claimFormData.claimDate = new Date().toISOString().split('T')[0];

        this.getPendingApprovedJobCard(this.dealerCode);
      }
    });
  }

  getDetailsByclaimId() {
    this.loader.show();
    this.freeServiceClaimService.getClaimById(this.claimId).subscribe({
      next: (res: any) => {
        this.claimFormData = {
          locationCode: res.LocationCode,
          dealerCode: res.DealerCode,
          claimPrefix: res.ClaimPrefix,
          claimDate: (res.ClaimDate || '').toString().substring(0, 10),
          claimNo: res.ClaimNo,
          supplier: 'LED1',
          serviceType: 'Free Service',
          id: res.Id,
          createdBy: res.CreatedBy,
          createdDate: res.CreatedDate,
          updatedBy: res.updatedBy,
          updatedDate: res.updatedDate
        };
        this.pendingClaimjobCardList = res.ItemDetails;
        this.applyStatusFilter();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  loadWorkShopLocations() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.locationList = res;
        this.loader.hide();

        if (!this.isEdit && res && res.length === 1) {
          this.claimFormData.locationCode = res[0].loccode;
          this.claimFormData.dealerCode = res[0].dealerCode;
          this.generateNewClaimNo(res[0].dealerCode);
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  getSupplierList() {
    this.loader.show();
    this.ledgerMasterService.getCompanyLedgers().subscribe({
      next: (res: any) => {
        this.supplierList = res;
        if (res && res.length > 0) {
          this.claimFormData.supplier = this.supplierList[0].ledgerCode;
        }
        this.loader.hide();
      },
      error: (res) => {
        console.error(res);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onChangeLocation(event: Event) {
    const locCode = (event.target as HTMLSelectElement).value;

    if (!locCode) {
      this.claimFormData.dealerCode = '';
      this.claimFormData.claimPrefix = '';
      this.claimFormData.claimNo = '';
      this.getPendingApprovedJobCard(this.dealerCode);
      return;
    }

    const selectedLoc = this.locationList.find(x => x.loccode === locCode);
    const _dealerCode = selectedLoc ? selectedLoc.dealerCode : this.dealerCode;

    this.claimFormData.dealerCode = _dealerCode;
    this.generateNewClaimNo(_dealerCode);
    this.getPendingApprovedJobCard(_dealerCode);
  }

  generateNewClaimNo(dealerCode: string) {
    this.loader.show();
    this.prefixMasterService.getPrefixByDealerByModule(dealerCode, 'free_service_claim').subscribe({
      next: (res: any) => {
        this.claimFormData.claimPrefix = res;
        this.claimFormData.claimNo = res.split('/').pop();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  getPendingApprovedJobCard(dealerCode: string | null) {
    this.loader.show();
    this.freeServiceClaimService.getPendingApprovalJobCard(dealerCode).subscribe({
      next: (res: any) => {
        this.pendingClaimjobCardList = res || [];
        this.claimSubmitList = [];
        this.applyStatusFilter();      
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onFilterRecords() {
    if (this.isEdit) {
      this.applyStatusFilter();
      return;
    }

    const selectedLoc = this.locationList.find(x => x.loccode === this.claimFormData.locationCode);
    const _dealerCode = selectedLoc ? selectedLoc.dealerCode : this.dealerCode;
    this.getPendingApprovedJobCard(_dealerCode);
  }

  applyStatusFilter() {
    if (!this.filterStatus) {
      this.filteredJobList = [...this.pendingClaimjobCardList];
      return;
    }

    this.filteredJobList = this.pendingClaimjobCardList.filter(item => {
      const statusStr = item.isClaimed === false ? 'Not Submitted'
        : item.isApproved === true ? 'Approved'
        : item.isApproved === false ? 'Rejected'
        : 'Pending';
      return statusStr === this.filterStatus;
    });
  }

  onClaimCheckBoxChange(event: Event, claim: any) {
    if (claim.isClaimed) return;

    const isChecked = (event.target as HTMLInputElement).checked;
    const jobCardIndex = this.claimSubmitList.findIndex(
      x => x.jobCardId === claim.jobCardId
    );

    if (!isChecked) {
      if (jobCardIndex > -1) {
        this.claimSubmitList.splice(jobCardIndex, 1);
      }
    } else {
      if (jobCardIndex === -1) {
        this.claimSubmitList.push(claim);
      }
    }
  }

  onSubmitClaim() {
    const userId = this.storageService.getUserId();

    
    if (this.claimFormData.id > 0) {
      const claimDetails = {
        ...this.claimFormData,
        itemDetails: this.pendingClaimjobCardList.map(item => ({
          ...item,
          updatedBy: userId,
          updatedDate: new Date()
        }))
      };

      this.loader.show();
      this.freeServiceClaimService.update(claimDetails).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show("Records updated successfully.", { classname: 'bg-success text-white', delay: 5000 });
          this.goBack();
        },
        error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
      return;
    }

    const selected = this.claimSubmitList.filter(x => !x.isClaimed);
    if (selected.length === 0) {
      this.toaster.show("Please select at least one claim.", { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const groups: { dealer: string; loc: string; rows: any[] }[] = [];
    for (const row of selected) {
      const dealer = row.dealerCode || this.claimFormData.dealerCode || this.dealerCode || '';
      if (!dealer) {
        this.toaster.show("Dealer code sapadla nahi.", { classname: 'bg-warning text-white', delay: 5000 });
        return;
      }
      const loc = row.locationCode || this.getDefaultLocation(dealer);

      let g = groups.find(x => x.dealer === dealer && x.loc === loc);
      if (!g) {
        g = { dealer, loc, rows: [] };
        groups.push(g);
      }
      g.rows.push(row);
    }

    this.loader.show();
    from(groups).pipe(
      concatMap(g =>
        this.prefixMasterService.getPrefixByDealerByModule(g.dealer, 'free_service_claim').pipe(
          concatMap((prefix: any) =>
            this.freeServiceClaimService.insert(this.buildClaim(g, prefix, userId))
          )
        )
      ),
      toArray()
    ).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show("Records saved successfully.", { classname: 'bg-success text-white', delay: 5000 });
        this.goBack();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  private buildClaim(g: { dealer: string; loc: string; rows: any[] }, prefix: string, userId: any) {
    return {
      ...this.claimFormData,
      id: 0,
      dealerCode: g.dealer,
      locationCode: g.loc,
      claimPrefix: prefix,                     
      claimNo: prefix.split('/').pop(),
      claimDate: this.claimFormData.claimDate || new Date().toISOString().split('T')[0],
      createdBy: userId,
      createdDate: new Date(),
      itemDetails: g.rows.map(item => ({
        ...item,
        isApproved: null,
        createdBy: userId,
        createdDate: new Date()
      }))
    };
  }

  private getDefaultLocation(dealer: string): string {
    return this.locationList.find(l => l.dealerCode === dealer)?.loccode
      || this.claimFormData.locationCode
      || '';
  }

  goBack() {
    this.router.navigate(['/free-service-claim']);
  }

  downloadExcel() { }
}