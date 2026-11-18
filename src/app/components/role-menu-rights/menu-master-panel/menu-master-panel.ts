// src\app\components\role-menu-rights\menu-master-panel\menu-master-panel.ts
// "Menus & Pages" tab of Role-wise Menu Rights: create / edit / delete MenuMaster rows
// (top-level menus and their pages) and choose which roles can open a page.
// Replaces the hand-written MenuMaster / RoleWiseMenuRights SQL scripts.
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuAdminRole, MenuAdminRow, MenuAdminSave, MenuMasterService } from '../../../core/services/menu-master.service';
import { RoleModel } from '../../../ViewModels/RoleModel';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';

export const RIGHTS = [
  { label: 'View', short: 'View', value: 1 },
  { label: 'Create/Add', short: 'Add', value: 2 },
  { label: 'Edit', short: 'Edit', value: 4 },
  { label: 'Delete', short: 'Delete', value: 8 },
  { label: 'Print', short: 'Print', value: 16 }
];
export const ALL_RIGHTS = 31;

export const MODULES = [
  { key: '', label: 'All modules' },
  { key: 'showroom', label: 'ShowRoom' },
  { key: 'workshop', label: 'WorkShop' },
  { key: 'account', label: 'Account' }
];

interface MenuForm {
  id: number | null;            // null = new
  menuName: string;
  parentMenuId: number | null;  // null = top-level menu
  pathName: string;
  moduleName: string;
  serialNo: number | null;
}

interface RoleRight extends MenuAdminRole { original: number; }

@Component({
  selector: 'app-menu-master-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-master-panel.html',
  styleUrl: './menu-master-panel.scss'
})
export class MenuMasterPanel implements OnInit {
  @Input() roles: RoleModel[] = [];
  /** Fired after any change, so the Role Rights tab can reload. */
  @Output() changed = new EventEmitter<void>();

  readonly rights = RIGHTS;
  readonly modules = MODULES;
  readonly allRights = ALL_RIGHTS;

  rows: MenuAdminRow[] = [];
  selectedMenuId: number | null = null;
  menuSearch = '';
  pageSearch = '';

  form: MenuForm | null = null;
  /** New page only: roles to give it, roleId -> permission */
  newPageRoles: { [roleId: string]: number } = {};
  saving = false;
  lastCreated: MenuAdminRow | null = null;

  rolesFor: MenuAdminRow | null = null;
  roleRights: RoleRight[] = [];
  roleSearch = '';

  constructor(private api: MenuMasterService, private toast: ToastService, private loader: LoaderService) {}

  ngOnInit(): void { this.load(); }

  // ---------------------------------------------------------------- data
  load(keepSelection = true): void {
    this.loader.show();
    this.api.getAll().subscribe({
      next: rows => {
        this.rows = rows ?? [];
        if (!keepSelection || !this.topMenus.some(m => m.id === this.selectedMenuId)) {
          this.selectedMenuId = this.topMenus[0]?.id ?? null;
        }
        this.loader.hide();
      },
      error: err => { this.loader.hide(); this.fail(err, 'Could not load menus.'); }
    });
  }

