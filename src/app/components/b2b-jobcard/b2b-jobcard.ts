//src\app\components\b2b-jobcard\b2b-jobcard.ts
// B2B Job Card list (/b2bjobcards, MenuMaster 160) - 24.11.2026. Same layout as the B2C /job-card list; data from the
// JobCardScanner database through api/b2b-jobcard (B2BJobcardService). B2C job cards are not shown here.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { StorageService } from '../../core/services/storage';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { ToastService } from '../../shared/toaster/toast-service';
import { B2BJobcardService } from './services/b2b-jobcard.service';
import { B2B_STATUSES, B2BDealer, B2BJobCardFilter, B2BJobCardListRow, B2BWorkshop } from './models/b2b-jobcard.model';

@Component({
  selector: 'app-b2b-jobcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './b2b-jobcard.html',
  styleUrl: './b2b-jobcard.scss',
})
export class B2BJobcard implements OnInit {
  readonly SUBMENU_ID = 160;
  readonly statuses = B2B_STATUSES;

  canCreate = false;
  canEdit = false;
  isAdmin = false;

  dealers: B2BDealer[] = [];
  workshops: B2BWorkshop[] = [];
  dealerMessage = '';

  /** defaults: All Dealers / All Locations / All Status */
  filter: B2BJobCardFilter = { pageIndex: 1, pageSize: 10, dealerCode: null, serviceLocationCode: '', status: null };
  rows: B2BJobCardListRow[] = [];
  totalRecords = 0;
  loading = false;
  error = '';
  private searchTimer: any;

  constructor(
    private api: B2BJobcardService,
    private storage: StorageService,
    private menuAccess: MenuAccessService,
    private toaster: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = (this.storage.getRole() || '').toLowerCase();
    this.isAdmin = role === 'superadmin' || role === 'admin';
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);

    const today = new Date();
    this.filter.fromDate = this.fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    this.filter.toDate = this.fmt(today);

    if (this.isAdmin) {
      this.api.getDealers().subscribe({
        next: (d) => (this.dealers = d || []),
        error: (e) => (this.dealerMessage = B2BJobcardService.errorText(e, 'Could not load JobCardScanner dealers.'))
      });
    }
    this.loadWorkshops();
    this.load();
  }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadWorkshops(): void {
    this.workshops = [];
    this.dealerMessage = '';
    if (this.isAdmin && !this.filter.dealerCode) return;
    this.api.getMasters(this.filter.dealerCode).subscribe({
      next: (m) => {
        this.workshops = m.workshops || [];
        this.dealerMessage = m.dealerMessage || '';
      },
      error: (e) => (this.dealerMessage = B2BJobcardService.errorText(e, 'Could not load workshops.'))
    });
  }

  onDealerChange(): void {
    this.filter.serviceLocationCode = '';
    this.loadWorkshops();
    this.search();
  }

  search(): void {
    this.filter.pageIndex = 1;
    this.load();
  }

  onTextChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search(), 400);
  }

  reset(): void {
    const dealerCode = this.filter.dealerCode;
    const today = new Date();
    this.filter = {
      pageIndex: 1, pageSize: this.filter.pageSize, dealerCode, serviceLocationCode: '', status: null,
      fromDate: this.fmt(new Date(today.getFullYear(), today.getMonth(), 1)), toDate: this.fmt(today)
    };
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getList(this.filter).subscribe({
      next: (res) => {
        this.rows = res?.data || [];
        this.totalRecords = res?.totalRecords || 0;
        this.loading = false;
      },
      error: (e) => {
        this.rows = [];
        this.totalRecords = 0;
        this.loading = false;
        this.error = B2BJobcardService.errorText(e, 'Could not load B2B job cards.');
      }
    });
  }

  pageChange(page: number): void {
    this.filter.pageIndex = page;
    this.load();
  }

  onAdd(): void {
    if (!this.canCreate) {
      this.toaster.show('You do not have create rights for B2B Job Card.', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }
    this.router.navigate(['/b2bjobcards/add'], { queryParams: this.filter.dealerCode ? { dealer: this.filter.dealerCode } : {} });
  }

  onOpen(row: B2BJobCardListRow): void {
    this.router.navigate(['/b2bjobcards', row.id]);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-primary';
      case 'Closed': return 'bg-success';
      case 'Cancelled': return 'bg-secondary';
      case 'InProgress': return 'bg-info text-dark';
      default: return 'bg-warning text-dark';
    }
  }
}
