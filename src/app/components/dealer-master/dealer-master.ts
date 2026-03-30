import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DealerService } from '../../core/services/dealer-service';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { DealerMasterViewModel } from '../../ViewModels/Dealer/DealerMasterViewModel';
import { DealerApiResponse } from '../../ViewModels/Dealer/DealerApiResponse';
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
  originalDealerList: DealerMasterViewModel[] = [];
  paginatedDealerList: DealerMasterViewModel[] = [];

  selectedDealer!: DealerMasterViewModel;

  page = 1;
  pageSize = 10;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchTerm = '';

  private searchSubject = new Subject<string>();

  constructor(
    private dealerService: DealerService,
    private modalService: NgbModal
  ) { }

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.loadDealers();
    this.setupSearch();
  }

  /* ================= LOAD ================= */

  loadDealers(): void {

    this.dealerService.getDealers().subscribe({

      next: (res: DealerApiResponse) => {

        const data = res.data || [];

        this.dealerList = data.map((dealer, index) => ({
          ...dealer,
          slNo: index + 1
        }));

        this.originalDealerList = [...this.dealerList];

        this.refreshPage();
      },

      error: (err) => console.error(err)

    });

  }

  /* ================= PAGINATION ================= */

 refreshPage(): void {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedDealerList = this.dealerList.slice(start, end);

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

    this.refreshPage();
  }

  /* ================= MODAL ================= */

  openDealerModal(dealer: DealerMasterViewModel): void {

    this.selectedDealer = dealer;

    this.modalService.open(this.dealerModal, {
      windowClass: 'dealer-modal',
      size: 'xl',
      scrollable: true
    });

  }

  /* ================= SELECT ================= */

  toggleSelectAll(event: Event): void {

    const checked = (event.target as HTMLInputElement).checked;

    this.paginatedDealerList.forEach(dealer => {
      dealer.selected = checked;
    });

  }

  printSelected(): void {

    const selectedDealers = this.paginatedDealerList.filter(d => d.selected);

    console.log('Selected Dealers:', selectedDealers);

  }

  /* ================= EXCEL ================= */

  downloadDealerExcel(): void {

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

    });

  }

  /* ================= SEARCH ================= */

  setupSearch(): void {

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search => this.dealerService.getDealers(search))
    ).subscribe({

      next: (res: DealerApiResponse) => {

        const data = res.data || [];

        this.dealerList = data.map((dealer, index) => ({
          ...dealer,
          slNo: index + 1
        }));

        this.page = 1;
        this.refreshPage();
      },

      error: err => console.error(err)

    });

  }

  onSearchChange(): void {

    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.loadDealers();
      return;
    }

    this.searchSubject.next(this.searchTerm);

  }

}