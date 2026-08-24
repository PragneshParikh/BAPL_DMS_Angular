import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DealerCreationManagerService } from '../../../core/services/dealer-creation-manager';
import { BgRoleService } from '../../../core/services/bg-role';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { DealerListModel } from '../../../ViewModels/models/DealerListModel';
import { BgRoleMappingModel } from '../../../ViewModels/models/BgRoleMappingModel';
import { DealerMenuAccessResponse, DealerMenuAccessItem } from '../../../ViewModels/models/DealerMenuAccessModel';

// Final hierarchy: Select Role -> Select Area -> Show Area-wise Module.
// Module is intentionally NOT loaded on init - it depends entirely on which
// Area was picked (onAreaChange() below fetches only the modules that
// actually contain forms under that Area).
@Component({
  selector: 'app-dealer-menu-access-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-menu-access-page.html',
})
export class DealerMenuAccessPage implements OnInit {
  dealerId!: number;
  dealer: DealerListModel | null = null;
  dealerLoading = true;

  allRoles: BgRoleMappingModel[] = [];
  selectedRoleId = '';

  // Step 2 — Area (ShowRoom / WorkShop / Account)
  availableAreas: string[] = [];
  selectedArea = '';

  // Step 3 — Module, scoped to the selected Area ("Area-wise Module")
  availableModules: string[] = [];
  modulesLoading = false;
  selectedModule = '';

  menuAccessData: DealerMenuAccessResponse | null = null;
  itemsLoading = false;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dealerService: DealerCreationManagerService,
    private bgRoleService: BgRoleService,
    private loader: LoaderService,
    private toaster: ToastService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('dealerId');
    this.dealerId = Number(idParam);

    if (!idParam || Number.isNaN(this.dealerId)) {
      this.toaster.show('Invalid dealer.', { classname: 'bg-danger text-white', delay: 5000 });
      this.goBack();
      return;
    }

    this.loadDealer();
    this.loadRoles();
    this.loadAvailableAreas();
  }

  private loadDealer(): void {
    this.dealerLoading = true;
    this.dealerService.getById(this.dealerId).subscribe({
      next: (res) => {
        this.dealer = res;
        this.selectedRoleId = res.roleId || '';
        this.dealerLoading = false;
      },
      error: (err) => {
        this.dealerLoading = false;
        this.toaster.show(err?.error?.message || 'Failed to load dealer.', { classname: 'bg-danger text-white', delay: 5000 });
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

  // Role change alone just re-fetches the item list (if Area+Module are
  // already chosen) — it doesn't affect which Areas/Modules are available.
  onRoleChange(): void {
    this.tryLoadMenuAccess();
  }

  // Step 2 -> Step 3: picking an Area resets Module and fetches the
  // Area-wise Module list. Any previously loaded item checklist is cleared
  // since it belonged to a different Area's Module.
  onAreaChange(): void {
    this.selectedModule = '';
    this.availableModules = [];
    this.menuAccessData = null;

    if (!this.selectedArea) {
      return;
    }

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
    if (!this.selectedRoleId || !this.selectedArea || !this.selectedModule) {
      this.menuAccessData = null;
      return;
    }

    this.itemsLoading = true;
    this.dealerService.getMenuAccess(this.dealerId, this.selectedRoleId, this.selectedModule, this.selectedArea).subscribe({
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

  get allItems(): DealerMenuAccessItem[] {
    return this.menuAccessData?.groups?.flatMap(g => g.items) ?? [];
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
    if (!this.selectedRoleId || !this.selectedArea || !this.selectedModule || !this.menuAccessData) return;

    const grantedSubMenuIds = this.allItems
      .filter(i => i.isGranted)
      .map(i => i.subMenuId);

    this.saving = true;
    this.loader.show();
    this.dealerService.updateMenuAccess(
      this.dealerId,
      this.selectedRoleId,
      grantedSubMenuIds,
      this.selectedModule,
      this.selectedArea
    ).subscribe({
      next: () => {
        this.saving = false;
        this.loader.hide();
        this.toaster.show('Menu access updated.', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.saving = false;
        this.loader.hide();
        this.toaster.show(err?.error?.message || 'Failed to update menu access.', { classname: 'bg-warning text-white', delay: 5000 });
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1 && window.opener) {
      window.close();
    } else {
      this.router.navigate(['/dealer-creation-manager']);
    }
  }
}