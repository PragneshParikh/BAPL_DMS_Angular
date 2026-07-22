import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CounterBillService } from '../../core/services/counter-bill-service';
import { StorageService } from '../../core/services/storage';
import { DealerService } from '../../core/services/dealer-service';
import { LoaderService } from '../../core/services/loader';

@Component({
  selector: 'app-counter-bill',
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './counter-bill.html',
  styleUrl: './counter-bill.scss',
})


export class CounterBill implements OnInit {

  filter = {
    fromDate: null,
    toDate: null
  };

  searchTerm: string = '';

  page: number = 1;
  pageSize: number = 10;

  counterBills: any[] = [];
  filteredCounterBills: any[] = [];
  paginatedCounterBills: any[] = [];
  isSuperAdmin: boolean;
  dealerCode: string;
  dealers: any[] = [];
  filteredDealers: any[] = [];
  dealerFilter: string = '';
  selectedDealer: string = '';
  dealerSelected:string='';
  showDropdown: boolean=false;

  constructor(private router: Router, private counterBillService: CounterBillService,private loader: LoaderService,
    private storageService: StorageService, private dealerService: DealerService,private eRef: ElementRef) { }
@ViewChild('dealerContainer')
dealerContainer!: ElementRef;
    @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {

  if (
    this.dealerContainer &&
    !this.dealerContainer.nativeElement.contains(event.target)
  ) {
    this.showDropdown = false;
  }
}
  ngOnInit(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
    else {
      this.getDealerList();
    }
    this.loadData();
  }



  getDealerList() {
    this.dealerSelected ='All Dealers';
    this.dealerService.getDealerDropdown(null).subscribe((res) => {
      this.dealers = res.data;
      this.filteredDealers = [...this.dealers];
    });
  }

  filterDealers(event: any) {
    const search = event.target.value.toLowerCase();
 if (!search) {
    this.selectedDealer = '';
    this.loadData(); 
  }
    this.filteredDealers = this.dealers.filter(
      d =>
        d.dealerCode.toLowerCase().includes(search) ||
        d.dealerName.toLowerCase().includes(search)
    );

    this.showDropdown = true;
  }

  selectDealer(dealer: any) {
console.log(dealer);

  if (!dealer) {
    
    this.selectedDealer = '';
    this.dealerSelected ='All Dealer'
  } else {
    this.selectedDealer = dealer.dealerCode;
    this.dealerSelected =this.selectedDealer + '-'+ dealer.dealerName ;
  }

  this.showDropdown = false;
  this.loadData();
}
  onDealerSelect(dealer: any) {
    this.dealerFilter = dealer.dealerCode;
    console.log('Selected Dealer Code:', this.dealerFilter);
  }

  onSearch(): void {
    this.loadData();
    this.page = 1;
    this.updatePagination();
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredCounterBills = this.counterBills.filter(item =>
      item.header?.billNo?.toLowerCase().includes(term) ||
      item.header?.partyName?.toLowerCase().includes(term) ||
      (item.header?.mobileNo ?? '').toString().includes(term) ||
      item.header?.locCode?.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }
  onSort(column: string): void {
    console.log('Sort:', column);
  }

  onPageChange(pageNo: number): void {
    this.page = pageNo;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedCounterBills =
      this.filteredCounterBills.slice(startIndex, endIndex);
  }

  addCounterBill(): void {
    this.router.navigate(['/add-counter-bill']);
  }

  exportExcel(): void {
    console.log('Export Excel');
  }

  // editCounterBill(item: any): void {
  //   this.router.navigate([
  //     '/counter-bill/edit',
  //     item.header.id
  //   ]);
  // }

  editCounterBill(item: any): void {
  this.router.navigate(
    ['/counter-bill/edit'],
    {
      state: {
        counterBillId: item.header.id
      }
    }
  );
}
  
  loadData(): void {
    this.loader.show();
    const fromDate = this.filter.fromDate ? new Date(this.filter.fromDate) : undefined;
    const toDate = this.filter.toDate ? new Date(this.filter.toDate) : undefined;

    this.counterBillService.getAllCounterBills(this.dealerCode, fromDate, toDate, this.searchTerm,this.selectedDealer)
      .subscribe({
        next: (res) => {
          this.loader.hide();

          this.counterBills = res;
          this.filteredCounterBills = [...res];
          this.updatePagination();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
        }
      });
  }
  downloadExcel(): void {
    this.loader.show();
    let dealerCode = '';
    const isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    this.counterBillService.downloadCounterBillExcel(dealerCode, this.filter.fromDate, this.filter.toDate
    )
      .subscribe({
        next: (response: Blob) => {
this.loader.hide();
          const blob = new Blob(
            [response],
            {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          );

          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = 'CounterBillReport.xlsx';

          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
        }
      });
  }
}

