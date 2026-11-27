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
    //this.freeServiceClaimService.getByDealerCode(_dealerCode, this.pageSize, this.page).subscribe({
    this.freeServiceClaimService.getByDealerCode(
  _dealerCode, this.pageSize, this.page,
  this.filterFormData.dateFrom, this.filterFormData.dateTo
  ).subscribe({
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
  if (row?.pendingCount === 0) return;     
  this.router.navigate(['/bg-free-service'], { queryParams: { claimId: row?.id } });
}
  generateInvoice(claim: any) {
  this.loader.show();
  this.freeServiceClaimService.generateInvoice(claim.id).subscribe({
    next: () => {
      this.loader.hide();
      this.toaster.show('Invoice generate zala.', { classname: 'bg-success text-white', delay: 5000 });
      this.getSubmittedClaimByDealer();
    },
    error: (err) => {
      this.loader.hide();
      this.toaster.show(err?.error || 'Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
    }
  });
}

private openPrint(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (!w) { this.toaster.show('Popup block aahe.', { classname: 'bg-danger text-white', delay: 5000 }); return; }
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial;padding:16px} table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #444;padding:4px;font-size:12px;text-align:left}</style></head>
    <body>${bodyHtml}</body></html>`);
  w.document.close(); w.focus(); w.print();
}

printClaim(claim: any) {
  this.freeServiceClaimService.getClaimById(claim.id).subscribe((res: any) => {
    const approved = (res?.ItemDetails || []).filter((x: any) => (x.isApproved ?? x.IsApproved) === true);
    const rows = (res?.ItemDetails || []).filter((x: any) => x.isApproved !== false).map((x: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${x.jobNo ?? ''}</td><td>${x.registrationNo ?? ''} / ${x.chassisNo ?? ''}</td>
       <td>${x.modelName ?? ''}</td><td>${x.couponNo ?? ''}</td><td>${x.partyName ?? ''}</td>
       <td>${x.saleDate ?? ''}</td><td>${x.rate ?? 0}</td><td>${x.gstAmount ?? 0}</td></tr>`).join('');
    this.openPrint('Free Service Claim', `<h3>Free Service Claim: ${claim.claimPrefix}</h3>
      <table><tr><th>#</th><th>Job No</th><th>Reg / Chassis</th><th>Model</th><th>Coupon</th>
      <th>Customer</th><th>Sale Date</th><th>Rate</th><th>GST</th></tr>${rows}</table>`);
  });
}

printInvoice(claim: any) {
  this.freeServiceClaimService.getClaimById(claim.id).subscribe((res: any) => {
    const approved = (res?.ItemDetails || []).filter((x: any) => (x.isApproved ?? x.IsApproved) === true);
    const byModel: any = {};
    approved.forEach((x: any) => {
      const k = x.modelName || '-';
      byModel[k] = byModel[k] || { qty: 0, rate: Number(x.rate || 0), gst: 0 };
      byModel[k].qty++;
      byModel[k].gst += Number(x.gstAmount || 0);
    });
    let total = 0;
    const rows = Object.keys(byModel).map(k => {
      const m = byModel[k], amt = m.qty * m.rate + m.gst; total += amt;
      return `<tr><td>${k}</td><td>${m.qty}</td><td>${m.rate}</td><td>${m.gst}</td><td>${amt}</td></tr>`;
    }).join('');
    this.openPrint('Free Service Invoice', `<h3>Invoice: ${claim.invoiceNo}</h3><p>Claim: ${claim.claimPrefix}</p>
      <table><tr><th>Model</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>${rows}
      <tr><th colspan="4">Total</th><th>${total}</th></tr></table>`);
  });
}
}