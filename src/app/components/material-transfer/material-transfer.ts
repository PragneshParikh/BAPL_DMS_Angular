import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { MaterialTransferService } from '../../core/services/material-transfer';
import { error } from 'console';
import { StorageService } from '../../core/services/storage';

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

  constructor(
    private router: Router,
    private loader: LoaderService,
    private toast: ToastService,
    private materialTransfterService: MaterialTransferService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.dealerCode = this.storageService.getDealerCode();
    this.getMaterialTransfer();
  }

  onSearchChange() {
    // Logic to handle search term change
  }

  addMaterialTransfer() {
    this.router.navigate(['/material-transfer', 0]);
  }

  onMaterialClick(row: any) {
    this.router.navigate(['/material-transfer', row.id]);
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

  getMaterialTransfer() {
    this.loader.show();
    this.materialTransfterService.getByDealer(this.dealerCode, this.page, this.pageSize).subscribe({
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
}
