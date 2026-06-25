import { Component, OnInit } from '@angular/core';
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
export class MaterialTransfer implements OnInit {
  public searchTerm: string = '';
  dataSource: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  dealerCode: string = '';
  isSuperAdmin: boolean = false;

  lstLocations: any[] = [];

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toast: ToastService,
    private materialTransfterService: MaterialTransferService,
    private storageService: StorageService,
    private locationMasterService: LocationMasterService
  ) { }

  ngOnInit(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.loadWorkShopLocations();
  }

  onSearchChange() {
    this.getMaterialTransfer("");
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
    // Logic to sort data based on sortColumn and sortDirection
  }

  getMaterialTransfer(dealerCode: string) {
    this.loader.show();
    this.materialTransfterService.getByDealer(this.searchTerm, dealerCode, this.page, this.pageSize).subscribe({
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
        console.log(this.lstLocations);
      },
      error: (err) => {
        this.loader.hide();
        console.log(err);
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onChangeLocation(event: any) {
    const locCode = (event.target as HTMLSelectElement).value;
    const _dealerCode = this.lstLocations.filter(x => x.loccode === locCode)[0].dealerCode;

    this.getMaterialTransfer(_dealerCode);
  }
}
