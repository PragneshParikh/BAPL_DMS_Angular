import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DealerService } from '../../services/dealer-service';
import { FormsModule } from '@angular/forms';
import '@angular/localize/init';

@Component({
  selector: 'app-dealer-master',
  standalone: true,
  imports: [CommonModule, NgbModule, FormsModule],
  templateUrl: './dealer-master.html',
  styleUrl: './dealer-master.scss',
})

export class DealerMaster implements OnInit {

  @ViewChild('dealerModal') dealerModal!: TemplateRef<any>;

  dealerList: any[] = [];
  originalDealerList: any[] = [];
  paginatedDealerList: any[] = [];
selectedMaster:any='';
  page = 1;
  pageSize = 10;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchTerm = '';

  selectedDealer: any;

  constructor(
    private dealerService: DealerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {

    this.loadDealers();
  }


  // ================= LOAD DEALERS FROM API =================

  loadDealers() {

    this.dealerService.getDealers().subscribe({

      next: (res: any) => {

        const data = res.data || [];
        this.dealerList = data.map((dealer: any, index: number) => ({
        ...dealer,
        slNo: index + 1
      }));
        this.originalDealerList = [...this.dealerList];

        this.refreshPage();

      },

      error: (err) => {
        console.error(err);
      }

    });

  }


  // ================= PAGINATION =================

  refreshPage() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedDealerList = this.dealerList.slice(start, end);

  }


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




  // ================= MODAL =================

  openDealerModal(dealer: any) {

    this.selectedDealer = dealer;

    this.modalService.open(this.dealerModal, {
      windowClass: 'dealer-modal',
      size: 'xl',
      scrollable: true
    });

  }



uploadFile(){
console.log("Upload clicked for:",this.selectedMaster);
}

onRowSelect(dealer:any){
console.log("Selected Dealer:",dealer);
}

toggleSelectAll(event:any){

const checked=event.target.checked;

this.paginatedDealerList.forEach((dealer:any)=>{
dealer.selected=checked;
});

}

printSelected(){

const selectedDealers=this.paginatedDealerList.filter((d:any)=>d.selected);

console.log("Selected Dealers:",selectedDealers);

}
 
}