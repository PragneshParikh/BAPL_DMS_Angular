import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DealerService } from '../../core/services/dealer-service';
import { FormsModule } from '@angular/forms';
import { DealerMasterViewModel } from '../../ViewModels/Dealer/DealerMasterViewModel';
import { DealerApiResponse } from '../../ViewModels/Dealer/DealerApiResponse';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-dealer-master',
  standalone: true,
  imports: [CommonModule, NgbModule, FormsModule],
  templateUrl: './dealer-master.html',
  styleUrl: './dealer-master.scss',
})

export class DealerMaster implements OnInit {

  @ViewChild('dealerModal') dealerModal!: TemplateRef<unknown>;

  dealerList: DealerMasterViewModel[] = [];
  selectedDealer!: DealerMasterViewModel;

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchTerm = '';
  modalRef!: NgbModalRef;

  // private searchSubject = new Subject<string>();

  isSuperAdmin: boolean = false;
  dealerCode: string = '';

  constructor(
    private dealerService: DealerService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.dealerCode = this.storageService.getDealerCode() || '';
  }

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.loadDealers();
  }

  /* ================= LOAD ================= */

  loadDealers(): void {

    this.loader.show();

    const dealer = this.isSuperAdmin ? null : this.dealerCode;

    this.dealerService.getDealerByPaged(this.searchTerm, this.page, this.pageSize, dealer).subscribe({
      next: (res) => {

        const dealerData = res.data;
        this.collectionSize = res.totalRecords;

        this.dealerList = dealerData.map((dealer, index) => ({
          ...dealer,
          slNo: index + 1
        }));

        this.loader.hide();
      },

      error: (err) => {
        console.error(err);

        this.toaster.show('Failed to load dealers!', {
          classname: 'bg-danger text-white',
          delay: 5000
        });

        this.loader.hide();
      }
    });
  }

  /* ================= PAGINATION ================= */

  onPageChange(page: number) {
    this.page = page;
    this.loadDealers();
  }

  /* ================= SORT ================= */

  // ================= SORTING =================

  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.dealerList.sort((a, b) => {

      let valueA = a[column];
      let valueB = b[column];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;

    });

    this.page = 1;
    this.loadDealers();
  }

  /* ================= MODAL ================= */
  openDealerModal(dealer: DealerMasterViewModel): void {

    this.selectedDealer = { ...dealer };

    this.modalRef = this.modalService.open(this.dealerModal, {
      windowClass: 'dealer-modal',
      size: 'xl',
      scrollable: true
    });

  }


  /* ================= SELECT ================= */

  // toggleSelectAll(event: Event): void {

  //   const checked = (event.target as HTMLInputElement).checked;

  //   this.paginatedDealerList.forEach(dealer => {
  //     dealer.selected = checked;
  //   });

  // }

  // printSelected(): void {
  //   const selectedDealers = this.paginatedDealerList.filter(d => d.selected);
  // }

  /* ================= EXCEL ================= */

  downloadDealerExcel(): void {

    this.loader.show();
    this.dealerService.downloadDealerExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'DealerList.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);
      this.loader.hide();
      this.toaster.show('Dealer Excel downloaded successfully', { classname: 'bg-success text-light', delay: 3000 });
    });

  }

  onSearchChange(): void {

    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.loadDealers();
      return;
    }

  }

  updateTradeCertificate() {
    this.loader.show();

    this.dealerService.updateTradeCertificate(
      this.selectedDealer.id,
      this.selectedDealer.tradCert
    ).subscribe({
      next: (res: any) => {
        this.loader.hide();

        this.modalRef.close();

        this.loadDealers();

        this.toaster.show(
          'Trade Certificate updated successfully',
          { classname: 'bg-success text-light', delay: 3000 }
        );
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

        this.toaster.show(
          'Error updating Trade Certificate',
          { classname: 'bg-danger text-light', delay: 3000 }
        );
      }
    });
  }

}