  get topMenus(): MenuAdminRow[] {
    return this.rows.filter(r => r.parentMenuId === null)
      .sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999) || a.menuName.localeCompare(b.menuName));
  }

  get filteredMenus(): MenuAdminRow[] {
    const q = this.menuSearch.trim().toLowerCase();
    if (!q) return this.topMenus;
    // a menu matches by its own name or by any of its pages
    return this.topMenus.filter(m => m.menuName.toLowerCase().includes(q)
      || this.pagesOf(m.id).some(p => `${p.menuName} ${p.pathName ?? ''}`.toLowerCase().includes(q)));
  }

  get selectedMenu(): MenuAdminRow | null {
    return this.rows.find(r => r.id === this.selectedMenuId) ?? null;
  }

  pagesOf(menuId: number | null): MenuAdminRow[] {
    return this.rows.filter(r => r.parentMenuId === menuId)
      .sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999) || a.menuName.localeCompare(b.menuName));
  }

  get pages(): MenuAdminRow[] {
    const q = (this.pageSearch || this.menuSearch).trim().toLowerCase();
    return this.pagesOf(this.selectedMenuId)
      .filter(p => !q || `${p.menuName} ${p.pathName ?? ''} ${p.moduleName ?? ''} ${p.id}`.toLowerCase().includes(q));
  }

  /** Pages whose parent no longer exists (cannot show in the sidebar). */
  get orphans(): MenuAdminRow[] {
    const ids = new Set(this.rows.map(r => r.id));
    return this.rows.filter(r => r.parentMenuId !== null && !ids.has(r.parentMenuId));
  }

  get orphanIds(): string { return this.orphans.map(o => o.id).join(', '); }

  selectMenu(m: MenuAdminRow): void {
    this.selectedMenuId = m.id;
    this.pageSearch = '';
    this.rolesFor = null;
  }

  moduleLabel(key: string | null | undefined): string {
    return this.modules.find(m => m.key === (key ?? '').toLowerCase())?.label ?? (key || 'All modules');
  }

  moduleClass(key: string | null | undefined): string {
    switch ((key ?? '').toLowerCase()) {
      case 'showroom': return 'mm-badge-showroom';
      case 'workshop': return 'mm-badge-workshop';
      case 'account': return 'mm-badge-account';
      default: return 'mm-badge-common';
    }
  }

  // ---------------------------------------------------------------- create / edit
  newMenu(): void {
    this.rolesFor = null;
    this.lastCreated = null;
    this.form = { id: null, menuName: '', parentMenuId: null, pathName: '', moduleName: '', serialNo: null };
  }

  newPage(): void {
    this.rolesFor = null;
    this.lastCreated = null;
    const parent = this.selectedMenu;
    this.form = { id: null, menuName: '', parentMenuId: parent?.id ?? null, pathName: '', moduleName: parent?.moduleName ?? '', serialNo: null };
    // SuperAdmin gets full rights on a new page by default
    this.newPageRoles = {};
    const sa = this.roles.find(r => (r.name ?? '').toLowerCase() === 'superadmin');
    if (sa?.id) this.newPageRoles[sa.id] = ALL_RIGHTS;
  }

  edit(r: MenuAdminRow): void {
    this.rolesFor = null;
    this.lastCreated = null;
    this.form = { id: r.id, menuName: r.menuName, parentMenuId: r.parentMenuId, pathName: r.pathName ?? '',
                  moduleName: (r.moduleName ?? '').toLowerCase(), serialNo: r.serialNo };
  }

  cancelForm(): void { this.form = null; }

  get isPageForm(): boolean { return !!this.form && this.form.parentMenuId !== null; }

  /** Parents a page can go under: top-level menus (never itself). */
  get parentOptions(): MenuAdminRow[] {
    return this.topMenus.filter(m => m.id !== this.form?.id);
  }

  /** Editing a menu that has pages: it must stay top-level. */
  get lockTopLevel(): boolean {
    return !!this.form?.id && this.rows.some(r => r.parentMenuId === this.form!.id);
  }

  onPathBlur(): void {
    if (!this.form) return;
    const p = this.form.pathName.trim();
    this.form.pathName = p && !p.startsWith('/') ? '/' + p : p;
  }

  toggleNewRole(roleId: string, level: number): void {
    if ((this.newPageRoles[roleId] ?? 0) === level) delete this.newPageRoles[roleId];
    else this.newPageRoles[roleId] = level;
  }

  get newRoleCount(): number { return Object.keys(this.newPageRoles).length; }

  saveForm(): void {
    const f = this.form;
    if (!f) return;
    if (!f.menuName.trim()) { this.warn('Enter a menu / page name.'); return; }
    if (f.parentMenuId !== null && !f.pathName.trim()) { this.warn('Enter the page path, e.g. /vehicle-sale-report.'); return; }

    const body: MenuAdminSave = {
      menuName: f.menuName.trim(),
      parentMenuId: f.parentMenuId,
      pathName: f.parentMenuId !== null ? f.pathName.trim() : null,
      moduleName: f.moduleName || null,
      serialNo: f.serialNo === null || (f.serialNo as any) === '' ? null : Number(f.serialNo)
    };
    if (f.id === null && f.parentMenuId !== null) {
      body.roles = Object.entries(this.newPageRoles).map(([roleId, permission]) => ({ roleId, permission }));
    }

    this.saving = true;
    const call = f.id === null ? this.api.create(body) : this.api.update(f.id, body);
    call.subscribe({
      next: res => {
        this.saving = false;
        this.ok(res?.message || 'Saved.');
        const saved = res?.data ?? null;
        this.lastCreated = f.id === null && saved?.parentMenuId !== null ? saved : null;
        this.form = null;
        if (saved) this.selectedMenuId = saved.parentMenuId ?? saved.id;
        this.load();
        this.changed.emit();
      },
      error: err => { this.saving = false; this.fail(err, 'Could not save.'); }
    });
  }

  remove(r: MenuAdminRow): void {
    const isMenu = r.parentMenuId === null;
    if (isMenu && r.childCount > 0) {
      this.warn(`"${r.menuName}" has ${r.childCount} page(s). Move or delete them first.`);
      return;
    }
    const msg = isMenu
      ? `Delete menu "${r.menuName}" (id ${r.id})?`
      : `Delete page "${r.menuName}" (id ${r.id})? ${r.roleCount} role(s) will lose access.`;
    if (!confirm(msg)) return;
    this.loader.show();
    this.api.delete(r.id).subscribe({
      next: res => {
        this.loader.hide();
        this.ok(res?.message || 'Deleted.');
        if (this.rolesFor?.id === r.id) this.rolesFor = null;
        this.load();
        this.changed.emit();
      },
      error: err => { this.loader.hide(); this.fail(err, 'Could not delete.'); }
    });
  }

  routeSnippet(r: MenuAdminRow): string {
    const path = (r.pathName ?? '').replace(/^\//, '');
    return `{ path: '${path}', component: YourComponent, data: [${r.id}] },`;
  }

  copy(text: string): void {
    navigator.clipboard?.writeText(text).then(() => this.ok('Copied.'));
  }

  // ---------------------------------------------------------------- roles of one page
  openRoles(r: MenuAdminRow): void {
    this.form = null;
    this.lastCreated = null;
    this.rolesFor = r;
    this.roleSearch = '';
    this.loader.show();
    this.api.getRoles(r.id).subscribe({
      next: list => {
        this.roleRights = (list ?? []).map(x => ({ ...x, permission: Number(x.permission) || 0, original: Number(x.permission) || 0 }));
        this.loader.hide();
      },
      error: err => { this.loader.hide(); this.rolesFor = null; this.fail(err, 'Could not load roles.'); }
    });
  }

  get visibleRoleRights(): RoleRight[] {
    const q = this.roleSearch.trim().toLowerCase();
    return this.roleRights.filter(r => !q || (r.roleName ?? '').toLowerCase().includes(q));
  }

  has(r: { permission: number }, bit: number): boolean { return (r.permission & bit) === bit; }

  toggleBit(r: RoleRight, bit: number): void {
    if (this.has(r, bit)) r.permission = bit === 1 ? 0 : r.permission & ~bit;
    else r.permission = r.permission | bit | 1;
  }

  toggleAll(r: RoleRight): void { r.permission = r.permission === ALL_RIGHTS ? 0 : ALL_RIGHTS; }

  get roleChanges(): number { return this.roleRights.filter(r => r.permission !== r.original).length; }

  saveRoles(): void {
    if (!this.rolesFor) return;
    const changed = this.roleRights.filter(r => r.permission !== r.original)
      .map(r => ({ roleId: r.roleId, permission: r.permission }));
    if (!changed.length) { this.warn('No changes to save.'); return; }
    this.saving = true;
    const id = this.rolesFor.id;
    this.api.saveRoles(id, changed).subscribe({
      next: res => {
        this.saving = false;
        this.ok(res?.message || 'Roles saved.');
        this.roleRights.forEach(r => (r.original = r.permission));
        this.load();
        this.changed.emit();
      },
      error: err => { this.saving = false; this.fail(err, 'Could not save roles.'); }
    });
  }

  // ---------------------------------------------------------------- toasts
  private ok(msg: string): void { this.toast.show(msg, { classname: 'bg-success text-white', delay: 3000 }); }
  private warn(msg: string): void { this.toast.show(msg, { classname: 'bg-warning text-dark', delay: 4000 }); }
  private fail(err: HttpErrorResponse, fallback: string): void {
    console.error(err);
    const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : '') || fallback;
    this.toast.show(msg, { classname: 'bg-danger text-white', delay: 6000 });
  }

  trackRow = (_: number, r: MenuAdminRow) => r.id;
}
