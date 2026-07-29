import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { FreeServiceClaim } from '../free-service-claim';
import { FreeServiceClaimService } from '../../../core/services/free-service-claim';
import { error } from 'console';
import { Route, Router } from '@angular/router';

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
  }

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private toaster: ToastService,
    private locationMasterService: LocationMasterService,
    private freeServiceClaimService: FreeServiceClaimService,
    private router: Router
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.loadWorkShopLocations();
    this.initDefaultDates();
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
    this.getSubmittedClaimByDealer();
  }

  getSubmittedClaimByDealer() {
    const _dealerCode = this.locationList.filter(x => x.loccode === this.filterFormData.location)[0].dealerCode;
    this.loader.show();
    this.freeServiceClaimService.getByDealerCode(_dealerCode, this.pageSize, this.page).subscribe({
      next: (res) => {
        this.dataSource = res.data;
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
    })
  }

  onDoubleClick(row: any) {
    const Id = row?.id || '0';
    const value = Date.now() + '|' + Id;
    const encClaimId = btoa(value);
    this.router.navigate(['/free-service-claim', encClaimId]);
  }
}
