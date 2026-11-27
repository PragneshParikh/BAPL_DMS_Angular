// src\app\components\role-menu-rights\role-menu-rights.ts
// Role-wise Menu Rights - two tabs:
//   Role Rights    : tick what a role can do on every page (RoleWiseMenuRights)
//   Menus & Pages  : create / edit / delete menus and pages (MenuMaster) and pick roles per page
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../core/services/Deptrole';
import { RoleModel } from '../../ViewModels/RoleModel';
import {
  RoleEmployee, RoleMenuGroup, RoleMenuRightsService, RoleSubMenuRight
} from '../../core/services/role-menu-rights.service';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { MenuMasterPanel } from './menu-master-panel/menu-master-panel';

export const PERM = { View: 1, Create: 2, Edit: 4, Delete: 8, Print: 16 } as const;

const PERMISSION_BITS = [
  { label: 'View', value: PERM.View },
  { label: 'Create/Add', value: PERM.Create },
  { label: 'Edit', value: PERM.Edit },
  { label: 'Delete', value: PERM.Delete },
  { label: 'Print', value: PERM.Print }
];

type ModuleFilter = 'all' | 'showroom' | 'workshop' | 'account' | 'common';

interface ViewGroup extends RoleMenuGroup {
  expanded: boolean;
  visibleSubs: RoleSubMenuRight[];
}

@Component({
  selector: 'app-role-menu-rights',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, MenuMasterPanel],
  templateUrl: './role-menu-rights.html',
  styleUrl: './role-menu-rights.scss'
})
export class RoleMenuRights implements OnInit {
  tab: 'rights' | 'menus' = 'rights';
  roles: RoleModel[] = [];
  selectedRoleId = '';
  copyFromRoleId = '';

  // 27.11.2026 employee-wise rights: employees of the selected role (BG Employee Master)
  roleEmployees: RoleEmployee[] = [];
  /** 27.11.2026 several employees can be ticked - the same rights are saved for all of them */
  selectedEmployeeIds: number[] = [];
  employeeHasOwnRights = false;
  employeeTableReady = true;
  employeeSearch = '';

  groups: ViewGroup[] = [];              // full tree for the selected role
  private original = new Map<number, number>(); // subMenuId -> permission as loaded

  permissionBits = PERMISSION_BITS;
  readonly allBits = PERMISSION_BITS.reduce((m, b) => m | b.value, 0); // 31

