import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { FreeServiceClaimService } from '../../core/services/free-service-claim';
import { LocationMasterService } from '../../core/services/location-master-service';
import { StorageService } from '../../core/services/storage';
import { SharedModule } from '../../shared/shared.module';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { LedgerMasterService } from '../../core/services/ledger-master';

@Component({
  selector: 'app-bg-free-service',
  imports: [CommonModule, NgbTooltip, FormsModule, SharedModule],
  templateUrl: './bg-free-service.html',
})
export class BgFreeService implements OnInit {
  readonly SUBMENU_ID = 145;
  canEdit = false;
  isSuperAdmin: boolean;
  dealerCode: string | null = null;

  claimId = 0;
  locationList: any[] = [];
  supplierList: any[] = [];
  pendingClaims: any[] = [];
  selectedLocation = '';

  claimFormData: any = {
    id: 0,
    locationCode: '',
    dealerCode: '',
    claimPrefix: '',
    claimNo: '',
    claimDate: '',
    supplier: '',
    serviceType: 'Free Service'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private freeServiceClaimService: FreeServiceClaimService,
    private locationMasterService: LocationMasterService,
    private storageService: StorageService,
    private menuAccess: MenuAccessService,
    private ledgerMasterService: LedgerMasterService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.loadWorkShopLocations();
    this.getSupplierList();
    this.route.queryParams.subscribe(q => {
      this.claimId = Number(q['claimId'] || 0);
      this.loadRows();
    });
  }

  loadWorkShopLocations() {
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => { this.locationList = res; },
      error: (err) => console.error(err)
    });
  }

    getLocationName(code: string): string {
    return this.locationList.find(x => x.loccode === code)?.locname || code;
  }
  
  getSupplierList() {
    this.ledgerMasterService.getCompanyLedgers().subscribe({
      next: (res: any) => {
        this.supplierList = res;
        if (res && res.length > 0) {
          this.claimFormData.supplier = res[0].ledgerCode;
        }
      },
      error: (err) => {
        console.error(err);
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onSearch() {
    this.loadRows();
  }

  loadRows() {
    if (this.claimId > 0) {
      this.loadClaim();
    } else {
      this.loadPendingClaims();
    }
  }

  loadClaim() {
    this.loader.show();
    this.freeServiceClaimService.getClaimById(this.claimId).subscribe({
      next: (res: any) => {
        this.selectedLocation = res.LocationCode;
        this.claimFormData = {
          ...this.claimFormData,
          id: res.Id,
          locationCode: res.LocationCode,
          dealerCode: res.DealerCode,
          claimPrefix: res.ClaimPrefix,
          claimNo: res.ClaimNo,
          claimDate: (res.ClaimDate || '').toString().substring(0, 10)
        };

        this.pendingClaims = (res?.ItemDetails || []).map((x: any) => ({
          ...x,
          claimPrefix: res.ClaimPrefix,
          claimNo: res.ClaimNo,
          claimDate: res.ClaimDate,
          locationCode: res.LocationCode,
          decision: null
        }));
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  
  // loadPendingClaims() {
  //   const loc = this.locationList.find(x => x.loccode === this.selectedLocation);
  //   const dealer = this.selectedLocation ? loc?.dealerCode : this.dealerCode;

  //   this.loader.show();
  //   this.freeServiceClaimService.getPendingApprovalClaims(dealer).subscribe({
  //     next: (res: any) => {
  //       this.pendingClaims = (res || []).map((x: any) => ({ ...x, decision: null }));
  //       this.loader.hide();
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.loader.hide();
  //       this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
  //     }
  //   });
  // }

  loadPendingClaims() {
    const loc = this.locationList.find(x => x.loccode === this.selectedLocation);
    const dealer = this.selectedLocation ? loc?.dealerCode : this.dealerCode;
    const locationCode = this.selectedLocation || ''; 

    this.loader.show();
   
    this.freeServiceClaimService.getPendingApprovalClaims(dealer).subscribe({
      next: (res: any) => {
        let data = res || [];
       
        if (this.selectedLocation) {
          data = data.filter((x: any) => x.locationCode === this.selectedLocation);
        }
        this.pendingClaims = data.map((x: any) => ({ ...x, decision: null }));
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

 
  onDecision(row: any, decision: 'approve' | 'reject') {
   
    const userRole = this.storageService.getRole() || '';
    if (userRole.toLowerCase() !== 'superadmin' && userRole.toLowerCase() !== 'admin') {
      this.toaster.show('Fakt admin ch approve karu shakto.', { classname: 'bg-danger text-white', delay: 5000 });
      return;
    }
    row.decision = row.decision === decision ? null : decision;
  }

  onSubmit() {
    const selected = this.pendingClaims.filter(x => x.decision);

    if (selected.length === 0) {
      this.toaster.show('Please approve or reject at least one row.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    if (selected.some(x => x.decision === 'reject' && (!x.rejectReason || x.rejectReason.trim() === ''))) {
      this.toaster.show('Reject reason cannot be left blank.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }

    const payload = selected.map(x => ({
      id: x.id,
      isApproved: x.decision === 'approve',
      rejectReason: x.decision === 'reject' ? x.rejectReason.trim() : null
    }));

    this.loader.show();
    this.freeServiceClaimService.approveRejectClaimDetails(payload).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Records updated sucessfully.', { classname: 'bg-success text-white', delay: 5000 });
        if (this.claimId > 0) {
          this.router.navigate(['/free-service-claim']);   
        } else {
          this.loadPendingClaims();
        }
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onBack() {
    this.router.navigate(['/free-service-claim']);
  }
}