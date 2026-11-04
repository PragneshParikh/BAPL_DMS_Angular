import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { FreeServiceClaimService } from '../../../core/services/free-service-claim';
import { Router } from '@angular/router';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-free-service-claim-list',
  imports: [SharedModule, CommonModule, NgbPagination, FormsModule, ReactiveFormsModule, NgbTooltip],
  templateUrl: './free-service-claim-list.html',
  styleUrl: './free-service-claim-list.scss',
})
export class FreeServiceClaimList implements OnInit {

  public searchTerm: string = '';
  dataSource: any[] = [];
  locationList: any[] = [];
  dealerCode: string | null = null;
  readonly SUBMENU_ID = 66;
  canCreate = false;
  canDownload = false;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean;

  filterFormData: any = {
    dateFrom: '',
    dateTo: '',
    location: '',
    claimNo: '',
    status: ''
  };

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private toaster: ToastService,
    private locationMasterService: LocationMasterService,
    private freeServiceClaimService: FreeServiceClaimService,
    private menuAccess: MenuAccessService,
    private router: Router
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.loadWorkShopLocations();
    this.initDefaultDates();
    this.getSubmittedClaimByDealer(); 
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    this.filterFormData.dateTo = to.toISOString().split('T')[0];
    this.filterFormData.dateFrom = from.toISOString().split('T')[0];
  }

  onPageChange(page: any) {
    this.page = page;
    this.getSubmittedClaimByDealer();
  }

  onSearch() {
    this.page = 1;
    this.getSubmittedClaimByDealer();
  }

  getLocationName(code: string): string {
    return this.locationList.find(x => x.loccode === code)?.locname || code;
  }

  getSubmittedClaimByDealer() {
    const selectedLoc = this.locationList.find(x => x.loccode === this.filterFormData.location);
    const _dealerCode = selectedLoc ? selectedLoc.dealerCode : this.dealerCode;

    this.loader.show();
    this.freeServiceClaimService.getByDealerCode(_dealerCode, this.pageSize, this.page).subscribe({
      next: (res: any) => {
        let allData = res.data || [];

        if (this.filterFormData.status) {
          allData = allData.filter((item: any) => item.status === this.filterFormData.status);
        }

        this.dataSource = allData;
        this.collectionSize = res.totalRecords;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  addNewClaim(data: any) {
    const claimNo = data?.claimNo || '0';
    const value = Date.now() + '|' + claimNo;
    const encClaim = btoa(value);
    this.router.navigate(['/free-service-claim', encClaim]);
  }

  downloadExcel() { }

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
    });
  }

  onDoubleClick(row: any) {
    this.router.navigate(['/bg-free-service'], { queryParams: { claimId: row?.id } });
  }
}