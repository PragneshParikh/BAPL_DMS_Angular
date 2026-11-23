import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface VehicleWarrantyRow {
  id: number;
  dealerName?: string;
  dealerCode?: string;
  chasisNo?: string;
  itemCode?: string;
  displayName?: string;
  city?: string;
  state?: string;
  itemName?: string;
  itemDescription?: string;
  customerName?: string;
  mobileNo?: string;
  dateOfSales?: string;
  deviceGroup?: string;
  deviceType?: string;
  vehicleStandardWarrantyMonths?: number;
  vehicleStandardWarrantyOdo?: number;
  vehicleExtWarrantyScheme?: string;
  vehicleExtendedWarrantyMonths?: number;
  vehicleExtendedWarrantyOdo?: number;
  dateOfStandardWarrantyExpiry?: string;
  dateOfExtendedWarrantyExpiry?: string;
  lastOdoReadingDate?: string;
  odoReadingAsPerLastDate?: number;
  currentWarrantyStatusAsPerDate?: string;
  currentWarrantyStatusAsPerOdo?: string;
  finalWarrantyStatus?: string;
}

@Component({
  selector: 'app-vehicle-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-warranty.html',
  styleUrl: './vehicle-warranty.scss'
})
export class VehicleWarrantyComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = `${environment.apiUrl}/vehicle-warranty`;

  rows: VehicleWarrantyRow[] = [];
  totalRecords = 0;
  loading = false;
  importing = false;

  // Filters
  dealerCode = '';
  fromDate = '2020-04-01';
  toDate = new Date().toISOString().split('T')[0];
  searchText = '';
  pageIndex = 1;
  pageSize = 25;

  dealers: { dealerCode: string; dealerName: string }[] = [];
  isAdmin = false;

  ngOnInit(): void {
    this.detectRole();
    if (this.isAdmin) {
      this.loadDealers();
    }
    this.search();
  }

  private detectRole(): void {
    const role = (localStorage.getItem('role') || localStorage.getItem('Role') || '').toLowerCase();
    this.isAdmin = role.includes('admin');
  }

  private loadDealers(): void {
    this.http.get<any[]>(`${environment.apiUrl}/DealerMaster`).subscribe({
      next: (res) => {
        this.dealers = (res || []).map((d) => ({
          dealerCode: d.dealerCode || d.DealerCode,
          dealerName: d.dealerName || d.DealerName
        }));
      },
      error: () => {}
    });
  }

  search(resetPage = false): void {
    if (resetPage) this.pageIndex = 1;
    this.loading = true;

    let params = new HttpParams()
      .set('PageIndex', this.pageIndex)
      .set('PageSize', this.pageSize);

    if (this.dealerCode) params = params.set('DealerCode', this.dealerCode);
    if (this.fromDate) params = params.set('FromDate', this.fromDate);
    if (this.toDate) params = params.set('ToDate', this.toDate);
    if (this.searchText.trim()) params = params.set('Search', this.searchText.trim());

    this.http.get<{ data: VehicleWarrantyRow[]; totalRecords: number }>(`${this.apiUrl}/list`, { params }).subscribe({
      next: (res) => {
        this.rows = res?.data || [];
        this.totalRecords = res?.totalRecords || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        alert(err?.error?.message || 'Failed to load Vehicle Warranty data.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.importing = true;
    this.http.post<any>(`${this.apiUrl}/import`, formData).subscribe({
      next: (res) => {
        this.importing = false;
        this.cdr.detectChanges();
        input.value = '';
        alert(res?.message || 'Excel imported successfully.');
        this.search(true);
      },
      error: (err) => {
        this.importing = false;
        this.cdr.detectChanges();
        input.value = '';
        alert(err?.error?.message || 'Excel import failed.');
      }
    });
  }

  exportExcel(): void {
    let params = new HttpParams();
    if (this.dealerCode) params = params.set('DealerCode', this.dealerCode);
    if (this.fromDate) params = params.set('FromDate', this.fromDate);
    if (this.toDate) params = params.set('ToDate', this.toDate);
    if (this.searchText.trim()) params = params.set('Search', this.searchText.trim());

    this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VehicleWarranty_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to export Excel.')
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.search();
  }
}