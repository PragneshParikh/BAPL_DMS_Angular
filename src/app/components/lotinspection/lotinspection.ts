import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { Lotinspectionservice } from '../../core/services/lotinspectionservice';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-lotinspection',
  standalone: true,
  imports: [FormsModule, CommonModule, FlatpickrModule, NgbTooltipModule, RouterModule, NgbPaginationModule],
  providers: [FlatpickrDefaults],
  templateUrl: './lotinspection.html',
  styleUrl: './lotinspection.scss',
})

export class Lotinspection implements OnInit {

  searchTerm: string = '';
  //List Data binding
  filteredData: any[] = [];
  pagedData: any[] = [];

  //  PAGINATION
  page = 1;
  pageSize = 5;
  collectionSize = 0;

  //  SORTING
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  //  ALERT
  showAlert: boolean = false;
  alertMessage: string = '';
  isSuperAdmin: boolean;


  constructor(private lotinspectionService: Lotinspectionservice,
    private loader: LoaderService,
    public toaster: ToastService,
    private router: Router,
    private storageService: StorageService
  ) { }


  ngOnInit() {

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    // default search (today to today)
    //this.searchTerm = `${today} to ${today}`;

    this.loadLotInspectionList();
  }
  // LOAD DATA
  loadLotInspectionList() {
    this.loader.show();

    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    this.lotinspectionService.getAllLotInspectionHeaderDetails(this.searchTerm || '', dealerCode)
      .subscribe({
        next: (res: any) => {
          console.log("FULL RESPONSE:", res);

          // CORRECT FIX
          this.filteredData = Array.isArray(res.data) ? res.data : [];
          this.collectionSize = this.filteredData.length;
          this.page = 1; // RESET PAGE

          this.refreshTable();
          this.loader.hide();

        },
        error: (err) => {
          console.error(err)
          this.loader.hide();
        }
      });
  }
  //  SEARCH
  searchItems(fromDate: string, toDate: string, invoiceNo: string) {
    let searchText = '';

    // Priority 1: Invoice No
    if (invoiceNo) {
      searchText = invoiceNo;
    }
    // Priority 2: Date Range
    else if (fromDate && toDate) {
      searchText = `${fromDate} to ${toDate}`;
    }

    this.searchTerm = searchText;
    this.loadLotInspectionList();
  }

  //  PAGINATION
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }

  refreshTable() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);
  }

  //  SORTING
  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });

    this.refreshTable();
  }

  // Navigation on Lot Inspection Header Form page
  onNavigate(invoiceNo: string, event: Event) {
    event.stopPropagation();
    this.lotinspectionService.getAllLotInspectionHeaderDetails(invoiceNo).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0 && res.data[0].isLotInspected === true) {
          //console.log('BLOCKED');
          Swal.fire({
            icon: 'warning',
            title: 'Already Inspected',
            text: `Chassis No lot inspection already done`,
            confirmButtonText: 'OK'
          });
          return;
        }
        this.router.navigate(['/lot-inspection-details', invoiceNo]);
      },
      error: (err) => {
        console.error('Error while checking lot inspection:', err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Something went wrong. Please try again.'
        });
      }
    });
  }
}

