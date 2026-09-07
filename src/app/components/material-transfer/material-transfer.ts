// src\app\components\material-transfer\material-transfer.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { MaterialTransferService } from '../../core/services/material-transfer';
import { StorageService } from '../../core/services/storage';
import { LocationMasterService } from '../../core/services/location-master-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-material-transfer',
  imports: [
    SharedModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgbPaginationModule,
    RouterOutlet
  ],
  templateUrl: './material-transfer.html',
  styleUrl: './material-transfer.scss',
})
export class MaterialTransfer implements OnInit, OnDestroy {
  public searchTerm: string = '';
  dataSource: any[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  readonly SUBMENU_ID = 29;
  canCreate = false;
  canDownload = false;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  dealerCode: string = '';
  isSuperAdmin: boolean = false;
  selectedLocation: string = '';
  fromDate: string = '';
  toDate: string = '';

  lstLocations: any[] = [];

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toast: ToastService,
    private materialTransfterService: MaterialTransferService,
    private storageService: StorageService,
    private locationMasterService: LocationMasterService,
    private menuAccess: MenuAccessService,
  ) {
    // this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    // this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const defaultRange = this.getDefaultDateRange();
    this.fromDate = defaultRange.from;
    this.toDate = defaultRange.to;

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.tryLoadMaterialTransfer();
    });

    this.loadWorkShopLocations();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private getDefaultDateRange(): { from: string; to: string } {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      from: this.formatDateForInput(firstDayOfMonth),
      to: this.formatDateForInput(today)
    };
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  addMaterialTransfer() {
    const materialId = 0;
    const value = Date.now() + '|' + materialId;
    const encId = btoa(value);
    this.router.navigate(['/material-transfer', encId]);
  }

  onMaterialClick(row: any) {
    const materialId = row.id || 0;
    const value = Date.now() + '|' + materialId;
    const encMaterialId = btoa(value);
    this.router.navigate(['/material-transfer', encMaterialId]);
  }

  onPageChange(page: number) {
    // Logic to handle page change
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.dataSource.sort((a, b) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  getMaterialTransfer(dealerCode: string) {
    this.loader.show();
    this.materialTransfterService.getByDealer(
      this.searchTerm,
      dealerCode,
      this.page,
      this.pageSize,
      this.fromDate || null,
      this.toDate || null
    ).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.dataSource = res.data;
        this.collectionSize = res.totalRecords;
      },
      error: (err: any) => {
        this.loader.hide()
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-light', delay: 5000 });
      }
    })
  }

  downloadExcel() {
    this.loader.show();
    this.materialTransfterService.downloadExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'MaterialTransferList.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);
      this.loader.hide();
      this.toast.show('File downloaded successfully', { classname: 'bg-success text-light', delay: 5000 });
    });
  }

  loadWorkShopLocations() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.lstLocations = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

onChangeLocation(event: any) {
  const locCode = (event.target as HTMLSelectElement).value;

  if (locCode === 'ALL') {
    this.page = 1;
    this.getMaterialTransfer('');
    return;
  }

  const match = this.lstLocations.find(x => x.loccode === locCode);
  if (!match) {
    return; // "-- Select --" placeholder chosen
  }

  this.page = 1;
  this.getMaterialTransfer(match.dealerCode);
}


  deleteMaterialTransfer(row: any) {
    if (!row?.id) {
      return;
    }

    const isBilled = row.jobCardStatus === 'Closed';

    if (isBilled && !this.isSuperAdmin) {
      this.toast.show('This job card is already billed and cannot be deleted.', { classname: 'bg-warning text-dark', delay: 5000 });
      return;
    }

    const confirmMessage = isBilled
      ? `Job No ${row.jobNo} is already billed. As Super Admin you can still delete its material transfer — stock will be returned to inventory, but billing records are not affected. Continue?`
      : `Delete all materials issued for Job No ${row.jobNo}? Stock will be returned to inventory. This cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.loader.show();
    this.materialTransfterService.deleteByJobId(row.id).subscribe({
    next: (result: any) => {
        this.loader.hide();
        this.toast.show('Material transfer deleted successfully.', { classname: 'bg-success text-light', delay: 5000 });
        console.log('Stock reversed:', result?.reversedItems);
        this.getMaterialTransfer(this.getSelectedDealerCode());
      },
      error: (err: any) => {
        this.loader.hide();
        console.error(err);
        const message = err?.error?.message || 'Something went wrong while deleting.';
        this.toast.show(message, { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

  onDateRangeChange() {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.toast.show('From date cannot be after To date.', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }

    this.page = 1;
    this.tryLoadMaterialTransfer();
  }

  clearDateRange() {
    this.fromDate = '';
    this.toDate = '';
    this.page = 1;
    this.tryLoadMaterialTransfer();
    }

  private getSelectedDealerCode(): string {
    if (this.selectedLocation === 'ALL') {
      return ''; // combined with hasUsableSearchContext(), this only reaches the API for Super Admin
    }

    const loc = this.lstLocations.find(x => x.loccode === this.selectedLocation);
    return loc ? loc.dealerCode : (this.dealerCode || '');
  }

  private hasUsableSearchContext(): boolean {
    if (this.selectedLocation === 'ALL') {
      return this.isSuperAdmin;
    }
    return !!this.getSelectedDealerCode();
  }

  private tryLoadMaterialTransfer(): void {
    if (!this.hasUsableSearchContext()) {
      this.toast.show('Please select a location before searching.', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }

    this.getMaterialTransfer(this.getSelectedDealerCode());
  }
}