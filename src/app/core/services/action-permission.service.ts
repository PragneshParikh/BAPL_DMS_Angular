// src\app\core\services\action-permission.service.ts
// 27.11.2026 - one central place that applies Role Menu Rights to the ACTION buttons of every page.
//
// Why: many pages never checked MenuAccessService, so a user without Add / Edit / Delete / Print rights
// still saw those buttons. Instead of patching every page (and every future page), this service watches
// the screen and hides the action controls the current page's rights do not allow:
//
//   Create (2)   - "Add" / "New" / "Create" buttons and links to .../add   (list pages only)
//   Edit (4)     - "Edit" buttons, pencil icons                              (list pages only)
//   Delete (8)   - "Delete" buttons, bin icons                               (list pages only)
//   Download (16)- "Export" / "Excel" / "Download" / "Print" / "PDF" buttons (every page)
//
// The page is identified the same way AuthGuard does it: the route's data[0] (SubMenuId).
// SuperAdmin / Admin always see everything. Everyone else (Dealer, BG Employee, location logins)
// follows the rights saved at login (localStorage "menuRights", combined if a page has several rows).
//
// Entry pages (/add, /edit, ...addForm, /:id) are not touched for Add / Edit / Delete: there those words
// mean form rows (e.g. "Add complaint", "remove part"), and opening the page is already checked by AuthGuard.
//
// Per-button override in any template:  data-perm="add" | "edit" | "delete" | "print" | "none"
//   (data-perm="none" = never hide this button)
import { Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StorageService } from './storage';

const BIT = { add: 2, edit: 4, delete: 8, print: 16 } as const;
type Action = keyof typeof BIT;

@Injectable({ providedIn: 'root' })
export class ActionPermissionService {
  private started = false;
  private pending = false;
  private observer?: MutationObserver;

  /** layout areas that are never touched (top bar, side menu, footer) */
  private static readonly LAYOUT = '#page-topbar, app-topbar, app-sidebar, app-horizontal-topbar, app-two-column-sidebar, .app-menu, .navbar-menu, app-footer, .footer';
  private static readonly CANDIDATES = 'button, a.btn, a.dropdown-item, [role="button"]';

  constructor(private router: Router, private storage: StorageService, private zone: NgZone) { }

  /** call once (App component) */
  start(): void {
    if (this.started || typeof document === 'undefined') return;
    this.started = true;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.schedule());
    this.zone.runOutsideAngular(() => {
      // childList only: our own style changes do not trigger it again
      this.observer = new MutationObserver(() => this.schedule());
      this.observer.observe(document.body, { childList: true, subtree: true });
    });
    this.schedule();
  }

  private schedule(): void {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      try { this.apply(); } catch (e) { console.error('ActionPermissionService', e); }
    });
  }

  /** route data[0] of the deepest active route, like AuthGuard */
  private currentSubMenuId(): number | null {
    let r: any = this.router.routerState.snapshot.root;
    let id: number | null = null;
    while (r) {
      const v = r.data ? r.data[0] : undefined;
      if (v !== undefined && v !== null && v !== '') id = Number(v);
      r = r.firstChild;
    }
    return id;
  }

  private permission(): number {
    const role = (this.storage.getRole() || '').toLowerCase().trim();
    if (!role || role === 'superadmin' || role === 'admin') return 31;
    const id = this.currentSubMenuId();
    if (!id) return 31;                       // dashboard / pages without a SubMenuId
    const rights = this.storage.getMenuRights() || [];
    return rights
      .filter((r: any) => Number(r?.subMenuId) === id)
      .reduce((acc: number, r: any) => acc | (Number(r?.permission) || 0), 0);
  }

  private isEntryPage(): boolean {
    const url = (this.router.url || '').split('?')[0].toLowerCase();
    return /\/(add|edit|new|create)(\/|$)/.test(url) || /addform|editform|-add(\/|$)|-edit(\/|$)/.test(url) || /\/\d+(\/|$)/.test(url);
  }

  private classify(el: HTMLElement, entryPage: boolean): Action | null {
    const forced = (el.getAttribute('data-perm') || '').toLowerCase().trim();
    if (forced) return forced === 'none' ? null : (forced in BIT ? forced as Action : null);

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const hint = `${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('ngbtooltip') || ''}`.toLowerCase();
    const icons = (el.className + ' ' + Array.from(el.querySelectorAll('i, span[class*="ri-"], span[class*="mdi-"], span[class*="bx"]'))
      .map(i => (i as HTMLElement).className).join(' ')).toLowerCase();
    const link = (el.getAttribute('routerlink') || el.getAttribute('ng-reflect-router-link') || el.getAttribute('href') || '').toLowerCase();

    // Print / Export / Download - every page
    if (/\b(export|excel|download|print|pdf|csv)\b/.test(text) || /\b(export|excel|download|print|pdf)\b/.test(hint)
      || /(ri-file-excel|ri-printer|ri-download|mdi-printer|mdi-download|ri-file-pdf|bx-printer|bx-download|mdi-file-excel|mdi-file-pdf)/.test(icons)) {
      return 'print';
    }
    if (entryPage) return null;

    // inside a form / popup the words describe form rows, not the record
    const inForm = !!el.closest('form, .modal, .modal-content, [role="dialog"], ngb-modal-window');
    if (inForm) return null;

    if (/^(delete|remove)\b/.test(text) || /\bdelete\b/.test(hint) || /(ri-delete-bin|mdi-delete|bx-trash|fa-trash|ri-delete-back)/.test(icons)) return 'delete';
    if (/^edit\b/.test(text) || /^edit\b/.test(hint.trim()) || /(ri-pencil|ri-edit-|ri-edit2|mdi-pencil|bx-edit|mdi-square-edit|fa-edit|fa-pen)/.test(icons)) return 'edit';
    if (!el.closest('table')
      && (/^\+?\s*(add|create|new)\b/.test(text) || /(^|\/)add$/.test(link) || /(\bri-add-line\b|\bri-add-circle|\bmdi-plus\b|\bbx-plus\b)/.test(icons))) {
      return 'add';
    }
    return null;
  }

  private apply(): void {
    const perm = this.permission();
    const entryPage = this.isEntryPage();
    const nodes = document.querySelectorAll<HTMLElement>(ActionPermissionService.CANDIDATES);
    nodes.forEach(el => {
      if (el.closest(ActionPermissionService.LAYOUT)) return;
      const action = perm === 31 ? null : this.classify(el, entryPage);
      const allowed = !action || (perm & BIT[action]) === BIT[action];
      if (!allowed) {
        if (!el.hasAttribute('data-perm-hidden')) {
          el.setAttribute('data-perm-hidden', el.style.display || '');
          el.style.display = 'none';
        }
      } else if (el.hasAttribute('data-perm-hidden')) {
        el.style.display = el.getAttribute('data-perm-hidden') || '';
        el.removeAttribute('data-perm-hidden');
      }
    });
  }
}
