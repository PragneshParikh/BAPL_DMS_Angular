import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { ReportService } from '../../../core/services/report.service';



@Component({
  selector: 'app-stock-bill-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-bill-list.html',
  styleUrl: './stock-bill-list.scss'
})
export class StockBillListComponent implements OnInit {

  fromDate = '';
  toDate = '';
  dealerCode = '';
  isAdmin = false;

  locationList: any[] = [];
  selectedLocation = '';


  stockBillList: any[] = [];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private locationMasterService: LocationMasterService,
    private loader: LoaderService,
    private toast: ToastService,
    private reportService: ReportService
  ) { }

  ngOnInit(): void {


    const role = this.storageService
      .getRole()
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, '');

    this.isAdmin = role === 'admin' || role === 'superadmin';

    this.dealerCode = this.storageService.getDealerCode();

    const today = new Date();

    this.toDate = today.toISOString().split('T')[0];

    const from = new Date();
    from.setDate(today.getDate() - 30);

    this.fromDate = from.toISOString().split('T')[0];

    this.loadLocations();

  }

  loadLocations(): void {

    this.loader.show();

    const locationRequest = this.isAdmin
      ? this.locationMasterService.getAllLocationMaster()
      : this.locationMasterService.getLocationByDealerCode(this.dealerCode);

    locationRequest.subscribe({
      next: (res: any) => {

        this.loader.hide();

        const responseLocations = Array.isArray(res)
          ? res
          : res?.data;

        this.locationList = responseLocations || [];

      },
      error: (err: any) => {

        this.loader.hide();

        console.error(err);

        this.toast.show(
          'Unable to load locations.',
          {
            classname: 'bg-danger text-light',
            delay: 5000
          }
        );

      }
    });

  }


  search(): void {

    this.reportService
      .getStockAdjustmentList(
        this.fromDate,
        this.toDate,
        this.selectedLocation
      )
      .subscribe({
        next: (res: any) => {

          this.stockBillList = res ?? [];
          this.currentPage = 1;

        },
        error: (err: any) => {

          console.error(err);
          this.stockBillList = [];

        }
      });

  }

  exportExcel(): void {

    this.reportService
      .exportStockAdjustmentExcel(
        this.fromDate,
        this.toDate,
        this.selectedLocation
      )
      .subscribe({

        next: (blob: Blob) => {

          const url =
            window.URL.createObjectURL(blob);

          const a =
            document.createElement('a');

          a.href = url;

          a.download =
            'StockAdjustmentList.xlsx';

          a.click();

          window.URL.revokeObjectURL(url);
        },

        error: (err: any) => {

          console.error(err);

          this.toast.show(
            'Unable to export excel.',
            {
              classname: 'bg-danger text-light',
              delay: 5000
            }
          );
        }

      });
  }


  editItem(item: any): void {

    this.router.navigate(
      ['/stock-adjustment'],
      {
        queryParams: {
          id: item.id
        }
      }
    );

  }



  deleteItem(item: any): void {

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    this.reportService
      .deleteStockAdjustment(item.id)
      .subscribe({

        next: () => {

          this.stockBillList =
            this.stockBillList.filter(
              x => x.id !== item.id
            );

          this.toast.show(
            'Record Deleted Successfully',
            {
              classname: 'bg-success text-light',
              delay: 3000
            }
          );

        },

        error: (err: any) => {

          console.error(err);

          this.toast.show(
            'Unable to delete record.',
            {
              classname: 'bg-danger text-light',
              delay: 5000
            }
          );

        }

      });

  }

  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.stockBillList.length / this.pageSize) || 1;
  }

  get paginatedStockBillList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.stockBillList.slice(start, start + this.pageSize);
  }

  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
  }

}