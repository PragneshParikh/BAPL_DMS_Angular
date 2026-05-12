import { Component, OnInit } from '@angular/core';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { LoaderService } from '../../core/services/loader';
import { NgbHighlight, NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LocationName, ReceiptEntryModel, ReceiptFilter } from '../../ViewModels/ReceiptEntryModel';
import { FlatpickrModule, FlatpickrDefaults } from 'angularx-flatpickr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from '../../shared/toaster/toast-service';
import { debounceTime, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-receipt-entry',
  templateUrl: './receipt-entry.html',
  styleUrl: './receipt-entry.scss',
  imports: [CommonModule,
    FormsModule,
    NgbHighlight,
    NgbPaginationModule,
    FlatpickrModule,
    RouterOutlet,
    NgbTooltipModule
  ],
  providers: [FlatpickrDefaults, FlatpickrModule],
})
export class ReceiptEntry implements OnInit {

  receiptEntries: ReceiptEntryModel[] = [];
  filteredReceipts: ReceiptEntryModel[] = [];
  paginatedReceipts: ReceiptEntryModel[] = [];

  selectedReceipt: ReceiptEntryModel | null = null;

  searchTerm: string = '';

  page: number = 1;
  pageSize: number = 10;
  filter: ReceiptFilter = {};

  sortColumn: keyof ReceiptEntryModel = 'receiptNo';
  sortDirection: 'asc' | 'desc' = 'asc';
  locations: LocationName[] = [];
  selectedLocation: string = '';


  searchSubject = new Subject<string>();
  isSuperAdmin: boolean;
  constructor(
    private receiptEntryService: ReceiptEntryService,
    private loader: LoaderService,
    private toaster: ToastService,
    private storageService: StorageService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isSuperAdmin=this.storageService.getRole().toLowerCase() === 'superadmin';
    if(!this.isSuperAdmin)
      {
        this.filter.dealerCode = this.storageService.getDealerCode();

    }
     const today = new Date();
     const sevenDaysBefore = new Date(today);
     sevenDaysBefore.setDate(today.getDate() - 7);

   // this.loadReceiptEntries();
  this.filter.fromDate = sevenDaysBefore;
this.filter.toDate = today; 
    this.setupSearch(); 
    this.fetchLocations();
      this.searchSubject.next(''); // initial load

  }
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();

    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadReceiptEntries();
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

    console.log('Selected Location:', this.selectedLocation);
  }

  refreshPage(): void {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedReceipts = this.filteredReceipts.slice(start, end);

  }

    loadReceiptEntries(): void {
      console.log(this.isSuperAdmin);
      
      this.loader.show();
      if(!this.isSuperAdmin)
      {
          this.filter.dealerCode =this.storageService.getDealerCode();
      }
    const cleanFilter = this.cleanFilter(this.filter);

    this.receiptEntryService.getReceiptEntryList(cleanFilter)
      .subscribe({
        next: (data) => {
          this.receiptEntries = data ?? [];
          this.filteredReceipts = [...this.receiptEntries];
          this.updatePagination();
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
           this.toaster.show('Failed to fetch receipt entries!', {
            classname: 'bg-warning text-white',
            delay: 5000
          });
        }
      });
  }

  private cleanFilter(filter: ReceiptFilter): ReceiptFilter {
    const cleaned: any = {};

    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof ReceiptFilter];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }


  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredReceipts = this.receiptEntries.filter(item =>
      item.receiptNo.toLowerCase().includes(term) ||
      (item.partyName?.toLowerCase().includes(term) ?? false) ||
      item.productCode.toLowerCase().includes(term)
    );

    this.page = 1;
    this.updatePagination();
  }

  onSort(column: keyof ReceiptEntryModel): void {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredReceipts.sort((a, b) => {
      const valA = a[column] ?? '';
      const valB = b[column] ?? '';

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  // Pagination
  updatePagination(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedReceipts = this.filteredReceipts.slice(start, end);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePagination();
  }

  //  Modal Open
  openEditModal(content: unknown, item: ReceiptEntryModel): void {
    this.selectedReceipt = { ...item }; // clone safely
    this.modalService.open(content, { size: 'lg' });
  }

  // Save
  saveReceipt(modal: { close: () => void }): void {
    if (!this.selectedReceipt) return;



    modal.close();
  }

  //call add-receipt entry
  navigateToAddReceiptEntry(item?: any) {
  if (item && item.id) {
    // EDIT
    this.router.navigate(['/receipt-entry/edit', item.id]);
  } else {
    // ADD
    this.router.navigate(['/receipt-entry/add']);
  }
}

downloadReceiptExcel(): void {
  this.loader.show();

  this.receiptEntryService.downloadReceiptExcel().subscribe({
    next: (data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'ReceiptList.xlsx';
      link.click();

      window.URL.revokeObjectURL(url);

      //  Success toaster
      this.toaster.show('Excel downloaded successfully!', {
        classname: 'bg-success text-white',
        delay: 3000
      });

      this.loader.hide();
    },

    error: (err) => {
      console.error('Download error:', err);

      // Error toaster
      this.toaster.show('Failed to download Excel!', {
        classname: 'bg-danger text-white',
        delay: 5000
      });

      this.loader.hide();
    }
  });
}

 setupSearch() {

  this.searchSubject.pipe(
    debounceTime(300),
    switchMap(search => {

      this.loader.show();

      let dealerCode = '';

      if (!this.isSuperAdmin) {
        dealerCode = this.storageService.getDealerCode();
      }

      return this.receiptEntryService.getReceiptList(
        search || '',
        this.filter.fromDate,
        this.filter.toDate,
        dealerCode
      );
    })
  ).subscribe({
    next: (data) => {

      this.receiptEntries = data || [];
      this.filteredReceipts = [...this.receiptEntries];

      this.page = 1;
      this.updatePagination();

      this.loader.hide();
    },

    error: (err) => {

      this.loader.hide();
      console.error('Error fetching receipts', err);
    }
  });
}

 
  onSearchChange() {
  const term = this.searchTerm?.toLowerCase() || '';

  this.filteredReceipts = this.receiptEntries.filter((item: any) => {
    return Object.values(item).some((val: any) => {
      if (!val) return false;

      // handle date separately
      if (val instanceof Date) {
        return val.toLocaleDateString().toLowerCase().includes(term);
      }

      return val.toString().toLowerCase().includes(term);
    });
  });

  this.page = 1;
  this.updatePagination();
}

private formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);

  return `${year}-${month}-${day}`; // matches 'Y-m-d'
}
}