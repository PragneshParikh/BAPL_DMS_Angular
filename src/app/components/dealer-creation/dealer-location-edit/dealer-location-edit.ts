// src\app\components\dealer-creation\dealer-location-edit\dealer-location-edit.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { DealerCreationManagerService } from '../../../core/services/dealer-creation-manager';
import { BgRoleService } from '../../../core/services/bg-role';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationDetailModel } from '../../../ViewModels/models/LocationDetailModel';
import { BgRoleMappingModel } from '../../../ViewModels/models/BgRoleMappingModel';
import { LocationMenuAccessResponse } from '../../../ViewModels/models/LocationMenuAccessModel';
import { DealerMenuAccessItem } from '../../../ViewModels/models/DealerMenuAccessModel';
import { MenuAccessService } from '../../../core/services/menu-access.service';
// Replaces the old "Edit Location" popup entirely. Clicking a location's
// action icon in the dealer expansion row now opens THIS as a new browser
// tab, same pattern as the dealer-level Menu Access page - but this one
// carries everything the modal used to (Code, Name, Role), not just the
// Access Menu checklist.
@Component({
  selector: 'app-location-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dealer-location-edit.html',
})
export class LocationEditPage implements OnInit {
  locationId!: number;
  location: LocationDetailModel | null = null;
  loading = true;
  saving = false;
  readonly SUBMENU_ID = 101;
  canEdit = false;
  editForm!: FormGroup;

  allRoles: BgRoleMappingModel[] = [];

  availableAreas: string[] = [];
  selectedArea = '';

  availableModules: string[] = [];
  modulesLoading = false;
  selectedModule = '';

  menuAccessData: LocationMenuAccessResponse | null = null;
  itemsLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private locationManagerService: LocationMasterService,
    private dealerService: DealerCreationManagerService,
    private bgRoleService: BgRoleService,
    private loader: LoaderService,
    private toaster: ToastService,
    private menuAccess: MenuAccessService
  ) {
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.editForm = this.fb.group({
      locCode: [''],
      locName: [''],
      roleId: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('locationId');
    this.locationId = Number(idParam);

    if (!idParam || Number.isNaN(this.locationId)) {
      this.toaster.show('Invalid location.', { classname: 'bg-danger text-white', delay: 5000 });
      this.goBack();
      return;
    }

    this.loadLocation();
    this.loadRoles();
    this.loadAvailableAreas();
  }

  private loadLocation(): void {
    this.loading = true;
    this.locationManagerService.getDetail(this.locationId).subscribe({
      next: (res) => {
        this.location = res;
        this.editForm.patchValue({
          locCode: res.locCode,
          locName: res.locName,
          roleId: res.roleId || ''
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toaster.show(err?.error?.message || 'Failed to load location.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  private loadRoles(): void {
    this.bgRoleService.getMappings().subscribe({
      next: (res: BgRoleMappingModel[]) => this.allRoles = res ?? [],
      error: (err) => console.error('Failed to fetch roles', err)
    });
  }

  private loadAvailableAreas(): void {
    this.dealerService.getAvailableAreas().subscribe({
      next: (areas) => this.availableAreas = areas ?? [],
      error: (err) => {
        console.error('Failed to load area list', err);
        this.toaster.show('Failed to load the area list.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  // Role changed - Area/Module/checklist were tied to the previous role's
  // grants, so they're no longer valid and must be reselected.
  onRoleChange(): void {
    this.selectedArea = '';
    this.availableModules = [];
    this.selectedModule = '';
    this.menuAccessData = null;
  }

  onAreaChange(): void {
    this.selectedModule = '';
    this.availableModules = [];
    this.menuAccessData = null;

    if (!this.selectedArea) return;

    this.modulesLoading = true;
    this.dealerService.getAvailableModules(this.selectedArea).subscribe({
      next: (modules) => {
        this.availableModules = modules ?? [];
        this.modulesLoading = false;
      },
      error: (err) => {
        this.modulesLoading = false;
        console.error('Failed to load module list', err);
        this.toaster.show('Failed to load the module list for this area.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  onModuleChange(): void {
    this.tryLoadMenuAccess();
  }

  private tryLoadMenuAccess(): void {
    const roleId = this.editForm.value.roleId;
    if (!roleId || !this.selectedArea || !this.selectedModule) {
      this.menuAccessData = null;
      return;
    }

    this.itemsLoading = true;
    this.locationManagerService.getMenuAccess(this.locationId, roleId, this.selectedModule, this.selectedArea).subscribe({
      next: (res) => {
        this.menuAccessData = res;
        this.itemsLoading = false;
      },
      error: (err) => {
        this.itemsLoading = false;
        this.toaster.show(err?.error?.message || 'Failed to load menu access.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  // Defensive: only ever show the selected Module's group, regardless of
  // what the API returns.
  get filteredGroups() {
    if (!this.menuAccessData || !this.selectedModule) return [];
    return this.menuAccessData.groups.filter(
      g => (g.topMenuName || '').trim().toLowerCase() === this.selectedModule.trim().toLowerCase()
    );
  }

  get allItems(): DealerMenuAccessItem[] {
    return this.filteredGroups.flatMap(g => g.items) ?? [];
  }

  get allGranted(): boolean {
    const items = this.allItems;
    return items.length > 0 && items.every(i => i.isGranted);
  }

  toggleAll(event: any): void {
    const checked = event.target.checked;
    this.allItems.forEach(i => i.isGranted = checked);
  }

  toggleItem(item: DealerMenuAccessItem): void {
    item.isGranted = !item.isGranted;
  }

  save(): void {
    const raw = this.editForm.value;
    if (!raw.locCode?.trim() || !raw.locName?.trim()) {
      this.toaster.show('Location Code and Location Name are required.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

    this.saving = true;
    this.loader.show();
    this.locationManagerService.updateDetail(this.locationId, {
      locCode: raw.locCode,
      locName: raw.locName,
      roleId: raw.roleId || undefined
    }).subscribe({
      next: () => {
        // If a Role + Area + Module checklist is currently loaded, save its
        // checkbox state too - one Save button covers both, same as the
        // old modal did.
        if (raw.roleId && this.selectedArea && this.selectedModule && this.menuAccessData) {
          const grantedSubMenuIds = this.allItems.filter(i => i.isGranted).map(i => i.subMenuId);

          this.locationManagerService.updateMenuAccess(
            this.locationId,
            raw.roleId,
            grantedSubMenuIds,
            this.selectedModule,
            this.selectedArea
          ).subscribe({
            next: () => this.finishSave(),
            error: (err) => {
              this.saving = false;
              this.loader.hide();
              this.toaster.show(err?.error?.message || 'Location saved, but menu access update failed.', { classname: 'bg-warning text-white', delay: 6000 });
            }
          });
        } else {
          this.finishSave();
        }
      },
      error: (err) => {
        this.saving = false;
        this.loader.hide();
        this.toaster.show(err?.error?.message || 'Failed to update location.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  private finishSave(): void {
    this.saving = false;
    this.loader.hide();
    this.toaster.show('Location updated.', { classname: 'bg-success text-white', delay: 5000 });
  }

  goBack(): void {
    if (window.history.length > 1 && window.opener) {
      window.close();
    } else {
      this.router.navigate(['/dealer-creation-manager']);
    }
  }
}