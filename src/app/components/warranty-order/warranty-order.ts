// src\app\components\warranty-order\warranty-order.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { ToastService } from '../../shared/toaster/toast-service';
import { WarrantyOrderService } from '../../core/services/warranty-order-service';
import { WarrantyInvoiceService } from '../../core/services/warranty-invoice-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-warranty-order',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-order.html',
  styleUrl: './warranty-order.scss',
})
export class WarrantyOrder implements OnInit {
  readonly SUBMENU_ID = 112;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  orderId: number = 0; // 0 = create, otherwise the Id being edited

  dateFrom: string = '';
  dateTo: string = '';
  batchNo: string = '';       // auto-generated, read-only on the form
  batchDate: string = '';
  orderNo: string = '';       // auto-generated, read-only on the form
  orderDate: string = '';
  selectedLocation: string | null = null;
  claimType: string = 'Warranty';
  selectedSupplierId: number | null = null;
  locationList: any[] = [];
  supplierList: any[] = [];
  selectedClaims: any[] = [];
  historicalClaims: any[] = [];
  private readonly maxHistoricalOrders = 10; // avoid unbounded growth
  saving = false;
  isEditMode = false;
  wasApprovedOnLoad = false;
  isSuperAdmin = false;
  // private autoSaveArmed = false;
  // private numbersLoaded = false;
  // private claimLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private toaster: ToastService,
    private warrantyOrderService: WarrantyOrderService,
    private warrantyInvoiceService: WarrantyInvoiceService,
    private menuAccess: MenuAccessService
  ) { 
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const today = new Date();
    this.orderDate = this.formatDate(today);
    this.batchDate = this.formatDate(today);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = this.formatDate(firstDayOfMonth);
    this.dateTo = this.formatDate(today);

    this.loadSuppliers();

    const routeId = this.route.snapshot.paramMap.get('id');

    // Set by the Approved Warranty Order List's "View" button - takes
    // priority over everything else since it's an explicit user action.
    // Same sessionStorage handoff pattern as pendingWarrantyOrderClaim below.
    const viewOrderId = sessionStorage.getItem('viewWarrantyOrderId');

    // Persisted in sessionStorage (not router state or a query param) from
    // Warranty JobCard Claim's Save - survives re-navigating to this same
    // page or refreshing, unlike router state. Cleared once this order is
    // actually saved (see saveWarrantyOrder()).
    const pendingRaw = sessionStorage.getItem('pendingWarrantyOrderClaim');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

    if (viewOrderId) {
      sessionStorage.removeItem('viewWarrantyOrderId');
      this.orderId = Number(viewOrderId);
      this.loadExistingOrder(this.orderId);
    } else if (routeId) {
      // Edit mode - Batch No / Order No were already generated at creation time.
      this.orderId = Number(routeId);
      this.loadExistingOrder(this.orderId);
    } else if (pending?.claimId) {
      // A new claim is waiting to be added - auto-saves silently (no
      // navigation) once numbers + claim are both loaded, so the order and
      // its WarrantyOrderGridDetail rows exist in the DB right away. Safe
      // since it stays unapproved and invisible in the List page until the
      // checkbox is checked and Save is clicked.
      //this.autoSaveArmed = true;
      this.loadNextOrderNumbers();
      this.preloadClaimFromQueryParam(Number(pending.claimId));
    } else {
      // Nothing new pending - show the most recently saved order straight
      // from the DB (not sessionStorage, which doesn't survive a fresh
      // session/browser restart) so this always reflects real persisted data.
      this.loadLatestSavedOrder();
    }
  }

  loadLatestSavedOrder(): void {
    // includeInactive is deliberately omitted (defaults to false) here -
    // this is the "nothing specific pending, just show something" fallback
    // for a fresh visit. If it included a just-deleted order, the user
    // would land on an order they can no longer Save (UpdateWarrantyOrder
    // requires IsActive=true), blocking them from starting a new batch.
    // Viewing a specific deleted order on purpose (double-click from the
    // List) still works fine via viewOrderId + GetWarrantyOrderById, which
    // has no IsActive filter - only this default landing view is scoped
    // back to active orders.
    this.warrantyOrderService.searchWarrantyOrders({ pageNumber: 1, pageSize: 1 }).subscribe({
      next: (res: any) => {
        const items = res?.items || [];
        if (items.length > 0) {
          this.orderId = items[0].id;
          this.loadExistingOrder(this.orderId);
        } else {
          // No active orders exist right now - still load historical
          // claims (id 0 = nothing to exclude) so any deleted order's
          // claim remains visible here for reference/re-batching, even
          // though the main form itself is starting blank.
          this.loadNextOrderNumbers();
          this.loadHistoricalClaims(0);
        }
      },
      error: (err) => {
        // Surfaced instead of silently falling back to blank - a failed
        // fetch (auth/network) would otherwise look identical to
        // genuinely-no-data-saved, which is misleading.
        console.error('loadLatestSavedOrder failed:', err);
        const serverMsg = err?.error?.title || err?.error || err?.message || 'Unknown error';
        this.toaster.show(`Could not load the last saved order (status ${err?.status}): ${serverMsg}`, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
        this.loadNextOrderNumbers();
      }
    });
  }

  // Uses the header's own fields as filter criteria - Batch No / Order No
  // stay read-only (auto-generated), so search works by Date From/To,
  // Location, Claim Type, and Supplier.
  searchOrder(): void {
    const filter = {
      dateFrom: this.dateFrom || null,
      dateTo: this.dateTo || null,
      location: this.selectedLocation || null,
      claimType: this.claimType || null,
      supplierId: this.selectedSupplierId || null,
      pageNumber: 1,
      pageSize: 1
    };

    this.loader.show();
    this.warrantyOrderService.searchWarrantyOrders(filter).subscribe({
      next: (res: any) => {
        this.loader.hide();
        const items = res?.items || [];
        if (items.length > 0) {
          this.orderId = items[0].id;
          this.loadExistingOrder(this.orderId);
        } else {
          this.toaster.show('No matching Warranty Order found.', {
            classname: 'bg-warning text-white',
            delay: 3000
          });
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Search failed. Check console for details.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadSuppliers(): void {
    this.ledgerService.getCompanyLedgers().subscribe({
      next: (res: any) => {
        this.supplierList = res;
        if (this.supplierList.length === 1) {
          this.selectedSupplierId = this.supplierList[0].id;
        }
      },
      error: (err) => console.error(err)
    });
  }
    loadNextOrderNumbers(): void {
      const dealerCode = this.storageService.getDealerCode();
      this.warrantyOrderService.getNextOrderNumbers(dealerCode).subscribe({
        next: (res: any) => {
          this.batchNo = res.batchNo;
          this.orderNo = res.orderNo;
        },
        error: (err) => {
          console.error(err);
          this.toaster.show('Could not auto-generate Batch No / Order No. Please refresh and try again.', {
            classname: 'bg-warning text-white',
            delay: 3000
          });
        }
      });
    }

  loadExistingOrder(id: number): void {
    this.loader.show();
    this.warrantyOrderService.getWarrantyOrderById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.dateFrom = res.dateFrom?.substring(0, 10);
        this.dateTo = res.dateTo?.substring(0, 10);
        this.batchNo = res.batchNo;
        this.batchDate = res.batchDate?.substring(0, 10);
        this.orderNo = res.orderNo;
        this.orderDate = res.orderDate?.substring(0, 10);

        // Resolve against the exact loccode in locationList (case/whitespace
        // tolerant) rather than assigning res.location directly - same
        // safeguard preloadClaimFromQueryParam already uses, now applied
        // here too since this is the second place selectedLocation gets set.
        // Show only this order's own location as the sole dropdown option -
        // not a full dealer-scoped list. Removes the need to "match" against
        // anything, which also sidesteps the cross-dealer mismatch entirely
        // (the code can legitimately belong to a different dealer than the
        // one viewing it).
        if (res.location) {
          this.locationList = [{ loccode: res.location, locname: res.locationName || res.location }];
        } else {
          this.locationList = [];
        }
        this.selectedLocation = res.location;

        this.claimType = res.claimType;
        this.selectedSupplierId = res.supplierId;

        // Claims now come pre-resolved directly from the backend's
        // WarrantyOrderGridDetail snapshot - no more per-claim follow-up
        // calls, and no live joins on the read path at all.
        this.selectedClaims = res.claims || [];
        this.isEditMode = false;

        // Captured BEFORE any checkbox interaction this page load - this
        // is the order's saved approval state from the DB, not affected
        // by anything the user does after this point.
        this.wasApprovedOnLoad = !!res.isApproved;

        // Also load recent OTHER orders' claims for read-only display
        // stacked above this one, so multiple orders show on one screen.
        this.loadHistoricalClaims(id);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Order.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  // Fetches the most recent orders (excluding currentOrderId) and their
  // claims, purely for read-only display stacked above the current order's
  // own editable claims. Never wired to any save/checkbox action - each
  // row here belongs to a different orderId than the one this page would
  // actually save to.
  loadHistoricalClaims(currentOrderId: number): void {
    // includeInactive: true - deleted orders' claims should still show here
    // for reference, tagged so a checked one routes to "create a new
    // order" (see saveWarrantyOrder) instead of trying to update an order
    // that's been deleted and can no longer be saved to directly.
    this.warrantyOrderService.searchWarrantyOrders({
      pageNumber: 1,
      pageSize: this.maxHistoricalOrders + 1, // +1 in case currentOrderId is in this page
      includeInactive: true
    }).subscribe({
      next: (res: any) => {
        const otherOrders: any[] = (res?.items || [])
          .filter((o: any) => o.id !== currentOrderId)
          .slice(0, this.maxHistoricalOrders);

        if (otherOrders.length === 0) {
          this.historicalClaims = [];
          return;
        }

        // Oldest first, so the current order's claims render last/below,
        // matching "add new entry below the previous entry".
        const orderedOrders = [...otherOrders].reverse();

        const requests = orderedOrders.map(o => this.warrantyOrderService.getWarrantyOrderById(o.id));
        forkJoin(requests).subscribe({
          next: (orders: any[]) => {
            // Dedup by claim id - the SAME underlying claim can legitimately
            // appear in more than one order if it's been re-batched
            // multiple times (each re-batch creates a genuinely separate
            // order/snapshot). Without this, every prior order it ever
            // belonged to - including older, now-deleted ones - would show
            // up as a separate-looking duplicate row here. orders is
            // oldest-first (see orderedOrders above), so iterating in this
            // order and overwriting by claim.id in a Map naturally keeps
            // only each claim's most recent order.
            const dedupedByClaimId = new Map<number, any>();
            orders.forEach(order => {
              (order?.claims || []).forEach((claim: any) => {
                dedupedByClaimId.set(claim.id, {
                  ...claim,
                  _orderId: order.id,
                  _orderNo: order.orderNo,
                  _batchNo: order.batchNo,
                  // GetWarrantyOrderById's own IsActive tells us definitively
                  // whether this order was deleted - more reliable than
                  // relying on the earlier list response for this.
                  _isOrderDeleted: order.isActive === false
                });
              });
            });
            this.historicalClaims = Array.from(dedupedByClaimId.values());
          },
          error: (err) => {
            // Surfaced instead of console-only - a silent failure here
            // looks identical to "genuinely no other orders exist", which
            // is misleading when other orders actually do exist in the DB.
            console.error('Failed to load historical claims:', err);
            const serverMsg = err?.error?.title || err?.error || err?.message || 'Unknown error';
            this.toaster.show(`Could not load historical claims (status ${err?.status}): ${serverMsg}`, {
              classname: 'bg-danger text-white',
              delay: 5000
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to load order list for history:', err);
        const serverMsg = err?.error?.title || err?.error || err?.message || 'Unknown error';
        this.toaster.show(`Could not search for historical orders (status ${err?.status}): ${serverMsg}`, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

    preloadClaimFromQueryParam(claimId: number): void {
    this.loader.show();
    this.wasApprovedOnLoad = false;
    this.loadHistoricalClaims(0);
    this.warrantyOrderService.getWarrantyJCClaimById(claimId).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.selectedClaims.push(res);

        if (res.supplierId) this.selectedSupplierId = res.supplierId;

        if (res.serviceLocation) {
          this.locationList = [{ loccode: res.serviceLocation, locname: res.locationName || res.serviceLocation }];
          this.selectedLocation = res.serviceLocation;
        }

        // Claim is now visible in the grid, unchecked. Nothing is saved to
        // the DB until the user checks its box and clicks Save.
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Could not load the claim just saved.', {
          classname: 'bg-warning text-white',
          delay: 3000
        });
      }
    });
  }

  // Removes a claim and persists immediately (no separate Save click needed) -
  // different from checkbox approval, which still requires an explicit Save.
  removeClaim(claimId: number): void {
    const remainingClaims = this.selectedClaims.filter(c => c.id !== claimId);

    if (remainingClaims.length === 0) {
      // Saving with zero claims isn't valid (see saveWarrantyOrder's own
      // check) - reverting locally here instead of removing it and then
      // failing to persist, which would leave the grid showing something
      // the DB doesn't actually reflect.
      this.toaster.show(
        'Cannot remove the only claim on this order - use Delete Order instead if you want to remove it entirely.',
        { classname: 'bg-warning text-white', delay: 4000 }
      );
      return;
    }

    this.selectedClaims = remainingClaims;

    if (this.orderId > 0) {
      // Order already exists in the DB - persist the removal right away.
      this.saveWarrantyOrder();
    }
    // If orderId is 0, this order was never saved in the first place, so
    // there's nothing in the DB to remove - the local update above is enough.
  }

  // Updates the real claim object (current OR historical) - purely local
  // state either way now. Nothing saves from a checkbox toggle alone
  // anymore; the single Save button below pushes everything (current
  // order's changes AND any touched historical orders) in one explicit
  // action. This replaces the earlier "historical toggles save
  // immediately" design, which caused timing/visual issues with
  // select-all and repeated toggling.
  toggleClaimApproval(claimId: number, checked: boolean, historicalOrderId?: number): void {
    if (historicalOrderId) {
      const claim = this.historicalClaims.find(c => c.id === claimId);
      if (claim) {
        claim.isApproved = checked;
      }
      return;
    }

    const currentClaim = this.selectedClaims.find(c => c.id === claimId);
    if (currentClaim) {
      currentClaim.isApproved = checked;
      // Save's disabled state reacts live to isApproved (see the template) -
      // by explicit request, unchecking the only approved claim disables
      // Save immediately, before it can be clicked to save that uncheck.
    }
  }

  // Fetches one historical order once, applies ALL given claim-approval
  // updates to it in memory, then saves once - avoids firing multiple
  // overlapping fetch-then-write round trips for the same order (which
  // could silently lose an update if two calls raced each other). Called
  // only from saveWarrantyOrder() now, never directly from a checkbox.
  private saveHistoricalOrderApprovals(orderId: number, updates: { claimId: number; isApproved: boolean }[]): Observable<any> {
    return this.warrantyOrderService.getWarrantyOrderById(orderId).pipe(
      switchMap((order: any) => {
        const claims = order?.claims || [];
        const updateMap = new Map(updates.map(u => [u.claimId, u.isApproved]));

        const claimApprovals = claims.map((c: any) => ({
          claimId: c.id,
          isApproved: updateMap.has(c.id) ? updateMap.get(c.id) : !!c.isApproved
        }));

        const model = {
          id: order.id,
          dealerCode: this.storageService.getDealerCode(),
          dateFrom: order.dateFrom,
          dateTo: order.dateTo,
          batchNo: order.batchNo,
          batchDate: order.batchDate,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          location: order.location,
          claimType: order.claimType,
          supplierId: order.supplierId,
          isApproved: claimApprovals.some((a: any) => a.isApproved),
          warrantyClaimIds: claims.map((c: any) => c.id),
          claimApprovals
        };

        return this.warrantyOrderService.updateWarrantyOrder(model);
      })
    );
  }

  // For a historical claim whose original order was deleted: generates
  // fresh Batch No / Order No and inserts a brand-new order containing
  // just this one claim, already approved (checking it is what triggered
  // this in the first place). Never updates the deleted order itself -
  // UpdateWarrantyOrder would reject that (requires IsActive=true).
  private createNewOrderForClaim(claim: any): Observable<any> {
    const dealerCode = this.storageService.getDealerCode();

    // The historical claim object comes from GetWarrantyOrderById, which
    // reconstructs claims from the WarrantyOrderGridDetail snapshot - that
    // snapshot only ever stored LocationName (display text), never the
    // raw location code, so claim.serviceLocation is always undefined
    // here. Re-fetching the claim directly gets the real code via the same
    // resolution GetWarrantyJCClaimById already uses correctly for new claims.
    return this.warrantyOrderService.getWarrantyJCClaimById(claim.id).pipe(
      switchMap((freshClaim: any) =>
        this.warrantyOrderService.getNextOrderNumbers(dealerCode).pipe(
          switchMap((numbers: any) => {
            const model = {
              id: 0,
              dealerCode: dealerCode,
              dateFrom: this.dateFrom,
              dateTo: this.dateTo,
              batchNo: numbers.batchNo,
              batchDate: this.formatDate(new Date()),
              orderNo: numbers.orderNo,
              orderDate: this.formatDate(new Date()),
              location: freshClaim.serviceLocation || this.selectedLocation,
              claimType: this.claimType,
              supplierId: freshClaim.supplierId || this.selectedSupplierId,
              isApproved: true,
              warrantyClaimIds: [claim.id],
              claimApprovals: [{ claimId: claim.id, isApproved: true }]
            };

            return this.warrantyOrderService.insertWarrantyOrder(model);
          })
        )
      )
    );
  }

  // Fires once, right after a new claim's order auto-saves for the first
  // time. Creates a brand-new, UNAPPROVED invoice batching just this one
  // order - by explicit request, the order stays unapproved too (this
  // does not change the order's own approval state at all, only adds a
  // matching invoice record). Fire-and-forget: errors are logged but don't
  // interrupt the order's own save flow, since the order itself already
  // saved successfully by the time this runs.
  //
  // batchNo is now REUSED directly from the order that was just saved
  // (this.batchNo), rather than generated independently via
  // getNextInvoiceNumbers - per explicit request, the Invoice's Batch No
  // should match its Order's Batch No exactly. Orders and Invoices aren't
  // created in perfect 1:1 lockstep, so their own independent counters
  // (GetNextOrderNumbers vs GetNextInvoiceNumbers) naturally drift apart
  // over time - that mismatch was the actual root cause (Order showed
  // "18/BT/26-27", Invoice showed "21/BT/26-27" for the same batch).
  // invoicePrefix/invoiceNo are untouched - those remain the Invoice's own
  // genuinely separate sequential identifiers.
  private autoCreateInvoiceForOrder(orderId: number): void {
    const dealerCode = this.storageService.getDealerCode();

    this.warrantyInvoiceService.getNextInvoiceNumbers(dealerCode).subscribe({
      next: (numbers: any) => {
        const model = {
          id: 0,
          dealerCode: dealerCode,
          dateFrom: this.dateFrom,
          dateTo: this.dateTo,
          batchNo: this.batchNo, // reused from the order, not numbers.batchNo
          batchDate: this.formatDate(new Date()),
          invoicePrefix: numbers.invoicePrefix,
          invoiceNo: numbers.invoiceNo,
          invoiceDate: this.formatDate(new Date()),
          claimType: this.claimType,
          supplierId: this.selectedSupplierId,
          isApproved: false, // not fully approved, by explicit request
          warrantyOrderIds: [orderId],
          orderApprovals: [{ orderId, isApproved: false }]
        };

        this.warrantyInvoiceService.insertWarrantyInvoice(model).subscribe({
          next: () => {
            // Silent on success - this is a background side effect of
            // saving the claim/order, not something that needs its own
            // toast on top of the order's own "saved successfully" one.
          },
          error: (err) => {
            console.error('Failed to auto-create invoice for order:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to get next invoice numbers for auto-create:', err);
      }
    });
  }

  // Header "select all" checkbox - checked only when every linked claim is
  // approved (current AND historical), and there's at least one claim.
  get allClaimsApproved(): boolean {
    const allClaims = [...this.historicalClaims, ...this.selectedClaims];
    return allClaims.length > 0 && allClaims.every(c => !!c.isApproved);
  }

  toggleSelectAllApproved(checked: boolean): void {
    // Purely local for both groups now - Save pushes everything at once.
    this.selectedClaims.forEach(c => c.isApproved = checked);
    this.historicalClaims.forEach(c => c.isApproved = checked);
  }

  // Order-level approval is now derived, not manually set - the order is
  // considered approved as soon as at least one linked claim is approved.
  get isApproved(): boolean {
    return this.selectedClaims.some(c => !!c.isApproved);
  }

  // Separate from isApproved above (which stays scoped to selectedClaims
  // only, since it's used directly in the order's own save payload).
  // This one also considers historicalClaims, so checking an individual
  // historical claim (e.g. to re-batch a deleted order's claim) enables
  // Save even when the current order itself has zero claims of its own -
  // saveWarrantyOrder() already handles that case correctly; this just
  // lets the button actually be clicked to reach it.
  get hasAnyCheckedClaim(): boolean {
    return this.isApproved || this.historicalClaims.some(c => !!c.isApproved);
  }

  get totalClaims(): number {
    return this.selectedClaims.length;
  }

  // Flattens a claims array (each carrying a .details[] of part/labour
  // lines) into one row per line item, repeating the claim/jobcard/
  // invoice/chassis/party info on every line. isFirstLineOfClaim marks
  // where to show the per-claim "Remove" button (only ever true for the
  // CURRENT order's own rows - historical rows never show it).
  private buildRowsFromClaims(claims: any[], startSrNo: number, isHistorical: boolean): any[] {
    const rows: any[] = [];
    let srNo = startSrNo;

    claims.forEach(claim => {
      const lines = (claim.details && claim.details.length > 0) ? claim.details : [null];

      lines.forEach((line: any, i: number) => {
        rows.push({
          srNo: srNo++,
          claimId: claim.id,
          isFirstLineOfClaim: i === 0,
          isApproved: !!claim.isApproved,
          isHistorical,
          orderId: claim._orderId ?? this.orderId,
          isOrderDeleted: !!claim._isOrderDeleted,
          orderNo: claim._orderNo ?? this.orderNo,
          batchNo: claim._batchNo ?? this.batchNo,

          claimNo: `${claim.claimPrefix || ''}${claim.claimNo || ''}`,
          claimDate: claim.claimDate,

          jobCardNo: claim.jobCardNo,       // ASSUMPTION - see chat note
          jobCardDate: claim.jobCardDate,   // ASSUMPTION - see chat note

          invoiceNo: claim.invoiceNo,       // ASSUMPTION - see chat note
          invoiceDate: claim.invoiceDate,   // ASSUMPTION - see chat note

          serviceHead: claim.serviceHead,
          kms: claim.kms,

          locationName: claim.locationName || '',

          chassisNo: claim.chassisNo,
          motorNo: claim.motorNo,           // ASSUMPTION - see chat note
          partyName: claim.partyName,

          partName: line?.partName || '',
          partDescription: line?.partDescription || '',
          partCode: line?.partCode || '',
          labourCode: line?.labourCode || '',
          labourDescription: line?.labourDescription || '',
          quantity: line?.quantity ?? '',
          cgstPercent: line?.cgstPercent ?? 0,
          cgstAmount: line?.cgstAmount ?? 0,
          sgstPercent: line?.sgstPercent ?? 0,
          sgstAmount: line?.sgstAmount ?? 0,
          igstPercent: line?.igstPercent ?? 0,
          igstAmount: line?.igstAmount ?? 0,
          totalAmount: line?.totalAmount ?? 0,
          mrp: line?.mrp ?? 0
        });
      });
    });

    return rows;
  }

  // Historical (other orders') rows first - oldest first, so the current
  // order's own rows render last, i.e. "below the previous entry". Only
  // the non-historical rows are ever wired to checkbox/remove/save actions.
  get claimLineRows(): any[] {
    const historicalRows = this.buildRowsFromClaims(this.historicalClaims, 1, true);
    const currentRows = this.buildRowsFromClaims(this.selectedClaims, historicalRows.length + 1, false);
    return [...historicalRows, ...currentRows];
  }

  saveWarrantyOrder(navigateAfter: boolean = true): void {

    if (this.saving) return;

    // Computed up front, before validation - a checked historical claim
    // from a deleted order (re-batch) or an approval change on a still-
    // active historical order can be valid to save even when the CURRENT
    // order has zero claims of its own (e.g. landed on a blank form
    // specifically to re-batch something). The validations below only
    // apply to the main/current order when it actually has something to save.
    const updatesByOrderId = new Map<number, { claimId: number; isApproved: boolean }[]>();
    const deletedOrderClaimsToRebatch: any[] = [];

    this.historicalClaims.forEach(c => {
      const histOrderId = c._orderId;
      if (!histOrderId) return;

      if (c._isOrderDeleted) {
        if (c.isApproved) {
          deletedOrderClaimsToRebatch.push(c);
        }
        return;
      }

      if (!updatesByOrderId.has(histOrderId)) updatesByOrderId.set(histOrderId, []);
      updatesByOrderId.get(histOrderId)!.push({ claimId: c.id, isApproved: !!c.isApproved });
    });

    const hasHistoricalWork = updatesByOrderId.size > 0 || deletedOrderClaimsToRebatch.length > 0;
    const savingMainOrder = this.selectedClaims.length > 0;
    const isNewOrderInsert = savingMainOrder && this.orderId === 0;

    if (!savingMainOrder && !hasHistoricalWork) {
      this.toaster.show('No Warranty Claim is linked to this order.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    // The main order's own field validations only matter if we're actually
    // going to insert/update it - skipped entirely when only historical
    // work (re-batch/approval updates) is being saved.
    if (savingMainOrder) {
      if (!this.dateFrom || !this.dateTo) {
        this.toaster.show('Please select Date From and Date To.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.batchNo || !this.batchDate) {
        this.toaster.show('Batch No / Batch Date missing - please refresh the page.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.orderNo || !this.orderDate) {
        this.toaster.show('Order No / Order Date missing - please refresh the page.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.selectedLocation) {
        this.toaster.show('Please select a Location.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.claimType) {
        this.toaster.show('Please select a Claim Type.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.selectedSupplierId) {
        this.toaster.show('Please select a Supplier.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
    }

    const dealerCode = this.storageService.getDealerCode();

    this.saving = true;
    this.loader.show();

    // Only insert/update the main order when it actually has claims of its
    // own - an empty order isn't meaningful to save, and the backend's own
    // validation would reject it anyway.
    const request$: Observable<any> = savingMainOrder
      ? (this.orderId > 0
          ? this.warrantyOrderService.updateWarrantyOrder({
              id: this.orderId,
              dealerCode: dealerCode,
              dateFrom: this.dateFrom,
              dateTo: this.dateTo,
              batchNo: this.batchNo,
              batchDate: this.batchDate,
              orderNo: this.orderNo,
              orderDate: this.orderDate,
              location: this.selectedLocation,
              claimType: this.claimType,
              supplierId: this.selectedSupplierId,
              isApproved: this.isApproved,
              warrantyClaimIds: this.selectedClaims.map(c => c.id),
              claimApprovals: this.selectedClaims.map(c => ({ claimId: c.id, isApproved: !!c.isApproved }))
            })
          : this.warrantyOrderService.insertWarrantyOrder({
              id: this.orderId,
              dealerCode: dealerCode,
              dateFrom: this.dateFrom,
              dateTo: this.dateTo,
              batchNo: this.batchNo,
              batchDate: this.batchDate,
              orderNo: this.orderNo,
              orderDate: this.orderDate,
              location: this.selectedLocation,
              claimType: this.claimType,
              supplierId: this.selectedSupplierId,
              isApproved: this.isApproved,
              warrantyClaimIds: this.selectedClaims.map(c => c.id),
              claimApprovals: this.selectedClaims.map(c => ({ claimId: c.id, isApproved: !!c.isApproved }))
            }))
      : of(null); // nothing to save for the main order this time

    // Historical claims split two ways:
    // 1. From a still-active order -> update that order in place, same as
    //    before, batched one request per distinct order.
    // 2. From a DELETED order, and now checked -> that order can't be
    //    updated (UpdateWarrantyOrder requires IsActive=true), so instead
    //    a brand-new order is created for just that one claim. Unchecked
    //    deleted-order claims are skipped entirely - nothing to do for them.
    const historicalUpdateRequests$ = Array.from(updatesByOrderId.entries())
      .map(([histOrderId, updates]) => this.saveHistoricalOrderApprovals(histOrderId, updates));

    const rebatchRequests$ = deletedOrderClaimsToRebatch
      .map(claim => this.createNewOrderForClaim(claim));

    forkJoin([request$, ...historicalUpdateRequests$, ...rebatchRequests$]).subscribe({
      next: ([res]: any[]) => {
        this.saving = false;
        this.loader.hide();
        this.toaster.show(
          savingMainOrder
            ? (this.orderId > 0 ? 'Warranty Order updated successfully.' : 'Warranty Order saved successfully.')
            : 'Changes saved successfully.',
          { classname: 'bg-success text-white', delay: 3000 }
        );

        sessionStorage.removeItem('pendingWarrantyOrderClaim');

        // Only fires when this Save click just created a brand-new order (i.e.
        // the user checked a claim's box and clicked Save for the first time) -
        // fire-and-forget, doesn't block navigation either way.
        const orderJustBecameApproved = savingMainOrder && !this.wasApprovedOnLoad && this.isApproved;

        if (orderJustBecameApproved) {
          const savedOrderId = res?.orderId ?? this.orderId;
          if (savedOrderId) {
            this.autoCreateInvoiceForOrder(Number(savedOrderId));
          }
        }

// Prevent re-firing invoice creation on a second Save within the same
// session (e.g. navigateAfter=false keeps the component alive without a
// fresh GET) - the unapproved -> approved transition only happens once.
this.wasApprovedOnLoad = this.isApproved;

        if (navigateAfter) {
          this.router.navigate(['/warranty-order-list']);
        } else {
          const savedId = res?.orderId ?? this.orderId;
          if (savedId) {
            this.orderId = Number(savedId);
          }
          this.loadHistoricalClaims(this.orderId);
        }
      },
      error: (err) => {
        this.loader.hide();
        this.saving = false;
        console.error('Validation errors:', err?.error);
        const serverMsg = err?.error?.title || err?.error || 'Something went wrong. Check console for details.';
        this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/warranty-order']);
  }

  goToApprovedList(): void {
    this.router.navigate(['/warranty-order-list']);
  }

  // --- Edit mode --------------------------------------------------------
  // Only meaningful for an already-saved order (orderId > 0). Enables
  // removing a claim from the grid and changing Location/Claim Type, then
  // requires an explicit Save Changes to persist - nothing here writes to
  // the DB until saveWarrantyOrder() is called.

  enableEdit(): void {
    if (this.orderId > 0) {
      this.isEditMode = true;
    }
  }

  saveEditedOrder(): void {
    this.saveWarrantyOrder();
    // isEditMode is reset to false inside loadExistingOrder's next handler,
    // which saveWarrantyOrder() calls after a successful save.
  }

  cancelEdit(): void {
    // Discard any unsaved local changes (e.g. a removed claim) by re-fetching
    // the order fresh from the DB.
    this.isEditMode = false;
    if (this.orderId > 0) {
      this.loadExistingOrder(this.orderId);
    }
  }

  // --- Delete --------------------------------------------------------------

  deleteOrder(): void {
    if (!(this.orderId > 0)) {
      this.toaster.show('Nothing to delete - this order has not been saved yet.', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this Warranty Order? This cannot be undone from this screen.')) {
      return;
    }

    this.loader.show();
    this.warrantyOrderService.deleteWarrantyOrder(this.orderId).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Order deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
        this.router.navigate(['/warranty-order-list']);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to delete the Warranty Order.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }
}