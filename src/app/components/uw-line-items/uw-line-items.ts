import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';
import { UwLineItemService } from '../../core/services/uw-line-item-service';
import { DealerService } from '../../core/services/dealer-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-uw-line-item',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './uw-line-items.html',
  styleUrl: './uw-line-items.scss',
})
export class UwLineItem implements OnInit {

  readonly SUBMENU_ID = 115;
  canEdit = false;
  canDelete = false;
  isAdmin = false;

  items: any[] = [];
  totalCount: number = 0;
  totalPages: number = 0;

  reasonDrafts: { [uwLineItemId: number]: string } = {};
  actingOnId: number | null = null;
  editingId: number | null = null;

  dealerSearchText: string = '';
  dealerSuggestions: any[] = [];
  dealerSearchLoading: boolean = false;
  showDealerSuggestions: boolean = false;
  private dealerSearchDebounceHandle: any = null;

  showDealerDetailsModal: boolean = false;
  dealerDetails: any = null;
  dealerDetailsLoading: boolean = false;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    dealerName: '',
    dealerCode: '',
    status: '',
    claimNo: null,
    pageNumber: 1,
    pageSize: 25
  };

  constructor(
    private router: Router,
    private loader: LoaderService,
    private storageService: StorageService,
    private toaster: ToastService,
    private uwLineItemService: UwLineItemService,
    private dealerService: DealerService,
    private menuAccess: MenuAccessService
  ) 
  
  // { 
  //   this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  //   this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
  // }
  { 
    const role = (this.storageService.getRole() || '').toLowerCase().replace(/\s+/g, '');
    this.isAdmin = role.includes('admin');

    this.canEdit = this.isAdmin && this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.isAdmin && this.menuAccess.canDelete(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filter.dateFrom = this.formatDate(firstDayOfMonth);
    this.filter.dateTo = this.formatDate(today);

    this.search();
  }


 onEditItem(item: any): void {
    if (!this.isAdmin) {
      this.toaster.show('Dealer is not allowed to edit this item.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    this.startEdit(item.id);
  }

  onDeleteOrRedirectClaim(item: any): void {
    if (!this.isAdmin) {
      this.toaster.show('Dealer is not allowed to delete or modify this claim.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    sessionStorage.setItem('viewWarrantyJCClaimId', String(item.warrantyJcclaimId));
    this.router.navigate(['/warranty-job-card-claim']);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDealerSearchInput(): void {
    if (this.dealerSearchDebounceHandle) {
      clearTimeout(this.dealerSearchDebounceHandle);
    }

    const text = this.dealerSearchText.trim();

    if (!text) {
      this.dealerSuggestions = [];
      this.showDealerSuggestions = false;
      this.filter.dealerName = '';
      this.filter.dealerCode = '';
      return;
    }

    this.dealerSearchDebounceHandle = setTimeout(() => {
      this.dealerSearchLoading = true;
      this.dealerService.getDealerByPaged(text, 1, 20, null).subscribe({
        next: (res: any) => {
          this.dealerSearchLoading = false;
          this.dealerSuggestions = res?.data || res?.Data || [];
          this.showDealerSuggestions = true;
        },
        error: (err) => {
          this.dealerSearchLoading = false;
          console.error('Dealer search failed:', err);
        }
      });
    }, 300);
  }

  selectDealer(dealer: any): void {
    this.filter.dealerCode = dealer.dealercode;
    this.filter.dealerName = dealer.compname;
    this.dealerSearchText = `${dealer.compname} (${dealer.dealercode})`;

    this.showDealerSuggestions = false;
    this.dealerSuggestions = [];

    this.openDealerDetails(dealer.dealercode);
  }

  openDealerDetails(dealerCode: string): void {
    this.dealerDetailsLoading = true;
    this.showDealerDetailsModal = true;
    this.dealerDetails = null;

    this.dealerService.getByDealerCode(dealerCode).subscribe({
      next: (res: any) => {
        this.dealerDetailsLoading = false;
        this.dealerDetails = res;
      },
      error: (err) => {
        this.dealerDetailsLoading = false;
        console.error('Failed to load dealer details:', err);
        this.toaster.show('Failed to load dealer details.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  closeDealerDetailsModal(): void {
    this.showDealerDetailsModal = false;
    this.dealerDetails = null;
  }

  get dealerDetailsExtraFields(): { key: string; value: any }[] {
    if (!this.dealerDetails) return [];
    const shown = new Set(['compname', 'dealercode', 'state', 'id']);
    return Object.entries(this.dealerDetails)
      .filter(([key, value]) => !shown.has(key.toLowerCase()) && value !== null && value !== '')
      .map(([key, value]) => ({ key, value }));
  }

  onDealerSearchBlur(): void {
    setTimeout(() => {
      this.showDealerSuggestions = false;
    }, 150);
  }

  search(): void {
    this.loader.show();

    const role = (this.storageService.getRole() || '').toLowerCase().replace(/\s+/g, '');
    const isSuperAdmin = role.includes('admin');
    const dealerCode = isSuperAdmin ? null : this.storageService.getDealerCode();

    const payload = {
      ...this.filter,
      dateFrom: this.filter.dateFrom || null,
      dateTo: this.filter.dateTo || null,
      status: this.filter.status || null,
      dealerCode: this.filter.dealerCode || dealerCode
    };

    this.uwLineItemService.searchUwLineItems(payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.items = (res?.items || res || []).map((item: any) => ({
          ...item,
          status: item.status || 'Pending'
        }));
        this.totalCount = res?.totalCount || this.items.length;
        this.totalPages = res?.totalPages || 1;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load UW Line Items.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  resetFilter(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filter = {
      dateFrom: this.formatDate(firstDayOfMonth),
      dateTo: this.formatDate(today),
      dealerName: '',
      dealerCode: '',
      status: '',
      claimNo: null,
      pageNumber: 1,
      pageSize: 25
    };

    this.dealerSearchText = '';
    this.dealerSuggestions = [];
    this.showDealerSuggestions = false;
    this.editingId = null;

    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.filter.pageNumber = page;
    this.editingId = null;
    this.search();
  }

  approve(id: number): void {
    if (this.actingOnId !== null) {
      return;
    }

    const item = this.items.find(i => i.id === id);
    if (!item) {
      return;
    }

    if (item.status === 'Approved') {
      this.toaster.show('This claim is already approved.', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }

    if (!confirm('Approve this claim?')) {
      return;
    }

    this.actingOnId = id;
    this.loader.show();

    this.uwLineItemService.approveUwLineItem({ id }).subscribe({
      next: () => {
        this.loader.hide();
        this.actingOnId = null;
        this.editingId = null;
        delete this.reasonDrafts[id];

        // Direct row update without full page refresh issues
        item.status = 'Approved';
        item.rejectionReason = '';

        this.toaster.show('Claim approved successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        this.actingOnId = null;
        console.error(err);
        const serverMsg = typeof err?.error === 'string' ? err.error : 'Failed to approve the claim.';
        this.toaster.show(serverMsg, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  reject(id: number): void {
    if (this.actingOnId !== null) {
      return;
    }

    const reason = this.reasonDrafts[id];
    if (!reason || reason.trim() === '') {
      this.toaster.show('Please enter a reason before rejecting.', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }

    const item = this.items.find(i => i.id === id);
    if (!item) {
      return;
    }

    if (!confirm('Reject this claim?')) {
      return;
    }

    this.actingOnId = id;
    this.loader.show();

    this.uwLineItemService.rejectUwLineItem({
      id,
      rejectionReason: reason.trim()
    }).subscribe({
      next: () => {
        this.loader.hide();
        this.actingOnId = null;
        this.editingId = null;
        delete this.reasonDrafts[id];

        // Direct row update
        item.status = 'Rejected';
        item.rejectionReason = reason.trim();

        this.toaster.show('Claim rejected.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        this.actingOnId = null;
        console.error(err);
        const serverMsg = typeof err?.error === 'string' ? err.error : 'Failed to reject the claim.';
        this.toaster.show(serverMsg, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  startEdit(id: number): void {
    const item = this.items.find(i => i.id === id);
    if (!item) {
      return;
    }

    this.editingId = id;
    this.reasonDrafts[id] = item.rejectionReason || '';
  }

  cancelEdit(id: number): void {
    if (this.editingId === id) {
      this.editingId = null;
      delete this.reasonDrafts[id];
    }
  }

  deleteItem(id: number): void {
    if (this.actingOnId !== null) {
      return;
    }

    if (!confirm('Delete this line item permanently?')) {
      return;
    }

    this.actingOnId = id;
    this.loader.show();

    this.uwLineItemService.deleteUwLineItem(id).subscribe({
      next: () => {
        this.loader.hide();
        this.actingOnId = null;
        this.editingId = null;
        delete this.reasonDrafts[id];

        this.items = this.items.filter(i => i.id !== id);
        this.totalCount = Math.max(0, this.totalCount - 1);

        this.toaster.show('Line item deleted.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        this.actingOnId = null;
        console.error(err);
        const serverMsg = typeof err?.error === 'string' ? err.error : 'Failed to delete the line item.';
        this.toaster.show(serverMsg, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  back(): void {
    this.router.navigate(['/warranty-job-card-claim']);
  }
}