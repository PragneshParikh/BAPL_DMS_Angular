// src\app\components\free-service-claim\free-service-claim.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
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
  claimId: Number = 0;
  isEdit: boolean = false;
  dealerCode: string | null = null;

  pendingClaimjobCardList: any[] = [];
  locationList: any[] = [];
  supplierList: any[] = [];

  claimSubmitList: any[] = [];

  isSuperAdmin: boolean;
  user: any;

  claimFormData = {
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
  }

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
      const decoded = atob(encClaim);

      this.claimId = Number(decoded.split('|')[1]);

      if (this.claimId && this.claimId !== 0) {
        this.isEdit = true;
        this.getDetailsByclaimId();
      } else {
        this.isEdit = false;
        const to = new Date();
        this.claimFormData.claimDate = to.toISOString().split('T')[0];
      }

    });
  }

  getDetailsByclaimId() {
    this.loader.show();
    this.freeServiceClaimService.getClaimById(this.claimId).subscribe({
      next: (res) => {
        this.claimFormData = {
          locationCode: res.LocationCode,
          dealerCode: res.DealerCode,
          claimPrefix: res.ClaimPrefix,
          claimDate: res.ClaimDate,
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
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 })
      }
    });
  }

  loadWorkShopLocations() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.locationList = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
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
    const _dealerCode = this.locationList.filter(x => x.loccode === locCode)[0].dealerCode;
    this.claimFormData.dealerCode = _dealerCode;
    this.generateNewClaimNo(_dealerCode);
    this.getPendingApprovedJobCard(_dealerCode);
  }

  generateNewClaimNo(dealerCode: string) {
    this.loader.show();
    this.prefixMasterService.getPrefixByDealerByModule(dealerCode, 'free_service_claim').subscribe({
      next: (res) => {
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

  getPendingApprovedJobCard(dealerCode: string) {
    this.loader.show();
    this.freeServiceClaimService.getPendingApprovalJobCard(dealerCode).subscribe({
      next: (res) => {
        this.pendingClaimjobCardList = res;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onClaimCheckBoxChange(event: Event, claim: any) {
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
    if (this.claimSubmitList.length === 0) {
      this.toaster.show("Please select at lease one claim.", { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const rejectedWithoutReason = this.claimSubmitList.some(
      item => item.isApproved === false &&
        (!item.rejectReason || item.rejectReason.trim() === '')
    );

    if (rejectedWithoutReason) {
      this.toaster.show("Reject reason cannot be left blank.", { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const userId = this.storageService.getUserId();
    if (this.claimFormData.id > 0) {
      const claimDetails = {
        ...this.claimFormData,
        itemDetails: this.claimSubmitList.map(item => ({
          ...item,
          updatedBy: userId,
          updatedDate: new Date()
        }))
      };

      this.loader.show();
      this.freeServiceClaimService.update(claimDetails).subscribe({
        next: (res) => {
          this.loader.hide();
          this.toaster.show("Records updated sucessfully.", { classname: 'bg-success text-white', delay: 5000 });
          this.goBack();
        },
        error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    } else {
      const claimDetails = {
        createdBy: userId,
        createdDate: new Date(),
        ...this.claimFormData,
        itemDetails: this.claimSubmitList.map(item => ({
          ...item,
          isApproved: null,
          createdBy: userId,
          createdDate: new Date()
        }))
      };

      this.loader.show();
      this.freeServiceClaimService.insert(claimDetails).subscribe({
        next: (res) => {
          this.loader.hide();
          this.toaster.show("Records save sucessfully.", { classname: 'bg-success text-white', delay: 5000 });
          this.goBack();
        },
        error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    }

  }

  goBack() {
    this.router.navigate(['/free-service-claim']);
  }

  onFilterRecords() {
    this.claimFilterForm.control.markAllAsTouched();

    if (this.claimFilterForm.invalid) {
      this.toaster.show("Please fill all required fields.", { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }
  }

  downloadExcel() { }

  onApproveRejectClick(row: any, isApproved: boolean) {

    row.isApproved = isApproved;
    row.approvedRejectDate = new Date();
    row.approvedRejectBy = this.user.userId;

    const jobCardIndex = this.claimSubmitList.findIndex(
      x => x.id === row.id
    );

    this.claimSubmitList.push(row);

  }
}
