// src\app\components\taxcode-master\taxcode-master.ts
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toaster/toast-service';
import { TaxCodeMasterService } from '../../core/services/taxcode-master-service';
import { LoaderService } from '../../core/services/loader';
import { MenuAccessService } from '../../core/services/menu-access.service';
declare var bootstrap: any;

@Component({
  selector: 'app-tax-code-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, NgbPaginationModule],
  templateUrl: './taxcode-master.html',
  styleUrl: './taxcode-master.scss'
})
export class TaxCodeMasterComponent implements OnInit {
  readonly SUBMENU_ID = 14;
  canCreate = false;
  canEdit = false;
  canDownload = false;
  taxCodeList: any[] = [];
  originalTaxCodeList: any[] = [];
  pagedTaxCodeList: any[] = [];
  historyList: any[] = [];

  selectedTaxCode: any = this.getEmptyTaxCode();

  searchTerm = '';
  formSubmitted = false;
  todayDate: string = '';

  page = 1;
  pageSize = 10;
  totalRecords = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private taxCodeService: TaxCodeMasterService,
    private toastr: ToastService,
    private loader: LoaderService,
    private menuAccess: MenuAccessService
  ) { 
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const today = new Date();
    this.todayDate = this.formatDateForInput(today.toISOString());
    this.loadTaxCodes();
  }

  getEmptyTaxCode() {
    return {
      id: 0,
      taxcode: '',
      description: '',
      taxRate: null,
      effectiveDate: ''
    };
  }

  loadTaxCodes() {
    this.loader.show();
    this.taxCodeService.getAllTaxCodes().subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.taxCodeList = (res || []).map((item: any) => ({
          id: item.id ?? 0,
          taxcode: item.taxcode ?? item.taxCode ?? '',
          description: item.description ?? '',
          taxRate: item.taxRate ?? null,
          effectiveDate: item.effectiveDate ?? ''
        }));

        this.originalTaxCodeList = [...this.taxCodeList];
        
        // Main table should only show the NEWEST record for each unique tax code
        this.taxCodeList = this.getDistinctTaxCodes(this.originalTaxCodeList);

        this.page = 1;
        this.loadPage();
      },
      error: (err) => {
        this.loader.hide();
        console.error('Load Tax Codes Error:', err);
        this.toastr.show('Failed to load Tax Code list', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  getDistinctTaxCodes(list: any[]): any[] {
    const map = new Map<string, any>();
    for (const item of list) {
        const key = (item.taxcode || '').toLowerCase();
        if (!map.has(key)) {
            map.set(key, item);
        } else {
            const existing = map.get(key);
            const date1 = new Date(item.effectiveDate || 0).getTime();
            const date2 = new Date(existing.effectiveDate || 0).getTime();
            // Compare by effectiveDate (keep the newest)
            if (date1 > date2 || (date1 === date2 && item.id > existing.id)) {
                map.set(key, item);
            }
        }
    }
    return Array.from(map.values());
  }

  loadPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.totalRecords = this.taxCodeList.length;
    this.pagedTaxCodeList = this.taxCodeList.slice(start, end);
  }

  refreshPage() {
    this.loadPage();
  }

  searchTaxCode() {
    let distinctList = this.getDistinctTaxCodes(this.originalTaxCodeList);
    let filtered = [...distinctList];

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(x => {
        return Object.values(x).some(val =>
          val !== null && val !== undefined && val.toString().toLowerCase().includes(term)
        );
      });
    }

    this.taxCodeList = filtered;
    this.page = 1;
    this.loadPage();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.taxCodeList.sort((a: any, b: any) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      if (column === 'effectiveDate') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      } else {
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.loadPage();
  }

  getSortClass(column: string) {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  }

  openAddModal() {
    this.selectedTaxCode = this.getEmptyTaxCode();
    this.historyList = [];
    this.formSubmitted = false;

    const modal = new bootstrap.Modal(document.getElementById('addTaxCodeModal'));
    modal.show();
  }

  openEditModal(tax: any) {
    this.selectedTaxCode = {
      id: tax.id,
      taxcode: tax.taxcode ?? '',
      description: tax.description ?? '',
      taxRate: tax.taxRate ?? null,
      effectiveDate: tax.effectiveDate ? this.formatDateForInput(tax.effectiveDate) : ''
    };

    // Load History for the selected tax code (DESCENDING by effective date)
    this.historyList = this.originalTaxCodeList
      .filter(x => (x.taxcode || '').toLowerCase() === (tax.taxcode || '').toLowerCase())
      .sort((a, b) => new Date(b.effectiveDate || 0).getTime() - new Date(a.effectiveDate || 0).getTime());

    this.formSubmitted = false;

    const modal = new bootstrap.Modal(document.getElementById('addTaxCodeModal'));
    modal.show();
  }

  addOrUpdateTaxCode() {
    this.formSubmitted = true;

    // Validation check
    if (
      !this.selectedTaxCode.taxcode ||
      this.selectedTaxCode.taxRate === null ||
      this.selectedTaxCode.taxRate === '' ||
      !this.selectedTaxCode.effectiveDate
    ) {
      return;
    }

    // Duplicate Check
    let isDuplicate = false;

    // If we are adding a COMPLETELY NEW taxcode, restrict exact matching
    if (this.selectedTaxCode.id === 0) {
      isDuplicate = this.originalTaxCodeList.some(
        tax => (tax.taxcode || '').toLowerCase() === (this.selectedTaxCode.taxcode || '').toLowerCase()
      );
    }

    if (isDuplicate) {
      this.toastr.show('Tax Code already exists', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    const payload: any = {
      id: 0, // ALWAYS 0 so it always inserts a new record, even when doing an "Update"
      taxCode: this.selectedTaxCode.taxcode,  // Map frontend property to backend
      description: this.selectedTaxCode.description,
      taxRate: Number(this.selectedTaxCode.taxRate),
      effectiveDate: this.selectedTaxCode.effectiveDate,
      createdBy: 'admin',
      createdDate: new Date(),
      updatedBy: 'admin',
      updatedDate: new Date()
    };

    this.loader.show();
    if (payload.id === 0) {

      this.taxCodeService.addTaxCode(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.toastr.show('Tax Code added successfully', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.closeModal();
          this.loadTaxCodes();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toastr.show('Failed to add Tax Code', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });

    } else {

      this.taxCodeService.updateTaxCode(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.toastr.show('Tax Code updated successfully', {
            classname: 'bg-success text-white',
            delay: 5000
          });
          this.closeModal();
          this.loadTaxCodes();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toastr.show('Failed to update Tax Code', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });

    }
  }
  closeModal() {
    const modalElement = document.getElementById('addTaxCodeModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }

  downloadTaxCodeExcel() {
    this.loader.show();
    this.taxCodeService.downloadTaxCodeExcel().subscribe({
      next: (response: Blob) => {
        this.loader.hide();
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TaxCodeMaster.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);

        this.toastr.show('Excel downloaded successfully', {
          classname: 'bg-success text-white',
          delay: 5000
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error('Excel Download Error:', err);
        this.toastr.show('Excel download failed', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // Opens the hidden file picker; the actual import happens in onImportFileSelected
  // once the user has chosen a file.
  triggerImportFileInput(): void {
    this.importFileInput.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.loader.show();

    this.taxCodeService.importTaxCodeExcel(file).subscribe({
      next: (res: any) => {
        this.loader.hide();
        input.value = ''; // reset so selecting the same file again still fires a change event

        // NOTE: assumes the API returns camelCase JSON (insertedCount/skippedCount/
        // failedCount) — adjust the property names below if your API uses PascalCase.
        const summary = res?.data;
        const message = summary
          ? `Import complete: ${summary.insertedCount} added, ${summary.skippedCount} skipped, ${summary.failedCount} failed.`
          : 'Tax Code data imported successfully';

        this.toastr.show(message, {
          classname: summary?.failedCount ? 'bg-warning text-dark' : 'bg-success text-white',
          delay: 5000
        });

        this.loadTaxCodes();
      },
      error: (err) => {
        this.loader.hide();
        input.value = '';
        console.error(err);

        this.toastr.show('Failed to import Tax Code data', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  formatDateForInput(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}