//BAPL_DMS_Angular\src\app\layouts\topbar\topbar.component.ts
import { Component, OnInit, EventEmitter, Output, Inject, ViewChild, TemplateRef, DOCUMENT, inject } from '@angular/core';

//Logout
import { AuthenticationService } from '../../core/services/auth.service';
import { NavigationEnd, Router } from '@angular/router';

// Language
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbDropdownModule, NgbModal, NgbNavModule, NgbAccordionItem } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SimplebarAngularModule } from 'simplebar-angular';
import { MenuService } from '../../core/services/menu-service';
import { saleInvoice } from './data';
import { filter, map, Observable, of } from 'rxjs';
import { LoaderService } from '../../core/services/loader';
import { InvoiceDetail } from '../../dialogs/invoice-detail/invoice-detail';
import { StorageService } from '../../core/services/storage';
import { LotInspectionService } from '../../core/services/lotinspectionservice';
import { ToastService } from '../../shared/toaster/toast-service';
import { VehicleInwardService } from '../../core/services/vehicle-inwardservice';
import { PartsInwardService } from '../../core/services/partsinwardservice';
import { PartInward } from '../../components/part-inward/part-inward';
import { NotificationService } from '../../core/services/notification-service';
import { LocalPartsService, formatPartsD2DBillNo } from '../../core/services/local-parts.service';
import { DealerService } from '../../core/services/dealer-service';
/** One page the topbar search can open. */
interface SearchHit { key: string; id: number | null; label: string; link: string; module: string | null; parent: string | null; }

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  imports: [
    CommonModule,
    NgbNavModule,
    FormsModule,
    ReactiveFormsModule,
    SimplebarAngularModule,
    NgbDropdownModule],
  standalone: true
})
export class TopbarComponent implements OnInit {
  partsInward: any[] = [];
  vehicleInward: any[] = [];
  d2dNotificationList: any[] = [];
  partsD2DNotifications: any[] = [];
  invoiceNotifications: any[] = [];
  partsNotifications: any[] = [];
  ebwNotifications: any[] = [];
  saleInvoice: any[] = [];
  element: any;
  mode: string | undefined;
  @Output() mobileMenuButtonClicked = new EventEmitter();
  flagvalue: any;
  valueset: any;
  countryName: any;
  cookieValue: any;
  userData: any;
  total = 0;
  totalNotify: number = 0;
  newNotify: number = 0;
  readNotify: number = 0;
  isDropdownOpen = false;
  lastLoginDate$: Observable<string>;
  @ViewChild('removenotification') removenotification !: TemplateRef<any>;
  notifyId: any;
  unReadInwards: number = 0;
  public selectedOption: string = 'ShowRoom';
  dealerCode: string = '';

  menuList: any[] = [];
  searchResults: SearchHit[] = [];
  searchTerm = '';
  searchOpen = false;
  searchLoading = false;
  searchMore = false;
  activeIndex = -1;
  private static readonly MAX_SEARCH_RESULTS = 15;

  constructor(
    @Inject(DOCUMENT) private document: any,
    public languageService: LanguageService,
    private modalService: NgbModal,
    public _cookiesService: CookieService,
    public translate: TranslateService,
    private authService: AuthenticationService,
    private router: Router,
    private menuService: MenuService,
    private vehicleInwardService: VehicleInwardService,
    private loader: LoaderService,
    private storageService: StorageService,
    private lotInspectionService: LotInspectionService,
    private toastService: ToastService,
    private partInwardService: PartsInwardService,
    private notificationService: NotificationService,
    private localPartsService: LocalPartsService
  ) { }

  // ---------- 27.11.2026 "Mapped Dealers" popup (profile menu) ----------
  private dealerService = inject(DealerService);
  mappedDealersOpen = false;
  mappedDealersLoading = false;
  mappedDealerSearch = '';
  private dealerNames = new Map<string, string>();

