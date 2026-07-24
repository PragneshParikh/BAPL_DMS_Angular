import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  EstimateService,
  EstimateListRow,
  EstimateFilterModel,
  EstimatePagedResponse
} from '../../../core/services/estimate.service';
import { StorageService } from '../../../core/services/storage';
import { ReportService } from '../../../core/services/report.service';
// ⚠️ Adjust this path if your project layout differs — it should point at
// the Estimate (add/edit form) component, e.g. '../estimate' or
// '../estimate-form/estimate'. The class is exported as `Estimate` and its
// selector is 'app-estimate'.
import { Estimate } from '../estimate';

@Component({
  selector: 'app-estimate-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Estimate],
  templateUrl: './estimate-list.html'
})
export class EstimateList implements OnInit, OnDestroy {

  filterForm!: FormGroup;
  reportData: EstimateListRow[] = [];
  Math = Math;

  isDealer = false;
  loggedInDealerCode = '';

  pageIndex = 1;
  pageSize = 20;
  totalRecords = 0;

  isLoading = false;
  errorMessage = '';

  // ── Chassis No autosuggest ──
  chassisList: string[] = [];
  filteredChassisList: string[] = [];
  showChassisDropdown = false;

  // ── Estimate No autosuggest ──
  estimationNoList: string[] = [];
  filteredEstimationNoList: string[] = [];
  showEstimationDropdown = false;

  private static readonly MAX_SUGGESTIONS = 20;

  // ── Edit Estimate popup ──
  showEstimateModal = false;
  selectedEstimateId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private estimateService: EstimateService,
    private storageService: StorageService,
    private reportService: ReportService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      chassisNo: [''],
      estimationNo: [''],
      fromDate: [''],
      toDate: ['']
    });

    // Reload every time this route is navigated to, even if the router
    // reuses the already-instantiated component (e.g. returning here
    // right after saving or editing an estimate elsewhere in the app).
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        if (e.urlAfterRedirects === '/estimate') {
          this.pageIndex = 1;
          this.loadList();
        }
      });
  }

  ngOnInit(): void {
    const storedRole = (this.storageService.getRole() ?? '').trim().toLowerCase();
    this.loggedInDealerCode = this.storageService.getDealerCode() ?? '';

    const adminRoles = ['superadmin', 'admin', 'administrator'];
    this.isDealer = !adminRoles.includes(storedRole);

    this.loadList();
    this.loadChassisList();
    this.loadEstimationNumbers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChassisList(): void {
    this.reportService.getChassisList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => this.chassisList = list,
        error: (err) => console.error('Failed to fetch chassis list', err)
      });
  }

  private loadEstimationNumbers(): void {
    this.estimateService.getEstimationNumbers(this.isDealer ? this.loggedInDealerCode : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => this.estimationNoList = list,
        error: (err) => console.error('Failed to fetch estimation numbers', err)
      });
  }

  loadList(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const raw = this.filterForm.value;
    const filterModel: EstimateFilterModel = {
      dealerCode: this.isDealer ? this.loggedInDealerCode : undefined,
      chassisNo: raw.chassisNo || undefined,
      estimationNo: raw.estimationNo || undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    };

    this.estimateService.getAll(filterModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EstimatePagedResponse) => {
          this.reportData = response.data;
          this.totalRecords = response.totalRecords;
          this.pageIndex = response.pageIndex;
          this.pageSize = response.pageSize;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load estimates.';
          this.reportData = [];
          this.totalRecords = 0;
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadList();
  }

  onReset(): void {
    this.filterForm.reset({ chassisNo: '', estimationNo: '', fromDate: '', toDate: '' });
    this.pageIndex = 1;
    this.loadList();
  }

  onAddNew(): void {
    this.router.navigate(['/estimate/add']);
  }

  // ═══════════════════════════════════════════════════════════════════
  // EDIT ESTIMATE POPUP
  // ═══════════════════════════════════════════════════════════════════

  onEdit(id: number): void {
    this.selectedEstimateId = id;
    this.showEstimateModal = true;
  }

  closeEstimateModal(): void {
    this.showEstimateModal = false;
    this.selectedEstimateId = null;
  }

  onEstimateSaved(): void {
    this.closeEstimateModal();
    this.pageIndex = 1;
    this.loadList();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHASSIS NO AUTOSUGGEST
  // ═══════════════════════════════════════════════════════════════════

  onChassisInput(): void {
    const text = (this.filterForm.get('chassisNo')?.value ?? '').toString().trim().toUpperCase();
    const source = text
      ? this.chassisList.filter(c => c.toUpperCase().includes(text))
      : this.chassisList;
    this.filteredChassisList = source.slice(0, EstimateList.MAX_SUGGESTIONS);
    this.showChassisDropdown = true;
  }

  onChassisFocus(): void {
    this.onChassisInput();
  }

  onChassisBlur(): void {
    setTimeout(() => { this.showChassisDropdown = false; }, 150);
  }

  selectChassisSuggestion(chassis: string): void {
    this.filterForm.patchValue({ chassisNo: chassis });
    this.showChassisDropdown = false;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ESTIMATE NO AUTOSUGGEST
  // ═══════════════════════════════════════════════════════════════════

  onEstimationInput(): void {
    const text = (this.filterForm.get('estimationNo')?.value ?? '').toString().trim().toUpperCase();
    const source = text
      ? this.estimationNoList.filter(e => e.toUpperCase().includes(text))
      : this.estimationNoList;
    this.filteredEstimationNoList = source.slice(0, EstimateList.MAX_SUGGESTIONS);
    this.showEstimationDropdown = true;
  }

  onEstimationFocus(): void {
    this.onEstimationInput();
  }

  onEstimationBlur(): void {
    setTimeout(() => { this.showEstimationDropdown = false; }, 150);
  }

  selectEstimationSuggestion(no: string): void {
    this.filterForm.patchValue({ estimationNo: no });
    this.showEstimationDropdown = false;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.loadList();
  }

  firstPage(): void { this.goToPage(1); }
  previousPage(): void { this.goToPage(this.pageIndex - 1); }
  nextPage(): void { this.goToPage(this.pageIndex + 1); }
  lastPage(): void { this.goToPage(this.totalPages); }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN');
  }

  onPrint(id: number): void {
  this.estimateService.downloadPdf(id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      // Opens in a new tab so the user can use the browser's own print
      // dialog (Ctrl+P) directly from the PDF viewer.
      window.open(url, '_blank');
    },
    error: (err) => {
      this.errorMessage = err?.error?.message || 'Failed to generate print PDF.';
    }
  });
}
}