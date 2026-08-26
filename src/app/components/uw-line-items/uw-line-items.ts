import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';
import { UwLineItemService } from '../../core/services/uw-line-item-service';
import { DealerService } from '../../core/services/dealer-service';

@Component({
  selector: 'app-uw-line-item',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './uw-line-items.html',
  styleUrl: './uw-line-items.scss',
})
export class UwLineItem implements OnInit {

  items: any[] = [];
  totalCount: number = 0;
  totalPages: number = 0;

  // Reason text is entered inline, per row, matching the reference layout
  // exactly - always visible, not a separate opened/closed input.
  reasonDrafts: { [uwLineItemId: number]: string } = {};

  actingOnId: number | null = null; // disables both buttons on the row mid-request

  // Set when the Edit action is clicked on an already-actioned
  // (Approved/Rejected) row.
  //
  // Approved:
  //   Edit -> Reject + Cancel
  //
  // Rejected:
  //   Edit -> Approve + Reject + Cancel
  //
  // Pending:
  //   Approve + Reject are already visible.
  editingId: number | null = null;

  // --- Dealer Name/Code merged typeahead, per explicit request ---
  dealerSearchText: string = '';
  dealerSuggestions: any[] = [];
  dealerSearchLoading: boolean = false;
  showDealerSuggestions: boolean = false;
  private dealerSearchDebounceHandle: any = null;

  // Modal state for "on click display dealer details"
  showDealerDetailsModal: boolean = false;
  dealerDetails: any = null;
  dealerDetailsLoading: boolean = false;

  filter: any = {
    dateFrom: '',
    dateTo: '',
    dealerName: '',
    dealerCode: '',
    status: '', // '' = all statuses
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
    private dealerService: DealerService
  ) { }

  ngOnInit(): void {

    const today = new Date();

    const firstDayOfMonth =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    this.filter.dateFrom =
      this.formatDate(firstDayOfMonth);

    this.filter.dateTo =
      this.formatDate(today);

    this.search();
  }

