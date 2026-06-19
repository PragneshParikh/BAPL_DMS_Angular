import { Component, OnInit } from '@angular/core';
import { Route, Router, RouterOutlet } from "@angular/router";
import { SharedModule } from '../../../shared/shared.module';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { DealerService } from '../../../core/services/dealer-service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-customer-ledger-list',
  imports: [RouterOutlet, SharedModule, NgbPaginationModule, CommonModule, FormsModule, NgbTooltipModule, NgSelectModule],
  templateUrl: './customer-ledger-list.html',
  styleUrl: './customer-ledger-list.scss',
})
export class CustomerLedgerList implements OnInit {
  public searchTerm: string = '';
  dataSource: any[] = [];
  selectedDealerCode = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  dealers: any;
  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  isSuperAdmin: boolean;

  dealerSearch: string = '';
  showDropdown = false;

  filteredDealers: any[] = [];

  dealerCode: string = '';

  constructor(
    private ledgerMasterService: LedgerMasterService,
    private route: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private dealerService: DealerService,
    private storageService: StorageService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.filteredDealers = this.dealers;
    // this.getCustomerLedgerDetails();
    this.getDealerCodes();
  }
  getDealerCodes() {
    this.dealerService.getDealerDropdown(null).subscribe(
      (res) => {
        this.dealers = res.data;
      }
    );
  }

  getCustomerLedgerDetails() {
    this.loader.show();
    this.ledgerMasterService.getLedgerByPaged(this.searchTerm, this.page - 1, this.pageSize, this.dealerCode).subscribe({
      next: (res) => {
        console.log(res);

        this.collectionSize = 0;
        if (res) {
          this.dataSource = res.data;
          this.collectionSize = res.totalRecords;
        }
        this.loader.hide();
      }, error: (err) => {
        console.log(err);
        this.loader.hide();
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    })
  }

  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.dataSource.sort((a: any, b: any) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  }

  trackByCustomer(index: number, item: any): any {
    return item.id || index;
  }

  onPageChange(page: number) {
    this.page = page;
    this.getCustomerLedgerDetails();
  }

  onCustomerClick(row: any) {
    console.log('onclick : ', row);
    if (row) {
      this.route.navigate(['/customer-ledger', row.id]);
    }
  }

  newLedger() {
    this.route.navigate(['/customer-ledger', 0])
  }

  onSearchChange() {
    this.getCustomerLedgerDetails();
  }


  downloadExcel(): void {
    this.loader.show();
    const isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    const dealerCode = isSuperAdmin ? null : this.storageService.getDealerCode();

    this.ledgerMasterService.downloadExcel(dealerCode).subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'LedgerList.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);
        this.loader.hide();

        this.toaster.show('Excel downloaded successfully', {
          classname: 'bg-success text-light',
          delay: 3000
        });
      },
      error: () => {
        this.loader.hide();
      }
    });
  }
  onDealerChange() {
    this.ledgerMasterService.getLedgerByPaged(this.searchTerm, this.page - 1, this.pageSize, this.dealerCode, this.selectedDealerCode
    ).subscribe({
      next: (res) => {
        console.log(res);

        this.collectionSize = 0;
        if (res) {
          this.dataSource = res.data;
          this.collectionSize = res.totalRecords;
        }
        this.loader.hide();
      }, error: (err) => {
        console.log(err);
        this.loader.hide();
        this.toaster.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    })
  }

  filterDealers() {
    const search = this.dealerSearch.toLowerCase();

    this.filteredDealers = this.dealers.filter(dealer =>
      dealer.dealerCode.toLowerCase().includes(search) ||
      dealer.dealerName.toLowerCase().includes(search)
    );

    this.showDropdown = true;
  }

  selectDealer(dealer: any) {
    this.selectedDealerCode = dealer.dealerCode;
    this.dealerSearch = `${dealer.dealerCode} - ${dealer.dealerName}`;
    this.showDropdown = false;

    this.onDealerChange();
  }
}
