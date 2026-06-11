import { Component, OnInit } from '@angular/core';
import { Route, Router, RouterOutlet } from "@angular/router";
import { SharedModule } from '../../../shared/shared.module';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-customer-ledger-list',
  imports: [RouterOutlet, SharedModule, NgbPaginationModule, CommonModule, FormsModule, NgbTooltipModule],
  templateUrl: './customer-ledger-list.html',
  styleUrl: './customer-ledger-list.scss',
})
export class CustomerLedgerList implements OnInit {
  public searchTerm: string = '';
  dataSource: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  constructor(
    private ledgerMasterService: LedgerMasterService,
    private route: Router,
    private loader: LoaderService,
    private toaster: ToastService,
  ) { }

  ngOnInit(): void {
    this.getCustomerLedgerDetails();
  }

  getCustomerLedgerDetails() {
    this.loader.show();
    this.ledgerMasterService.getLedgerByPaged(this.searchTerm, this.page - 1, this.pageSize).subscribe({
      next: (res) => {
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

}