  openMappedDealers(): void {
    this.mappedDealersOpen = true;
    this.mappedDealerSearch = '';
    if (this.dealerNames.size) return;
    this.mappedDealersLoading = true;
    // the API only returns this user's own (mapped) dealers
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        (res?.data || []).forEach((d: any) => this.dealerNames.set((d.dealerCode || '').toString().trim(), d.dealerName || ''));
        this.mappedDealersLoading = false;
      },
      error: () => (this.mappedDealersLoading = false)
    });
  }

  goDashboard(): void {
    this.router.navigate(['/']);
  }

  closeMappedDealers(): void {
    this.mappedDealersOpen = false;
  }

  get mappedDealerRows(): { code: string; name: string }[] {
    const q = this.mappedDealerSearch.trim().toLowerCase();
    return this.profileCodes
      .map(code => ({ code, name: this.dealerNames.get(code) || '' }))
      .filter(r => !q || `${r.code} ${r.name}`.toLowerCase().includes(q));
  }

  // ---------- 26.11.2026 profile display (BG employees carry a comma list of dealer codes) ----------
  get profileCodes(): string[] {
    const raw = (this.userData?.dealerCode || '').toString();
    return raw.split(',').map((c: string) => c.trim()).filter(Boolean);
  }
  get profileName(): string {
    const u = this.userData || {};
    if (u.compName && this.profileCodes.length <= 1) return u.compName;
    const mail = (u.email || u.userName || '').toString();
    const local = mail.split('@')[0] || '';
    // sajeed.khan -> Sajeed Khan
    const pretty = local.split(/[._-]+/).filter(Boolean).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return pretty || u.compName || 'User';
  }
  get profileInitial(): string {
    return (this.profileName || 'U').charAt(0).toUpperCase();
  }
  get profileSub(): string {
    const codes = this.profileCodes;
    if (this.userData?.employeeCode) return codes.length > 1 ? `${this.userData.employeeCode} · ${codes.length} dealers` : this.userData.employeeCode;
    if (codes.length > 1) return `${codes.length} dealers`;
    return codes[0] || (this.userData?.role || '');
  }
  get profileRole(): string {
    const roles: string[] = this.userData?.roles?.length ? this.userData.roles : (this.userData?.role ? [this.userData.role] : []);
    return roles.join(', ');
  }

  ngOnInit(): void {
    this.userData = this.authService.currentUserValue;

    if (!this.userData) {
      this.router.navigate(['/login']);
      return;
    }

    this.element = document.documentElement;

    this.lastLoginDate$ = of(this.userData.lastLoginDate).pipe(
      map(dateStr => {
        if (!dateStr) return '';
        const d = new Date(dateStr);

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 → 12 for midnight
        const hoursStr = hours.toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
      })
    );

    this.dealerCode = this.storageService.getDealerCode();

    // search shows the pages of the module the sidebar is showing (ShowRoom / WorkShop / Account)
    this.menuService.activeModule$.subscribe(module => {
      if (module) this.selectedOption = module;
      if (this.searchOpen) this.Search();
    });

    this.getVehicleDispatchNotification();
    this.getPartsInwardNotification();
    this.getD2DVehicleNotification();
    this.getPartsD2DNotifications();
    this.getEbwNotifications();

    // Fetch Data
    this.saleInvoice = saleInvoice;

    this.notificationService.refreshPartsNotification.subscribe(() => {
      this.getPartsInwardNotification();
      this.getPartsD2DNotifications();
      this.getEbwNotifications();
    });

  }


  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    document.querySelector('.hamburger-icon')?.classList.toggle('open')
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }
  /**
* Open modal
* @param content modal content
*/
  openModal(content: any) {
    // this.submitted = false;
    this.modalService.open(content, { centered: true });
  }

  onSelectionChange(option: string) {
    if (option !== this.selectedOption) {
      this.selectedOption = option;
      this.storageService.setSelectedModule(option);
      this.menuService.filterMenu(option);
      this.router.navigate(['/']);
    }
  }

  /**
   * Logout the user
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  windowScroll() {
    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
      // (document.getElementById("back-to-top") as HTMLElement).style.display = "block";
      document.getElementById('page-topbar')?.classList.add('topbar-shadow');
    } else {
      // (document.getElementById("back-to-top") as HTMLElement).style.display = "none";
      document.getElementById('page-topbar')?.classList.remove('topbar-shadow');
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    } else {
      this.isDropdownOpen = true;
    }
  }
  // ---------------------------------------------------------------- Search Topbar
  // Searches only the pages the sidebar can show for the selected module (ShowRoom / WorkShop / Account):
  // same module rule as the sidebar (page module = selected module, or no module = common page) AND the
  // logged-in role has a right on the page (menuRights, permission > 0 - same rule as AuthGuard).
  async Search() {
    const term = (this.searchTerm ?? '').trim();
    if (!term) {
      this.searchResults = [];
      this.searchOpen = false;
      this.activeIndex = -1;
      return;
    }
    this.searchOpen = true;
    if (this.menuList.length === 0) {
      this.searchLoading = true;
      try { await this.getMenuList(); } catch { /* shown as "no match" */ }
      this.searchLoading = false;
    }

    const words = term.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const scored = this.searchablePages()
      .map(p => {
        const label = p.label.toLowerCase();
        const all = `${label} ${(p.parent ?? '').toLowerCase()}`;
        if (!words.every(w => all.includes(w))) return null;
        // best first: page name starts with the text, then a word of it starts with it, then anywhere
        const first = words[0];
        const score = label.startsWith(first) ? 0 : label.split(/[\s/()-]+/).some(x => x.startsWith(first)) ? 1 : label.includes(first) ? 2 : 3;
        return { p, score };
      })
      .filter((x): x is { p: SearchHit; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.p.label.localeCompare(b.p.label));

    this.searchMore = scored.length > TopbarComponent.MAX_SEARCH_RESULTS;
    this.searchResults = scored.slice(0, TopbarComponent.MAX_SEARCH_RESULTS).map(x => x.p);
    this.activeIndex = this.searchResults.length ? 0 : -1;
  }

  /** Linked pages of the selected module that this login has rights to (no duplicates). */
  private searchablePages(): SearchHit[] {
    const selected = this.moduleKey(this.selectedOption);
    const rights = (this.storageService.getMenuRights() ?? []) as any[];
    const allowed = new Set<number>(
      (Array.isArray(rights) ? rights : [])
        .filter(r => r && typeof r.subMenuId === 'number' && Number(r.permission) > 0)
        .map(r => r.subMenuId as number));
    const checkRights = allowed.size > 0;   // rights not loaded yet -> same list the sidebar shows

    const out: SearchHit[] = [];
    const seen = new Set<string>();
    const walk = (items: any[], parent: string | null) => {
      for (const item of items ?? []) {
        const label = (item.label ?? item.menuName ?? item.name ?? '').toString().trim();
        const link = item.link ?? item.url ?? item.route ?? item.path ?? item.pathName ?? null;
        const module = item.module ?? item.moduleName ?? null;
        const id = typeof (item.id ?? item.menuId) === 'number' ? (item.id ?? item.menuId) : null;
        const children = item.subItems ?? item.subMenus ?? item.subMenu ?? item.children;

        const moduleOk = !module || this.moduleKey(module) === selected;
        const rightOk = !checkRights || link === '/' || (id !== null && allowed.has(id));
        if (label && link && !item.isTitle && moduleOk && rightOk) {
          const key = `${link}|${label}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ key, id, label, link: link.startsWith('/') ? link : '/' + link, module, parent });
          }
        }
        if (Array.isArray(children) && children.length) walk(children, label || parent);
      }
    };
    walk(this.menuList, null);
    return out;
  }

  /** 'Work Shop', 'work_shop', 'WORKSHOP' -> 'workshop' (same as the sidebar) */
  private moduleKey(value: any): string {
    const k = (value ?? '').toString().toLowerCase().replace(/[\s_-]/g, '');
    return k === 'accounts' ? 'account' : k;
  }

  /** Bold the typed words inside a page name (text is escaped first). */
  highlight(label: string): string {
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const words = (this.searchTerm ?? '').trim().split(/\s+/).filter(w => w.length > 0)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return esc(label);
    const re = new RegExp(`(${words.join('|')})`, 'gi');
    return label.split(re).map((part, i) => i % 2 === 1 ? `<mark>${esc(part)}</mark>` : esc(part)).join('');
  }

  onSearchKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { this.closeBtn(null); return; }
    if (!this.searchOpen || !this.searchResults.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.activeIndex = (this.activeIndex + 1) % this.searchResults.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.activeIndex = (this.activeIndex - 1 + this.searchResults.length) % this.searchResults.length; }
    else if (e.key === 'Enter') { e.preventDefault(); this.closeBtn(this.searchResults[Math.max(0, this.activeIndex)]); }
  }

  onSearchBlur(): void {
    // let a click on a result finish first
    setTimeout(() => { this.searchOpen = false; }, 150);
  }

  /**
   * Search Close Btn / open a result
   */
  closeBtn(selectedForm: SearchHit | null) {
    this.searchOpen = false;
    this.searchTerm = '';
    this.searchResults = [];
    this.activeIndex = -1;
    if (selectedForm) this.router.navigate([selectedForm.link]);
  }

  private moduleOptionFor(module: string | undefined): string | null {
    const normalizedModule = (module ?? '').toLowerCase().replace(/[^a-z]/g, '');

    if (normalizedModule.includes('showroom')) return 'ShowRoom';
    if (normalizedModule.includes('workshop')) return 'WorkShop';
    if (normalizedModule.includes('account')) return 'Account';

    return null;
  }

  // Remove Notification
  checkedValGet: any[] = [];

  calculatenotification() {
    this.totalNotify = 0;
    this.checkedValGet = []

    this.checkedValGet.length > 0 ? (document.getElementById("notification-actions") as HTMLElement).style.display = 'block' : (document.getElementById("notification-actions") as HTMLElement).style.display = 'none';
    if (this.totalNotify == 0) {
      document.querySelector('.empty-notification-elem')?.classList.remove('d-none')
    }
  }
  getVehicleDispatchNotification() {
    this.loader.show();
    this.vehicleInwardService.getByVehicleStatus(false, this.dealerCode).subscribe({
      next: (result) => {
        this.vehicleInward = result;

        // Group by invoice number
        const groupedInvoices = this.vehicleInward.filter((p: any) => !p.isD2d).reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              status: 'Received'
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.invoiceNotifications = Object.values(groupedInvoices);

        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }
    });
  }

  getD2DVehicleNotification() {
    this.loader.show();
    this.vehicleInwardService.getByVehicleStatus(false, this.dealerCode).subscribe({
      next: (result) => {
        this.vehicleInward = result;

        const groupedInvoices = this.vehicleInward.filter((p: any) => p.isD2d).reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              issuedFrom: item.issuedDealerName,
              issuedDealerCode: item.issuedDealerCode,
              status: 'Received'
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.d2dNotificationList = Object.values(groupedInvoices);
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      }
    });
  }
  getPartsInwardNotification() {
    this.partInwardService.getPendingNotificationByDealer(this.dealerCode).subscribe({
      next: (res: any) => {
        this.partsInward = res;
        // Group by invoice number
        const groupedInvoices = this.partsInward.reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              status: 'Received'
            };
          }
          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        // Convert grouped object to array
        this.partsNotifications = Object.values(groupedInvoices);

        this.loader.hide();
      }, error: (err) => {
        this.toastService.show('Something went wrong', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
        console.error(err);
      }
    });
  }

  getEbwNotifications() {
    this.partInwardService.getPendingEbwNotificationByDealer(this.dealerCode).subscribe({
      next: (res: any) => {
        const groupedEbwInvoices = res.reduce((acc: any, item: any) => {
          const invoiceNo = item.invoiceNo;
          if (!acc[invoiceNo]) {
            acc[invoiceNo] = {
              invoiceNumber: invoiceNo,
              invoiceDate: item.invoiceDate,
              numberOfItems: 0,
              status: 'Received'
            };
          }

          acc[invoiceNo].numberOfItems += 1;
          return acc;
        }, {});

        this.ebwNotifications = Object.values(groupedEbwInvoices);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getPartsD2DNotifications(): void {
    this.localPartsService.getPartsD2DNotifications().subscribe({
      next: notifications => {
        this.partsD2DNotifications = notifications || [];
      },
      error: error => {
        this.toastService.show(
          error?.error?.message || 'Unable to load Parts D2D notifications.',
          { classname: 'bg-danger text-white', delay: 5000 }
        );
        console.error(error);
      }
    });
  }

  get pendingPartsD2DNotificationCount(): number {
    return this.partsD2DNotifications.filter(item => !item.isReceived).length;
  }

  get hasNotifications(): boolean {
    return this.invoiceNotifications.length > 0 ||
      this.partsNotifications.length > 0 ||
      this.ebwNotifications.length > 0 ||
      this.pendingPartsD2DNotificationCount > 0;
  }

  formatPartsD2DBillNo(billNo: string): string {
    return formatPartsD2DBillNo(billNo);
  }

  onClickInvoiceNumber(invoiceData) {
    const modalRef = this.modalService.open(InvoiceDetail, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    const invoiceDetails = this.vehicleInward.filter(x => x.invoiceNo === invoiceData.invoiceNumber);
    // Pass data to the modal component
    modalRef.componentInstance.invoiceDetails = invoiceDetails;
    modalRef.componentInstance.sourceType = 'vehicle';

    modalRef.result.then(
      (result) => {
        if (result && result.isAccepted) {
          this.loader.show();
          this.lotInspectionService.acceptInvoiceHeader(invoiceData.invoiceNumber).subscribe({
            next: (res) => {
              this.updateNotificationStatusByInvoice(invoiceData.invoiceNumber);
              this.loader.hide();
            },
            error: (err) => {
              this.loader.hide();
              console.error(err);
            }
          });
        }
      },
      (reason) => {
      }
    );
  }
  updateNotificationStatusByInvoice(invoiceNumber: string) {
    this.vehicleInwardService.updateStatusByInvoiceNumber(invoiceNumber).subscribe({
      next: (res) => {
        this.toastService.show('Record updated sucessfully', {
          classname: 'bg-success text-white',
          delay: 5000
        });

        this.getVehicleDispatchNotification();

        this.router.navigate(['/lot-inspection-details', invoiceNumber]);

      }, error: (err) => {
        this.toastService.show('Something went wrong', {
          classname: 'bg-warning text-white',
          delay: 5000
        });
        console.error(err);
      }
    })
  }

  async getMenuList(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.menuService.getMenu().subscribe({
        next: (menu: any) => {
          this.menuList = Array.isArray(menu) ? menu : (menu?.data ?? menu?.result ?? menu?.items ?? []);
          resolve(menu);
          this.loader.hide();
        }, error: (err) => {
          console.error('Error fetching menu:', err);
          reject(err);
          this.loader.hide();
        }
      });
    });
  }

  onClickPartNumber(item: any) {
    this.partsNotifications = this.partsNotifications.filter(
      (x) => x.invoiceNumber !== item.invoiceNumber
    );

    const invoiceNo = item?.invoiceNumber || '0';
    const value = Date.now() + '|' + invoiceNo;
    const encClaim = btoa(value);
    this.router.navigate(['parts-inward', encClaim]);
  }

  onClickEbwItem(item: any) {
    this.ebwNotifications = this.ebwNotifications.filter(
      (x) => x.invoiceNumber !== item.invoiceNumber
    );

    const invoiceNo = item?.invoiceNumber || '0';
    const value = Date.now() + '|' + invoiceNo;
    const encClaim = btoa(value);
    this.router.navigate(['parts-inward', encClaim]);
  }

  onClickPartsD2DNotification(item: any): void {
    const d2dBillNo = String(item?.d2DBillNo ?? '').trim();
    if (!d2dBillNo) {
      this.toastService.show('D2D bill number is missing.', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
      return;
    }

    this.router.navigate(['/parts-inward/d2d', d2dBillNo]);
  }
}