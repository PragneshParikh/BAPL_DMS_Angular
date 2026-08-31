import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuRightService } from '../../core/services/menu-right.service';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';

const PERMISSION_BITS = [
  { label: 'View', value: 1 },
  { label: 'Create/Add', value: 2 },   // CHANGED from 'Create'
  { label: 'Edit', value: 4 },
  { label: 'Delete', value: 8 },
  { label: 'Print', value: 16 }         // CHANGED from 'Download'
];

@Component({
  selector: 'app-menu-right',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-right.html',
  styleUrl: './menu-right.scss'
})
export class MenuRight implements OnInit {
  dealers: any[] = [];
  selectedDealerCode: string = '';

  allMenuGroups: any[] = [];      // full tree exactly as returned by API
  menuGroups: any[] = [];         // what's actually rendered (filtered or full)

  showAssignedOnly: boolean = false;  // ADDED — toggle between "grant access" and "review access" views

  permissionBits = PERMISSION_BITS;
  loading = false;

  constructor(
    private menuRightService: MenuRightService,
    private toast: ToastService,
    private loader: LoaderService
  ) {}

  ngOnInit() {
    this.loadDealers();
  }

  loadDealers() {
    this.loader.show();
    this.menuRightService.getDealers().subscribe({
      next: (res) => {
        this.dealers = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load dealers.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onDealerChange() {
    if (!this.selectedDealerCode) {
      this.allMenuGroups = [];
      this.menuGroups = [];
      return;
    }

    this.loader.show();
    this.menuRightService.getMenuRights(this.selectedDealerCode).subscribe({
      next: (res) => {
        this.allMenuGroups = res;
        this.applyViewFilter();
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to load menu rights.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  // ADDED — re-derives menuGroups from allMenuGroups based on the toggle.
  // "Assigned Only" keeps a parent group only if at least one of its
  // sub-menus currently has a non-zero permission, and within that group
  // keeps only the sub-menus that are actually granted — so the admin sees
  // exactly what this dealer can currently access, with nothing extra.
  applyViewFilter() {
    if (!this.showAssignedOnly) {
      this.menuGroups = this.allMenuGroups;
      return;
    }

    this.menuGroups = this.allMenuGroups
      .map(group => ({
        ...group,
        subMenus: group.subMenus.filter((sub: any) => sub.permission > 0)
      }))
      .filter(group => group.subMenus.length > 0);
  }

  // ADDED — called from the template when the toggle switch changes
  onToggleView() {
    this.applyViewFilter();
  }

  hasPermission(subMenu: any, bit: number): boolean {
    return (subMenu.permission & bit) === bit;
  }

  togglePermission(subMenu: any, bit: number) {
    if (this.hasPermission(subMenu, bit)) {
      subMenu.permission &= ~bit;
    } else {
      subMenu.permission |= bit;
    }
  }

  save() {
    if (!this.selectedDealerCode) {
      this.toast.show('Please select a dealer first.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    // IMPORTANT — always save from allMenuGroups, not the filtered
    // menuGroups. If "Assigned Only" is on and admin unticks a permission
    // down to 0, that sub-menu would vanish from the filtered view before
    // save — but the underlying allMenuGroups object still holds the
    // updated (now-zero) permission correctly, since both arrays reference
    // the same underlying sub-menu objects (filter() doesn't clone them).
    const rights: any[] = [];
    this.allMenuGroups.forEach(group => {
      group.subMenus.forEach((sub: any) => {
        rights.push({
          menuId: group.menuId,
          subMenuId: sub.subMenuId,
          permission: sub.permission
        });
      });
    });

    const payload = {
      dealerCode: this.selectedDealerCode,
      rights: rights
    };

    this.loader.show();
    this.menuRightService.saveMenuRights(payload).subscribe({
      next: (res) => {
        this.loader.hide();
        if (res.success) {
          this.toast.show(res.message, { classname: 'bg-success text-white', delay: 3000 });
          this.applyViewFilter();   // refresh the assigned-only view if a permission just dropped to 0
        } else {
          this.toast.show(res.message, { classname: 'bg-warning text-dark', delay: 5000 });
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to save menu rights.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }
  // Sum of every permission bit — used to check/set "fully selected" state
  get allBitsMask(): number {
    return this.permissionBits.reduce((mask, bit) => mask | bit.value, 0);
  }

  // ===== Row-level select all =====
  isRowFullySelected(subMenu: any): boolean {
    return (subMenu.permission & this.allBitsMask) === this.allBitsMask;
  }

  toggleRow(subMenu: any) {
    if (this.isRowFullySelected(subMenu)) {
      subMenu.permission = 0;
    } else {
      subMenu.permission = this.allBitsMask;
    }
  }

  // ===== Column-level select all =====
  isColumnFullySelected(bit: number): boolean {
    // "fully selected" only if there's at least one row, and every visible
    // row currently has this bit set — an empty menuGroups (e.g. filtered
    // to nothing) should read as unchecked, not checked-by-default
    const allSubMenus = this.menuGroups.flatMap(g => g.subMenus);
    if (allSubMenus.length === 0) return false;

    return allSubMenus.every((sub: any) => this.hasPermission(sub, bit));
  }

  toggleColumn(bit: number) {
    const shouldSelect = !this.isColumnFullySelected(bit);
    const allSubMenus = this.menuGroups.flatMap(g => g.subMenus);

    allSubMenus.forEach((sub: any) => {
      if (shouldSelect) {
        sub.permission |= bit;
      } else {
        sub.permission &= ~bit;
      }
    });
  }
}