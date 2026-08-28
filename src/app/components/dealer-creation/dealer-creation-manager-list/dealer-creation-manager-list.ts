// src\app\components\dealer-creation\dealer-creation-manager-list\dealer-creation-manager-list.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DealerCreationManagerService } from '../../../core/services/dealer-creation-manager';
import { DealerListModel } from '../../../ViewModels/models/DealerListModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { ReportService } from '../../../core/services/report.service';
import { DealerDropdownItem } from '../../../ViewModels/models/job-report.model';
import { BgRoleService } from '../../../core/services/bg-role';
import { BgRoleMappingModel } from '../../../ViewModels/models/BgRoleMappingModel';
import { DealerLocationModel } from '../../../ViewModels/models/DealerMenuAccessModel';
import { MenuAccessService } from '../../../core/services/menu-access.service';
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
  readonly SUBMENU_ID = 101;
  canEdit = false;
  canDelete = false;
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

  // Inline Edit modal
  showEditModal = false;
  editTarget: DealerListModel | null = null;
  editForm!: FormGroup;

  // ── Role search (autosuggest, inside the Dealer Edit popup) ──
  allRoles: BgRoleMappingModel[] = [];
  roleSearchText = '';
  filteredRoles: BgRoleMappingModel[] = [];
  showRoleDropdown = false;

  // Dealer-level "Menu Access" (separate dedicated page) - onMenuAccess() below.

  // ── Dealer Locations — inline expandable row (accordion: one open at a time) ──
  expandedDealerId: number | null = null;
  locationsTarget: DealerListModel | null = null;
  dealerLocations: DealerLocationModel[] = [];
  locationsLoading = false;
  locationsError = '';
  selectedLocationIds: Set<number> = new Set();
  bulkActionLoading = false;

  // NOTE: the "Edit Location" popup has been removed entirely. Opening a
  // location (onOpenLocation below) now navigates to a dedicated
  // LocationEditPage in a new browser tab - same pattern as the
  // dealer-level Menu Access page - which handles Code/Name/Role AND
  // Access Menu together. No modal state is needed here anymore.

  private destroy$ = new Subject<void>();
  private static readonly AUTO_SEARCH_DEBOUNCE_MS = 400;

  constructor(
    private fb: FormBuilder,
    private dealerService: DealerCreationManagerService,
    private reportService: ReportService,
    private bgRoleService: BgRoleService,
    private loader: LoaderService,
    private toaster: ToastService,
    private router: Router,
    private menuAccess: MenuAccessService   // ADDED
  ) {
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);

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
    this.reportService.getDealerDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DealerDropdownItem[]) => this.dealerDropdown = data,
        error: (err) => console.error('Failed to fetch dealer dropdown', err)
      });
  }

  private loadRoles(): void {
    this.bgRoleService.getMappings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: BgRoleMappingModel[]) => this.allRoles = res ?? [],
        error: (err) => console.error('Failed to fetch BG role mappings', err)
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

          if (this.expandedDealerId !== null && !this.dealerList.some(d => d.id === this.expandedDealerId)) {
            this.collapseLocations();
          }
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
        const previousRoleId = this.editTarget?.roleId || '';
        const newRoleId = raw.roleId || '';

        if (newRoleId && newRoleId !== previousRoleId) {
          this.dealerService.assignRole(this.editTarget!.id, newRoleId).subscribe({
            next: () => this.finishSave(),
            error: (err) => {
              this.loader.hide();
              this.toaster.show(err?.error?.message || 'Dealer saved, but role assignment failed.', { classname: 'bg-warning text-white', delay: 6000 });
              this.closeEditModal();
              this.loadDealers();
            }
          });
        } else if (!newRoleId && previousRoleId) {
          this.dealerService.unassignRole(this.editTarget!.id).subscribe({
            next: () => this.finishSave(),
            error: (err) => {
              this.loader.hide();
              this.toaster.show(err?.error?.message || 'Dealer saved, but role removal failed.', { classname: 'bg-warning text-white', delay: 6000 });
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
  // ROLE SEARCH (autosuggest, inside the Dealer Edit popup)
  // ═══════════════════════════════════════════════════════════════════

  onRoleSearchInput(): void {
    this.updateRoleSuggestions();
    this.editForm.patchValue({ roleId: '' });
  }

  onRoleSearchFocus(): void {
    this.updateRoleSuggestions();
  }

  onRoleSearchBlur(): void {
    setTimeout(() => { this.showRoleDropdown = false; }, 150);
  }

  selectRoleSuggestion(role: BgRoleMappingModel): void {
    this.roleSearchText = role.roleName;
    this.editForm.patchValue({ roleId: role.roleId });
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
      ? this.allRoles.filter(r => r.roleName?.toLowerCase().includes(text))
      : [...this.allRoles];
    this.showRoleDropdown = true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // MENU ACCESS (dealer-level) — opens a dedicated page in a new tab.
  // Unchanged - this is the 3rd icon on each dealer row.
  // ═══════════════════════════════════════════════════════════════════

  onMenuAccess(dealer: DealerListModel): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dealer-menu-access', dealer.id])
    );
    window.open(url, '_blank');
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEALER LOCATIONS — inline expandable row under the clicked dealer name
  // ═══════════════════════════════════════════════════════════════════

  onToggleDealerLocations(dealer: DealerListModel): void {
    if (this.expandedDealerId === dealer.id) {
      this.collapseLocations();
      return;
    }

    this.expandedDealerId = dealer.id;
    this.locationsTarget = dealer;
    this.dealerLocations = [];
    this.locationsError = '';
    this.selectedLocationIds = new Set();
    this.locationsLoading = true;

    this.dealerService.getLocations(dealer.id).subscribe({
      next: (data) => {
        this.dealerLocations = data ?? [];
        this.locationsLoading = false;
      },
      error: (err) => {
        this.locationsLoading = false;
        this.locationsError = err?.error?.message || 'Failed to load locations for this dealer.';
      }
    });
  }

  private collapseLocations(): void {
    this.expandedDealerId = null;
    this.locationsTarget = null;
    this.dealerLocations = [];
    this.selectedLocationIds = new Set();
    this.locationsError = '';
  }

  toggleLocationSelection(loc: DealerLocationModel): void {
    if (this.selectedLocationIds.has(loc.id)) {
      this.selectedLocationIds.delete(loc.id);
    } else {
      this.selectedLocationIds.add(loc.id);
    }
  }

  get allLocationsSelected(): boolean {
    return this.dealerLocations.length > 0 &&
      this.dealerLocations.every(l => this.selectedLocationIds.has(l.id));
  }

  toggleSelectAllLocations(): void {
    if (this.allLocationsSelected) {
      this.selectedLocationIds = new Set();
    } else {
      this.selectedLocationIds = new Set(this.dealerLocations.map(l => l.id));
    }
  }

  bulkUpdateLocationStatus(isActive: boolean): void {
    if (!this.locationsTarget || this.selectedLocationIds.size === 0) return;

    this.bulkActionLoading = true;
    const ids = Array.from(this.selectedLocationIds);

    this.dealerService.updateLocationsStatus(this.locationsTarget.id, ids, isActive).subscribe({
      next: () => {
        this.bulkActionLoading = false;
        this.toaster.show(
          `${ids.length} location(s) ${isActive ? 'activated' : 'deactivated'}.`,
          { classname: 'bg-success text-white', delay: 5000 }
        );
        this.selectedLocationIds = new Set();
        this.reloadExpandedLocations();
      },
      error: (err) => {
        this.bulkActionLoading = false;
        this.toaster.show(err?.error?.message || 'Failed to update location status.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  private reloadExpandedLocations(): void {
    if (!this.locationsTarget) return;

    this.locationsLoading = true;
    this.dealerService.getLocations(this.locationsTarget.id).subscribe({
      next: (data) => {
        this.dealerLocations = data ?? [];
        this.locationsLoading = false;
      },
      error: (err) => {
        this.locationsLoading = false;
        this.locationsError = err?.error?.message || 'Failed to reload locations.';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // LOCATION — opens a dedicated page in a new tab (no more popup).
  // ═══════════════════════════════════════════════════════════════════

  onOpenLocation(loc: DealerLocationModel): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/location-edit', loc.id])
    );
    window.open(url, '_blank');
  }
}