  formatDate(date: Date): string {

    const year =
      date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // --- Dealer Name/Code merged typeahead ---------------------------------
  // Fires on every keystroke in the merged search box, debounced so it
  // doesn't hit the backend on every character.
  onDealerSearchInput(): void {
    if (this.dealerSearchDebounceHandle) {
      clearTimeout(this.dealerSearchDebounceHandle);
    }

    const text = this.dealerSearchText.trim();

    if (!text) {
      this.dealerSuggestions = [];
      this.showDealerSuggestions = false;
      // Clearing the box also clears the applied filter - otherwise a
      // stale dealer selection would keep silently filtering results
      // after the user erased the visible search text.
      this.filter.dealerName = '';
      this.filter.dealerCode = '';
      return;
    }

    this.dealerSearchDebounceHandle = setTimeout(() => {
      this.dealerSearchLoading = true;
      // pageIndex=1, pageSize=20 - caps suggestion list length. Real
      // route is GetDealerByPaged (via /DealerMaster/paged), the only
      // confirmed-real search-capable method - GetAllDealersAsync isn't
      // actually exposed via any route in the real DealerService.
      this.dealerService.getDealerByPaged(text, 1, 20, null).subscribe({
        next: (res: any) => {
          this.dealerSearchLoading = false;
          // PagedResponse wraps results in .data (or .Data, depending on
          // casing) - not a bare array.
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

  // Selecting a suggestion both sets the search filter AND opens the
  // details modal in one click, per explicit confirmation.
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

  // For displaying any fields beyond the confirmed compname/dealercode/
  // state in the modal generically, since the full DealerMaster shape
  // isn't confirmed - excludes the ones already shown explicitly.
  get dealerDetailsExtraFields(): { key: string; value: any }[] {
    if (!this.dealerDetails) return [];
    const shown = new Set(['compname', 'dealercode', 'state', 'id']);
    return Object.entries(this.dealerDetails)
      .filter(([key, value]) => !shown.has(key.toLowerCase()) && value !== null && value !== '')
      .map(([key, value]) => ({ key, value }));
  }

  // Hides the suggestion dropdown when the input loses focus - a short
  // delay so a click on a suggestion (which also briefly blurs the input)
  // still registers before the list disappears.
  onDealerSearchBlur(): void {
    setTimeout(() => {
      this.showDealerSuggestions = false;
    }, 150);
  }

  search(): void {
    this.loader.show();
    const dealerCode = this.storageService.getDealerCode();
    // dateFrom/dateTo must be null (not '') when empty - an empty string
    // fails to deserialize as DateTime? on the backend, same fix already
    // applied on the other list pages in this app.
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
        this.items = res?.items || [];
        this.totalCount = res?.totalCount || 0;
        this.totalPages = res?.totalPages || 0;
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

    const firstDayOfMonth =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    this.filter = {

      dateFrom:
        this.formatDate(firstDayOfMonth),

      dateTo:
        this.formatDate(today),

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

    // Close edit mode when filters are reset
    this.editingId = null;

    this.search();
  }

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }

    this.filter.pageNumber = page;

    // Close edit mode when changing page
    this.editingId = null;

    this.search();
  }

  approve(id: number): void {

  if (this.actingOnId !== null) {
    return;
  }

  const item = this.items.find(
    i => i.id === id
  );

  if (!item) {
    return;
  }


  // Already Approved cannot be approved again.
  if (item.status === 'Approved') {

    this.toaster.show(
      'This claim is already approved.',
      {
        classname:
          'bg-warning text-white',
        delay: 3000
      }
    );

    return;
  }


  if (
    !confirm(
      'Approve this claim? This will make its Order and Invoice visible in their respective windows.'
    )
  ) {
    return;
  }


  this.actingOnId = id;

  this.loader.show();


  this.uwLineItemService
    .approveUwLineItem({ id })
    .subscribe({

      next: () => {

        this.loader.hide();

        this.actingOnId = null;

        this.editingId = null;

        // Remove the old rejection reason from
        // the local UI immediately.
        delete this.reasonDrafts[id];


        this.toaster.show(
          'Claim approved successfully. Rejection reason has been cleared.',
          {
            classname:
              'bg-success text-white',
            delay: 3000
          }
        );


        // Reload to get Updated By / Updated Date
        // from backend.
        this.search();
      },


      error: (err) => {

        this.loader.hide();

        this.actingOnId = null;

        console.error(err);


        const serverMsg =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message
              ? err.error.message
              : 'Failed to approve the claim.';


        this.toaster.show(
          serverMsg,
          {
            classname:
              'bg-danger text-white',
            delay: 5000
          }
        );
      }
    });
}

  reject(id: number): void {

    if (this.actingOnId !== null) {
      return;
    }

    const reason =
      this.reasonDrafts[id];

    if (
      !reason ||
      reason.trim() === ''
    ) {

      this.toaster.show(
        'Please enter a reason before rejecting.',
        {
          classname:
            'bg-warning text-white',
          delay: 3000
        }
      );

      return;
    }

    // A row can reach here from Pending, or from Approved/Rejected
    // via the Edit action.
    //
    // FIX: rejecting an already-approved line now DOES clean up the
    // WarrantyOrder / WarrantyInvoice / WarrantyPackingSlip data already
    // generated from it (UwLineItemRepo.RejectUwLineItem cascades this on
    // the backend now) - only this claim's own footprint is removed, and
    // only as far up the chain as stays otherwise empty of other claims/
    // orders, so shared Order/Invoice records used by other claims are
    // left untouched. Previously this only flipped the row's status and
    // left that downstream data dangling - make the real consequence
    // explicit before the user confirms.

    const item =
      this.items.find(
        i => i.id === id
      );

    if (!item) {
      return;
    }

    const isReversingApproval =
      item.status === 'Approved';

    const confirmMessage =
      isReversingApproval

        ? 'This claim was already approved, and its Order/Invoice/Packing Slip have already been generated from it. Rejecting it now will mark it Rejected AND remove this claim\'s data from that Order/Invoice/Packing Slip (any part still shared with other claims is left untouched). Continue?'

        : 'Reject this claim?';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.actingOnId = id;

    this.loader.show();

    this.uwLineItemService
      .rejectUwLineItem({
        id,
        rejectionReason: reason.trim()
      })
      .subscribe({

        next: () => {

          this.loader.hide();

          this.actingOnId = null;

          this.editingId = null;

          delete this.reasonDrafts[id];

          this.toaster.show(
            'Claim rejected.',
            {
              classname:
                'bg-success text-white',
              delay: 3000
            }
          );

          this.search();
        },

        error: (err) => {

          this.loader.hide();

          this.actingOnId = null;

          console.error(err);

          const serverMsg =
            typeof err?.error === 'string'
              ? err.error
              : 'Failed to reject the claim.';

          this.toaster.show(
            serverMsg,
            {
              classname:
                'bg-danger text-white',
              delay: 5000
            }
          );
        }
      });
  }


startEdit(id: number): void {

  const item = this.items.find(
    i => i.id === id
  );

  if (!item) {
    return;
  }

  if (
    item.status !== 'Approved' &&
    item.status !== 'Rejected'
  ) {
    return;
  }

  this.editingId = id;

  this.reasonDrafts[id] =
    item.rejectionReason || '';
}

  // ============================================================
  // CANCEL EDIT
  // ============================================================

    cancelEdit(id: number): void {

      if (this.editingId === id) {

        this.editingId = null;

        delete this.reasonDrafts[id];
      }
    }

  // ============================================================
  // EDIT STATUS CHECK
  // ============================================================

  isEditing(id: number): boolean {

    return this.editingId === id;
  }

  isApproved(item: any): boolean {

    return item?.status === 'Approved';
  }

  isRejected(item: any): boolean {

    return item?.status === 'Rejected';
  }

  isPending(item: any): boolean {

    return item?.status === 'Pending';
  }

  deleteItem(id: number): void {

    if (this.actingOnId !== null) {
      return;
    }

    if (
      !confirm(
        'Delete this line item permanently? This cannot be undone.'
      )
    ) {
      return;
    }

    this.actingOnId = id;

    this.loader.show();

    this.uwLineItemService
      .deleteUwLineItem(id)
      .subscribe({

        next: () => {

          this.loader.hide();

          this.actingOnId = null;

          this.editingId = null;

          delete this.reasonDrafts[id];

          this.toaster.show(
            'Line item deleted.',
            {
              classname:
                'bg-success text-white',
              delay: 3000
            }
          );

          this.search();
        },

        error: (err) => {

          this.loader.hide();

          this.actingOnId = null;

          console.error(err);

          const serverMsg =
            typeof err?.error === 'string'
              ? err.error
              : 'Failed to delete the line item.';

          this.toaster.show(
            serverMsg,
            {
              classname:
                'bg-danger text-white',
              delay: 5000
            }
          );
        }
      });
  }
    isRejectedForEdit(item: any): boolean {

      return (
        item?.status === 'Rejected' ||
        (
          item?.status === 'Approved' &&
          !!item?.rejectionReason
        )
      );
    }
  back(): void {

    this.router.navigate([
      '/warranty-job-card-claim'
    ]);
  }
}