  search = '';
  moduleFilter: ModuleFilter = 'all';
  assignedOnly = false;
  readonly moduleOptions: { key: ModuleFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'showroom', label: 'ShowRoom' },
    { key: 'workshop', label: 'WorkShop' },
    { key: 'account', label: 'Account' },
    { key: 'common', label: 'Common' }
  ];

  constructor(
    private roleService: RoleService,
    private rightsService: RoleMenuRightsService,
    private toast: ToastService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.loader.show();
    this.roleService.getRoles().subscribe({
      next: roles => {
        this.roles = (roles || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        this.loader.hide();
      },
      error: err => {
        this.loader.hide();
        console.error(err);
        this.toastError('Failed to load roles.');
      }
    });
  }

  // ---------------------------------------------------------------- loading
  onRoleChange(): void {
    if (this.isDirty && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    this.copyFromRoleId = '';
    this.selectedEmployeeIds = [];
    this.employeeHasOwnRights = false;
    this.roleEmployees = [];
    if (!this.selectedRoleId) {
      this.groups = [];
      this.original.clear();
      return;
    }
    this.loadMatrix(this.selectedRoleId, true);
    this.loadRoleEmployees();
  }

  // ---------------------------------------------------------------- employees (27.11.2026)
  private loadRoleEmployees(): void {
    const roleId = this.selectedRoleId;
    this.rightsService.getRoleEmployees(roleId).subscribe({
      next: res => {
        if (roleId !== this.selectedRoleId) return;
        this.roleEmployees = res?.data || [];
        this.employeeTableReady = res?.tableReady !== false;
      },
      error: () => (this.roleEmployees = [])
    });
  }

  get filteredEmployees(): RoleEmployee[] {
    const q = this.employeeSearch.trim().toLowerCase();
    return !q ? this.roleEmployees
      : this.roleEmployees.filter(e => `${e.name} ${e.employeeCode || ''} ${e.email || ''}`.toLowerCase().includes(q));
  }

  get selectedEmployees(): RoleEmployee[] {
    return this.selectedEmployeeIds
      .map(id => this.roleEmployees.find(e => e.employeeId === id))
      .filter((e): e is RoleEmployee => !!e);
  }

  /** first ticked employee - the grid shows his rights */
  get selectedEmployee(): RoleEmployee | undefined {
    return this.selectedEmployees[0];
  }

  get employeePickerLabel(): string {
    const list = this.selectedEmployees;
    if (!list.length) return 'Role rights (all employees)';
    if (list.length === 1) return `${list[0].name} (${list[0].employeeCode || ''})`;
    return `${list.length} employees selected`;
  }

  isEmpSelected(id: number): boolean {
    return this.selectedEmployeeIds.includes(id);
  }

  get allFilteredEmpsSelected(): boolean {
    const f = this.filteredEmployees;
    return f.length > 0 && f.every(e => this.isEmpSelected(e.employeeId));
  }

  toggleEmp(id: number): void {
    const next = this.isEmpSelected(id)
      ? this.selectedEmployeeIds.filter(x => x !== id)
      : [...this.selectedEmployeeIds, id];
    this.setEmployeeSelection(next);
  }

  toggleAllEmps(): void {
    const ids = this.filteredEmployees.map(e => e.employeeId);
    const next = this.allFilteredEmpsSelected
      ? this.selectedEmployeeIds.filter(id => !ids.includes(id))
      : Array.from(new Set([...this.selectedEmployeeIds, ...ids]));
    this.setEmployeeSelection(next);
  }

  clearEmps(): void {
    this.setEmployeeSelection([]);
  }

  /** The grid shows the role rights (nobody ticked) or the first ticked employee's rights. */
  private setEmployeeSelection(next: number[]): void {
    const firstBefore = this.selectedEmployeeIds[0] ?? null;
    const firstAfter = next[0] ?? null;
    if (firstBefore !== firstAfter && this.isDirty && !confirm('You have unsaved changes. Discard them?')) return;
    this.selectedEmployeeIds = next;
    if (firstBefore === firstAfter) return;          // same rights shown - keep the grid (and any ticks)
    this.employeeHasOwnRights = false;
    if (firstAfter == null) this.loadMatrix(this.selectedRoleId, true);
    else this.loadEmployeeMatrix(firstAfter);
  }

  private loadEmployeeMatrix(id: number): void {
    this.loader.show();
    this.rightsService.getEmployeeMatrix(id, this.selectedRoleId).subscribe({
      next: res => {
        this.groups = this.normalise(res?.groups || []);
        this.original = new Map(this.allSubs().map(s => [s.subMenuId, s.permission]));
        this.employeeHasOwnRights = !!res?.hasOwnRights;
        this.employeeTableReady = res?.tableReady !== false;
        this.applyFilters();
        this.loader.hide();
      },
      error: err => {
        this.loader.hide();
        console.error(err);
        this.toastError(err?.error?.message || 'Failed to load the employee rights.');
      }
    });
  }

  /** Remove the own rights of the ticked employees - they get the role rights again. */
  resetEmployeeToRole(): void {
    const emps = this.selectedEmployees.filter(e => e.hasOwnRights);
    if (!emps.length) return;
    const names = emps.length === 1 ? emps[0].name : `${emps.length} employees`;
    if (!confirm(`Remove the own rights of ${names}? They will get the rights of role "${this.selectedRoleName}" again.`)) return;
    this.loader.show();
    forkJoin(emps.map(e => this.rightsService.resetEmployeeToRole(e.employeeId))).subscribe({
      next: () => {
        this.loader.hide();
        emps.forEach(e => (e.hasOwnRights = false));
        this.toast.show(`${names} now use the role rights.`, { classname: 'bg-success text-white', delay: 3000 });
        if (this.selectedEmployee) this.loadEmployeeMatrix(this.selectedEmployee.employeeId);
      },
      error: err => {
        this.loader.hide();
        this.toastError(err?.error?.message || 'Failed to reset the employee rights.');
      }
    });
  }

  get selectedWithOwnRights(): number {
    return this.selectedEmployees.filter(e => e.hasOwnRights).length;
  }

  private loadMatrix(roleId: string, asBaseline: boolean): void {
    this.loader.show();
    this.rightsService.getMatrix(roleId).subscribe({
      next: res => {
        const incoming = this.normalise(res || []);
        if (asBaseline) {
          this.groups = incoming;
          this.original = new Map(this.allSubs().map(s => [s.subMenuId, s.permission]));
        } else {
          // Copy-from: apply the other role's permissions onto the current tree
          const src = new Map(incoming.flatMap(g => g.subMenus).map(s => [s.subMenuId, s.permission]));
          this.allSubs().forEach(s => (s.permission = src.get(s.subMenuId) ?? 0));
          this.toast.show('Rights copied. Review and click Save to apply.', { classname: 'bg-info text-white', delay: 4000 });
        }
        this.applyFilters();
        this.loader.hide();
      },
      error: err => {
        this.loader.hide();
        console.error(err);
        this.toastError('Failed to load menu rights for the role.');
      }
    });
  }

  copyFromRole(): void {
    if (!this.selectedRoleId || !this.copyFromRoleId) return;
    if (this.copyFromRoleId === this.selectedRoleId) {
      this.toast.show('Choose a different role to copy from.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }
    this.loadMatrix(this.copyFromRoleId, false);
  }

  private normalise(res: RoleMenuGroup[]): ViewGroup[] {
    return res
      .map(g => ({
        ...g,
        subMenus: (g.subMenus || [])
          .map(s => ({ ...s, permission: Number(s.permission) || 0 }))
          .sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0)),
        expanded: true,
        visibleSubs: [] as RoleSubMenuRight[]
      }))
      .sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0));
  }

  // ---------------------------------------------------------------- filters
  applyFilters(): void {
    const q = this.search.trim().toLowerCase();
    this.groups.forEach(g => {
      g.visibleSubs = g.subMenus.filter(s => {
        if (this.assignedOnly && s.permission === 0) return false;
        if (this.moduleFilter !== 'all' && this.moduleKey(s.moduleName) !== this.moduleFilter) return false;
        if (q && !(`${s.menuName} ${s.pathName ?? ''} ${g.menuName}`.toLowerCase().includes(q))) return false;
        return true;
      });
    });
  }

  /** Menus tab changed MenuMaster / rights: refresh the open role (unless the user has unsaved ticks). */
  onMenusChanged(): void {
    if (this.selectedRoleId && !this.isDirty) this.loadMatrix(this.selectedRoleId, true);
  }

  setTab(t: 'rights' | 'menus'): void {
    if (t === 'menus' && this.isDirty && !confirm('You have unsaved rights for this role. Leave them unsaved and open Menus & Pages?')) return;
    this.tab = t;
  }

  setModule(key: ModuleFilter): void {
    this.moduleFilter = key;
    this.applyFilters();
  }

  /** 'ShowRoom', 'show room', '' / null -> 'showroom' / 'common' */
  moduleKey(value?: string | null): ModuleFilter {
    const k = (value ?? '').toString().toLowerCase().replace(/[\s_-]/g, '');
    if (!k) return 'common';
    if (k === 'accounts') return 'account';
    return (['showroom', 'workshop', 'account'].includes(k) ? k : 'common') as ModuleFilter;
  }

  get visibleGroups(): ViewGroup[] {
    return this.groups.filter(g => g.visibleSubs.length > 0);
  }

  // ---------------------------------------------------------------- toggles
  has(s: RoleSubMenuRight, bit: number): boolean {
    return (s.permission & bit) === bit;
  }

  /**
   * Any action right implies View - a page the user cannot open is useless.
   * Removing View removes every right on that row.
   */
  toggle(s: RoleSubMenuRight, bit: number): void {
    if (this.has(s, bit)) {
      s.permission = bit === PERM.View ? 0 : s.permission & ~bit;
    } else {
      s.permission = s.permission | bit | PERM.View;
    }
    if (this.assignedOnly) this.applyFilters();
  }

  isRowFull(s: RoleSubMenuRight): boolean {
    return (s.permission & this.allBits) === this.allBits;
  }

  toggleRow(s: RoleSubMenuRight): void {
    s.permission = this.isRowFull(s) ? 0 : this.allBits;
    if (this.assignedOnly) this.applyFilters();
  }

  isGroupFull(g: ViewGroup): boolean {
    return g.visibleSubs.length > 0 && g.visibleSubs.every(s => this.isRowFull(s));
  }

  toggleGroup(g: ViewGroup): void {
    const full = this.isGroupFull(g);
    g.visibleSubs.forEach(s => (s.permission = full ? 0 : this.allBits));
    if (this.assignedOnly) this.applyFilters();
  }

  isColumnFull(bit: number): boolean {
    const subs = this.visibleSubs();
    return subs.length > 0 && subs.every(s => this.has(s, bit));
  }

  toggleColumn(bit: number): void {
    const select = !this.isColumnFull(bit);
    this.visibleSubs().forEach(s => {
      if (select) {
        s.permission = s.permission | bit | PERM.View;
      } else {
        s.permission = bit === PERM.View ? 0 : s.permission & ~bit;
      }
    });
    if (this.assignedOnly) this.applyFilters();
  }

  expandAll(state: boolean): void {
    this.groups.forEach(g => (g.expanded = state));
  }

  // ---------------------------------------------------------------- summary
  private allSubs(): RoleSubMenuRight[] {
    return this.groups.flatMap(g => g.subMenus);
  }

  private visibleSubs(): RoleSubMenuRight[] {
    return this.visibleGroups.flatMap(g => g.visibleSubs);
  }

  get totalPages(): number { return this.allSubs().length; }
  get assignedPages(): number { return this.allSubs().filter(s => s.permission > 0).length; }
  get fullAccessPages(): number { return this.allSubs().filter(s => this.isRowFull(s)).length; }
  get viewOnlyPages(): number { return this.allSubs().filter(s => s.permission === PERM.View).length; }
  get changedCount(): number {
    return this.allSubs().filter(s => (this.original.get(s.subMenuId) ?? 0) !== s.permission).length;
  }
  get isDirty(): boolean { return this.changedCount > 0; }

  isChanged(s: RoleSubMenuRight): boolean {
    return (this.original.get(s.subMenuId) ?? 0) !== s.permission;
  }

  assignedInGroup(g: ViewGroup): number {
    return g.subMenus.filter(s => s.permission > 0).length;
  }

  get selectedRoleName(): string {
    return this.roles.find(r => r.id === this.selectedRoleId)?.name ?? '';
  }

  // ---------------------------------------------------------------- actions
  reset(): void {
    this.allSubs().forEach(s => (s.permission = this.original.get(s.subMenuId) ?? 0));
    this.applyFilters();
  }

  save(): void {
    if (!this.selectedRoleId) {
      this.toast.show('Please select a role first.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }
    if (!this.isDirty) {
      this.toast.show('No changes to save.', { classname: 'bg-info text-white', delay: 2500 });
      return;
    }

    const rights = this.groups.flatMap(g =>
      g.subMenus.map(s => ({ menuId: g.menuId, subMenuId: s.subMenuId, permission: s.permission }))
    );

    // 27.11.2026 employee(s) ticked -> save the same own rights for each of them (role rights stay unchanged)
    if (this.selectedEmployeeIds.length) {
      const emps = this.selectedEmployees;
      if (emps.length > 1 && !confirm(`Save these rights for all ${emps.length} selected employees?`)) return;
      this.loader.show();
      this.rightsService.saveEmployees(this.selectedEmployeeIds, rights).subscribe({
        next: res => {
          this.loader.hide();
          if (res?.success) {
            this.toast.show(res.message || 'Employee rights saved.', { classname: 'bg-success text-white', delay: 3500 });
            emps.forEach(e => (e.hasOwnRights = true));
            this.loadEmployeeMatrix(this.selectedEmployeeIds[0]);
          } else {
            this.toast.show(res?.message || 'Save failed.', { classname: 'bg-warning text-dark', delay: 5000 });
          }
        },
        error: err => {
          this.loader.hide();
          console.error(err);
          this.toastError(err?.error?.message || 'Failed to save the employee rights.');
        }
      });
      return;
    }

    this.loader.show();
    this.rightsService.save({ roleId: this.selectedRoleId, rights }).subscribe({
      next: res => {
        this.loader.hide();
        if (res?.success) {
          this.original = new Map(this.allSubs().map(s => [s.subMenuId, s.permission]));
          this.applyFilters();
          this.toast.show(res.message || 'Menu rights saved.', { classname: 'bg-success text-white', delay: 3000 });
          // Re-read from the database so the screen shows exactly what was stored.
          this.loadMatrix(this.selectedRoleId, true);
        } else {
          this.toast.show(res?.message || 'Save failed.', { classname: 'bg-warning text-dark', delay: 5000 });
        }
      },
      error: err => {
        this.loader.hide();
        console.error(err);
        const msg = err?.status === 0 ? 'API not reachable.'
          : err?.status === 401 ? 'Session expired. Please log in again.'
          : (err?.error?.message || 'Failed to save menu rights.');
        this.toastError(msg);
      }
    });
  }

  private toastError(msg: string): void {
    this.toast.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
  }

  trackGroup = (_: number, g: ViewGroup) => g.menuId;
  trackSub = (_: number, s: RoleSubMenuRight) => s.subMenuId;
}
