import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DealerService } from '../../../core/services/dealer-service';
import {
  LocalPartsService,
  PartsD2DTransaction,
  formatPartsD2DBillNo
} from '../../../core/services/local-parts.service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { LoaderService } from '../../../core/services/loader';
import { StorageService } from '../../../core/services/storage';
import { ToastService } from '../../../shared/toaster/toast-service';
import {
  ReportDealerOption,
  ReportLocationOption
} from '../../../ViewModels/models/stock-reports.model';

@Component({
  selector: 'app-parts-d2d-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parts-d2d-report.html',
  styleUrl: './parts-d2d-report.scss'
})
export class PartsD2DReport implements OnInit {
  readonly isAdmin: boolean;
  readonly dealerCode: string;

  dealerList: ReportDealerOption[] = [];
  locationList: ReportLocationOption[] = [];
  reportRows: PartsD2DTransaction[] = [];
  hasSearched = false;

  filters = {
    dealerCode: '',
    location: null as ReportLocationOption | null,
    fromDate: '',
    toDate: ''
  };

  constructor(
    private readonly storageService: StorageService,
    private readonly dealerService: DealerService,
    private readonly locationMasterService: LocationMasterService,
    private readonly localPartsService: LocalPartsService,
    private readonly loader: LoaderService,
    private readonly toast: ToastService
  ) {
    const role = this.storageService.getRole().trim().toLowerCase();
    this.isAdmin = role === 'admin' || role === 'superadmin';
    this.dealerCode = this.storageService.getDealerCode().trim();
  }

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadDealers();
  }

  loadDealers(): void {
    if (!this.isAdmin && !this.dealerCode) {
      this.toast.show('Dealer information is unavailable for this account.', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
      return;
    }

    this.loader.show();
    this.dealerService.getDealerDropdown(this.isAdmin ? null : this.dealerCode).subscribe({
      next: (response: any) => {
        this.loader.hide();
        this.dealerList = response?.data ?? [];
        if (this.isAdmin) {
          this.dealerList.unshift({ dealerCode: 'ALL', dealerName: 'All Dealers' });
          this.filters.dealerCode = 'ALL';
        } else if (this.dealerCode.includes(',')) {
          // 26.11.2026 BG employee mapped to several dealers: all of them by default, or pick one
          this.dealerList.unshift({ dealerCode: 'ALL', dealerName: 'All My Dealers' });
          this.filters.dealerCode = 'ALL';
        } else {
          this.filters.dealerCode = this.dealerCode;
        }
        this.loadLocations();
      },
      error: error => {
        this.loader.hide();
        console.error('Unable to load dealers for Parts D2D report.', error);
        this.toast.show('Unable to load dealers.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  onDealerChange(): void {
    this.filters.location = null;
    this.invalidateSearch();
    this.loadLocations();
  }

  onFiltersChanged(): void {
    this.invalidateSearch();
  }

  private loadLocations(): void {
    const selectedDealer = this.filters.dealerCode;
    const dealerCode = selectedDealer && selectedDealer !== 'ALL' ? selectedDealer : null;

    this.loader.show();
    this.locationMasterService.getLocationDropdownByDealerCode(dealerCode).subscribe({
      next: (locations: ReportLocationOption[]) => {
        this.loader.hide();
        this.locationList = (locations ?? [])
          .filter(location => this.isAdmin || Number(location.locareaidno) === 2)
          // 26.11.2026 a multi-dealer employee only sees locations of their own dealers
          .filter(location => this.isAdmin || this.dealerList.some(d => d.dealerCode === location.dealercode))
          .map(location => ({
            ...location,
            dealerName: this.dealerList.find(dealer => dealer.dealerCode === location.dealercode)?.dealerName
          }))
          .sort((left, right) => this.getLocationLabel(left).localeCompare(this.getLocationLabel(right)));
      },
      error: error => {
        this.loader.hide();
        console.error('Unable to load locations for Parts D2D report.', error);
        this.toast.show('Unable to load locations.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  getLocationLabel(location: ReportLocationOption): string {
    const name = location.locname || location.loccode || 'Unknown location';
    const locationLabel = location.loccode ? `${name} (${location.loccode})` : name;
    return this.filters.dealerCode === 'ALL'
      ? `${location.dealerName || location.dealercode} - ${locationLabel}`
      : locationLabel;
  }

  search(): void {
    if (!this.filters.fromDate || !this.filters.toDate) {
      this.toast.show('From Date and To Date are required.', {
        classname: 'bg-warning text-dark',
        delay: 4000
      });
      return;
    }
    if (this.filters.fromDate > this.filters.toDate) {
      this.toast.show('From Date cannot be later than To Date.', {
        classname: 'bg-warning text-dark',
        delay: 4000
      });
      return;
    }

    this.invalidateSearch();
    this.loader.show();
    this.localPartsService.getPartsD2DHistory().subscribe({
      next: transactions => {
        this.loader.hide();
        this.hasSearched = true;
        this.reportRows = (transactions ?? []).filter(transaction => this.matchesFilters(transaction));
      },
      error: error => {
        this.loader.hide();
        console.error('Unable to load Parts D2D report.', error);
        this.toast.show('Unable to load Parts D2D report.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  private matchesFilters(transaction: PartsD2DTransaction): boolean {
    const transactionDate = (transaction.date ?? '').slice(0, 10);
    if (transactionDate < this.filters.fromDate || transactionDate > this.filters.toDate) {
      return false;
    }

    if (this.filters.dealerCode && this.filters.dealerCode !== 'ALL') {
      const code = this.filters.dealerCode.toLowerCase();
      if (transaction.fromDealerCode.toLowerCase() !== code &&
          transaction.toDealerCode.toLowerCase() !== code) {
        return false;
      }
    }

    const location = this.filters.location;
    if (location) {
      const code = location.loccode.toLowerCase();
      const dealer = location.dealercode.toLowerCase();
      const matchesFrom = transaction.fromLocationCode.toLowerCase() === code &&
        transaction.fromDealerCode.toLowerCase() === dealer;
      const matchesTo = transaction.toLocationCode.toLowerCase() === code &&
        transaction.toDealerCode.toLowerCase() === dealer;
      if (!matchesFrom && !matchesTo) return false;
    }

    return true;
  }

  formatBillNo(billNo: string): string {
    return formatPartsD2DBillNo(billNo);
  }

  exportExcel(): void {
    if (!this.hasSearched) {
      this.toast.show('Search with the selected filters before exporting.', {
        classname: 'bg-warning text-dark',
        delay: 4000
      });
      return;
    }

    if (this.reportRows.length === 0) {
      this.toast.show('No data available to export.', {
        classname: 'bg-warning text-dark',
        delay: 4000
      });
      return;
    }

    const excelData = this.reportRows.map((transaction, index) => ({
      'Sr No': index + 1,
      'D2D Bill No': this.formatBillNo(transaction.d2DBillNo),
      Prefix: transaction.prefix,
      Date: transaction.date.slice(0, 10),
      'From Dealer': transaction.fromDealerCode,
      'From Location': `${transaction.fromLocationName} (${transaction.fromLocationCode})`,
      'To Dealer': transaction.toDealerCode,
      'To Location': `${transaction.toLocationName} (${transaction.toLocationCode})`,
      'Part No': transaction.partCode,
      Description: transaction.description,
      Rate: transaction.rate,
      Quantity: transaction.transferQuantity,
      'From Opening Stock': transaction.fromPreviousStock,
      'From Closing Stock': transaction.fromClosingStock,
      'To Opening Stock': transaction.toPreviousStock,
      'To Closing Stock': transaction.toClosingStock,
      Status: transaction.isReceived ? 'Received' : 'Pending'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Part D2D Report');
    XLSX.writeFile(
      workbook,
      `PartD2DReport_${this.filters.fromDate}_${this.filters.toDate}.xlsx`
    );
  }

  reset(): void {
    this.filters = {
      dealerCode: this.isAdmin ? 'ALL' : this.dealerCode,
      location: null,
      fromDate: '',
      toDate: ''
    };
    this.setDefaultDates();
    this.reportRows = [];
    this.hasSearched = false;
    this.loadLocations();
  }

  private invalidateSearch(): void {
    this.reportRows = [];
    this.hasSearched = false;
  }

  private setDefaultDates(): void {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    this.filters.fromDate = this.formatDate(from);
    this.filters.toDate = this.formatDate(to);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
