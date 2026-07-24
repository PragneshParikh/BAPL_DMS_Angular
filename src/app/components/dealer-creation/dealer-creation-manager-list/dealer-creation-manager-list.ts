import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DealerCreationManagerService } from '../../../core/services/dealer-creation-manager';
import { DealerListModel } from '../../../ViewModels/models/DealerListModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { ReportService } from '../../../core/services/report.service';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import { RoleService } from '../../../core/services/Deptrole';
import { RoleModel } from '../../../ViewModels/RoleModel';

@Component({
  selector: 'app-dealer-creation-manager-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dealer-creation-manager-list.html',
})
export class DealerCreationManagerList implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  dealerList: DealerListModel[] = [];
  dealerDropdown: DealerDropdownItem[] = [];

  pageIndex = 1;
  pageSize = 20;
  totalRecords = 0;
  isLoading = false;
  errorMessage = '';
  Math = Math;

  // ── Dealer filter search (autosuggest) ──
  dealerSearchText = '';
  filteredDealerDropdown: DealerDropdownItem[] = [];
  showDealerDropdown = false;
  private static readonly MAX_DEALER_SUGGESTIONS = 20;

  // Inline Edit modal — no separate route/component; this screen is
  // list-only, Edit just patches the fields shown here.
  showEditModal = false;
  editTarget: DealerListModel | null = null;
  editForm!: FormGroup;

  // ── Role search (autosuggest, inside the Edit popup) ──
  allRoles: RoleModel[] = [];
  roleSearchText = '';
  filteredRoles: RoleModel[] = [];
  showRoleDropdown = false;

  private destroy$ = new Subject<void>();
  private static readonly AUTO_SEARCH_DEBOUNCE_MS = 400;

  constructor(
    private fb: FormBuilder,
    private dealerService: DealerCreationManagerService,
    private reportService: ReportService,
    private roleService: RoleService,
    private loader: LoaderService,
    private toaster: ToastService
  ) {
    this.filterForm = this.fb.group({
      dealerCode: [''],
      search: ['']
    });

    this.editForm = this.fb.group({
      dealercode: [''],
      compname: [''],
      email: [''],
      isActive: [true],
      roleId: ['']
    });
  }

  ngOnInit(): void {
    this.loadDealerDropdown();
    this.loadDealers();
    this.loadRoles();

    // Auto-search — dealer selection (via autosuggest) or free-text search
    // both re-run the list after a short pause, no Search button needed.
    this.filterForm.valueChanges
      .pipe(
        debounceTime(DealerCreationManagerList.AUTO_SEARCH_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex = 1;
        this.loadDealers();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDealerDropdown(): void {
    // Reuses the same dealer dropdown source as Job Card Report —
    // no separate endpoint needed here.
    this.reportService.getDealerDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DealerDropdownItem[]) => this.dealerDropdown = data,
        error: (err) => console.error('Failed to fetch dealer dropdown', err)
      });
  }

  // Loads every system role once — same AspNetRoles list that powers Role
  // Master / BG Role Master — for the searchable Role field in the Edit popup.
  private loadRoles(): void {
    this.roleService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: RoleModel[]) => this.allRoles = res ?? [],
        error: (err) => console.error('Failed to fetch roles', err)
      });
  }

  loadDealers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const raw = this.filterForm.value;

    this.dealerService.getAll({
      search: raw.search || undefined,
      dealerCode: raw.dealerCode || undefined,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dealerList = res.data ?? [];
          this.totalRecords = res.totalRecords ?? 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Failed to load dealers.';
          this.dealerList = [];
          this.totalRecords = 0;
        }
      });
  }

  onReset(): void {
    this.filterForm.reset({ dealerCode: '', search: '' });
    this.dealerSearchText = '';
    this.showDealerDropdown = false;
    this.pageIndex = 1;
    this.loadDealers();
  }

  onEdit(dealer: DealerListModel): void {
    this.editTarget = dealer;
    this.editForm.patchValue({
      dealercode: dealer.dealercode,
      compname: dealer.compname,
      email: dealer.email,
      isActive: dealer.isActive,
      roleId: dealer.roleId || ''
    });
    this.roleSearchText = dealer.roleName || '';
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.editTarget) return;

    const raw = this.editForm.value;
    if (!raw.dealercode?.trim() || !raw.compname?.trim()) {
      this.toaster.show('Dealer Code and Name are required.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

    this.loader.show();
    this.dealerService.update(this.editTarget.id, {
      dealercode: raw.dealercode,
      compname: raw.compname,
      email: raw.email,
      isActive: raw.isActive
    }).subscribe({
      next: () => {
        // Role assignment only fires if a role is actually selected — an
        // empty/untouched Role field leaves any existing assignment as-is
        // rather than clearing it.
        if (raw.roleId) {
          this.dealerService.assignRole(this.editTarget!.id, raw.roleId).subscribe({
            next: () => this.finishSave(),
            error: (err) => {
              this.loader.hide();
              this.toaster.show(err?.error?.message || 'Dealer saved, but role assignment failed.', { classname: 'bg-warning text-white', delay: 6000 });
              this.closeEditModal();
              this.loadDealers();
            }
          });
        } else {
          this.finishSave();
        }
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show(err?.error?.message || 'Update failed', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  private finishSave(): void {
    this.loader.hide();
    this.toaster.show('Dealer updated', { classname: 'bg-success text-white', delay: 5000 });
    this.closeEditModal();
    this.loadDealers();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editTarget = null;
    this.showRoleDropdown = false;
  }

  // Soft delete — DealerMaster.Dealercode is referenced across
  // ChassisDetails, JobCardHeader, ItemMaster, LocationMaster, and more,
  // so history tied to a dealer is preserved rather than erased.
  onDelete(dealer: DealerListModel): void {
    if (!confirm(`Delete dealer "${dealer.compname}" (${dealer.dealercode})? This marks it inactive; history tied to it is preserved.`)) return;

    this.loader.show();
    this.dealerService.deactivate(dealer.id).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Dealer deleted', { classname: 'bg-success text-white', delay: 5000 });
        this.loadDealers();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error deleting dealer', { classname: 'bg-warning text-white', delay: 5000 });
        console.error(err);
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.loadDealers();
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

  // ═══════════════════════════════════════════════════════════════════
  // DEALER FILTER — AUTOSUGGEST
  // ═══════════════════════════════════════════════════════════════════

  onDealerSearchInput(): void {
    this.updateDealerSuggestions();
    if (!this.dealerSearchText.trim()) {
      this.filterForm.patchValue({ dealerCode: '' });
    }
  }

  onDealerSearchFocus(): void {
    this.updateDealerSuggestions();
  }

  onDealerSearchBlur(): void {
    setTimeout(() => { this.showDealerDropdown = false; }, 150);
  }

  selectDealerSuggestion(dealer: DealerDropdownItem): void {
    this.dealerSearchText = dealer.dealerName;
    this.filterForm.patchValue({ dealerCode: dealer.dealerCode });
    this.showDealerDropdown = false;
  }

  clearDealerSearch(): void {
    this.dealerSearchText = '';
    this.filterForm.patchValue({ dealerCode: '' });
    this.showDealerDropdown = false;
  }

  private updateDealerSuggestions(): void {
    const text = this.dealerSearchText.trim().toLowerCase();
    this.filteredDealerDropdown = text
      ? this.dealerDropdown.filter(d =>
          d.dealerName?.toLowerCase().includes(text) ||
          d.dealerCode?.toLowerCase().includes(text))
      : [...this.dealerDropdown];
    this.filteredDealerDropdown = this.filteredDealerDropdown.slice(0, DealerCreationManagerList.MAX_DEALER_SUGGESTIONS);
    this.showDealerDropdown = true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ROLE SEARCH (autosuggest, inside the Edit popup)
  // ═══════════════════════════════════════════════════════════════════

  onRoleSearchInput(): void {
    this.updateRoleSuggestions();
    // Typing invalidates a previously-picked exact match until a suggestion
    // is clicked again.
    this.editForm.patchValue({ roleId: '' });
  }

  onRoleSearchFocus(): void {
    this.updateRoleSuggestions();
  }

  onRoleSearchBlur(): void {
    setTimeout(() => { this.showRoleDropdown = false; }, 150);
  }

  selectRoleSuggestion(role: RoleModel): void {
    this.roleSearchText = role.name;
    this.editForm.patchValue({ roleId: role.id });
    this.showRoleDropdown = false;
  }

  clearRoleSearch(): void {
    this.roleSearchText = '';
    this.editForm.patchValue({ roleId: '' });
    this.showRoleDropdown = false;
  }

  private updateRoleSuggestions(): void {
    const text = this.roleSearchText.trim().toLowerCase();
    this.filteredRoles = text
      ? this.allRoles.filter(r => r.name?.toLowerCase().includes(text))
      : [...this.allRoles];
    this.showRoleDropdown = true;
  }
}