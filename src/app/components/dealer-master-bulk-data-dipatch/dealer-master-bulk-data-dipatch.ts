import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbHighlight } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DealerService } from '../../core/services/dealer-service';

@Component({
  selector: 'app-dealer-master-bulk-data-dipatch',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbHighlight],
  templateUrl: './dealer-master-bulk-data-dipatch.html',
  styleUrls: ['./dealer-master-bulk-data-dipatch.scss']
})
export class DealerMasterBulkDataDipatch implements OnInit {

  dealerList: any[] = [];
  originalDealerList: any[] = [];
  paginatedDealerList: any[] = [];
  pageSize = 10;
  currentPage = 1;

  startRecord = 1;
  endRecord = 10;
  searchTerm = '';
  selectedMaster: any = '';

  constructor(
    private dealerService: DealerService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadDealers();
  }

  uploadFile() {
    console.log("Upload clicked");
  }

  onRowSelect(dealer: any) {
    console.log("Selected Dealer:", dealer);
  }

  toggleSelectAll(event: any) {

    const checked = event.target.checked;

    this.paginatedDealerList.forEach((dealer: any) => {
      dealer.selected = checked;
    });

  }

  printSelected() {

    const selectedDealers = this.paginatedDealerList.filter((d: any) => d.selected);

    console.log("Selected Dealers:", selectedDealers);

  }

  loadDealers() {

    // this.dealerService.getDealers().subscribe({

    //   next: (res: any) => {

    //     const data = res.data || [];

    //     this.dealerList = data.map((dealer: any, index: number) => ({
    //       ...dealer,
    //       slNo: index + 1,
    //       selected: false
    //     }));

    //     this.originalDealerList = [...this.dealerList];

    //     this.paginatedDealerList = [...this.dealerList];

    //   },

    //   error: (err) => {
    //     console.error(err);
    //   }

    // });

  }
  updatePagination() {

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedDealerList =
      this.dealerList.slice(start, end);

    this.startRecord = start + 1;
    this.endRecord = Math.min(end, this.dealerList.length);

  }
  nextPage() {

    this.currentPage++;

    this.updatePagination();

  }
  previousPage() {

    this.currentPage--;

    this.updatePagination();

  }
}