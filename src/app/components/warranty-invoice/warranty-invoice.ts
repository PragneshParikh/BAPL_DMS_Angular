// src\app\components\warranty-invoice\warranty-invoice.ts
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
import { WarrantyInvoiceService } from '../../core/services/warranty-invoice-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-warranty-invoice',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-invoice.html',
  styleUrl: './warranty-invoice.scss',
})
export class WarrantyInvoice implements OnInit {
  readonly SUBMENU_ID = 113;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  invoiceId: number = 0; // 0 = create, otherwise the Id being edited

  dateFrom: string = '';
  dateTo: string = '';
  batchNo: string = '';       // auto-generated, read-only on the form
  batchDate: string = '';
  invoicePrefix: string = ''; // new prefix concept, mirrors ClaimPrefix
  invoiceNo: string = '';     // auto-generated, read-only on the form
  invoiceDate: string = '';
  claimType: string = 'Warranty';
  selectedSupplierId: number | null = null;

  // Selectable dropdown, not locked - defaults to the linked order's own
  // location, but the user can freely pick a different one. No
  // locareaidno filter, deliberately - that exact filter caused a real,
  // confirmed bug on the Warranty Order page (excluded a valid location
  // just because it wasn't tagged locareaidno=2).
  selectedLocation: string | null = null;
  locationList: any[] = [];

  // The REAL Repair Bill No - pulled from the linked order's own claim
  // (claim.invoiceNo, which the backend derives from RepairBillHeader:
  // "{Prefix}{BillNo}"). Distinct from invoiceNo below, which is this
  // invoice's own separate auto-generated sequential number (same
  // category as batchNo) - the two are unrelated values that happened to
  // share a confusingly similar name.
  repairBillNo: string | null = null;
  repairBillDate: string | null = null;

  supplierList: any[] = [];

  // Orders linked to this invoice - populated only via the pending-order
  // handoff (create) or from the saved invoice (edit). Mirrors
  // selectedClaims's role one level up.
  selectedOrders: any[] = [];

  // Orders from OTHER (previously saved) invoices, shown stacked above the
  // current invoice's own orders so a user can see everything on one
  // screen. Strictly read-only. Mirrors historicalClaims's role.
  historicalOrders: any[] = [];
  private readonly maxHistoricalInvoices = 10;

  saving = false;
  isEditMode = false;

  // Captured once when an existing invoice loads - true only if it was
  // ALREADY approved before any interaction this page load. Mirrors
  // wasApprovedOnLoad's role in warranty-order.ts exactly - keeps Save
  // enabled even after unchecking an already-approved invoice.
  wasApprovedOnLoad = false;

  // True while the post-save ERP submission is in flight. Kept entirely
  // separate from `saving` (the DB save) - a failure here never blocks or
  // rolls back the DB save, which has already completed successfully by
  // the time this runs.
  sendingToErp = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private toaster: ToastService,
    private warrantyInvoiceService: WarrantyInvoiceService,
    private menuAccess: MenuAccessService
  ) { 
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    const today = new Date();
    this.invoiceDate = this.formatDate(today);
    this.batchDate = this.formatDate(today);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = this.formatDate(firstDayOfMonth);
    this.dateTo = this.formatDate(today);

    this.loadSuppliers();

    const routeId = this.route.snapshot.paramMap.get('id');

    // Same sessionStorage handoff pattern as viewWarrantyOrderId - set by
    // the Warranty Invoice List's "View" action.
    const viewInvoiceId = sessionStorage.getItem('viewWarrantyInvoiceId');

    // Same pattern as pendingWarrantyOrderClaim - set when an order is
    // approved and the user is meant to batch it into a new/existing
    // invoice. Whatever screen triggers this flow should set this key.
    const pendingRaw = sessionStorage.getItem('pendingWarrantyInvoiceOrder');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

    if (viewInvoiceId) {
      sessionStorage.removeItem('viewWarrantyInvoiceId');
      this.invoiceId = Number(viewInvoiceId);
      this.loadExistingInvoice(this.invoiceId);
    } else if (routeId) {
      this.invoiceId = Number(routeId);
      this.loadExistingInvoice(this.invoiceId);
    } else if (pending?.orderId) {
      this.wasApprovedOnLoad = false;
      this.loadNextInvoiceNumbers();
      this.preloadOrderFromQueryParam(Number(pending.orderId));
    } else {
      // includeInactive omitted (defaults to false) - same reasoning as
      // loadLatestSavedOrder: a fresh landing shouldn't get stuck showing
      // a just-deleted invoice it can no longer save changes to.
      this.loadLatestSavedInvoice();
    }
  }

  loadLatestSavedInvoice(): void {
    this.warrantyInvoiceService.searchWarrantyInvoices({ pageNumber: 1, pageSize: 1 }).subscribe({
      next: (res: any) => {
        const items = res?.items || [];
        if (items.length > 0) {
          this.invoiceId = items[0].id;
          this.loadExistingInvoice(this.invoiceId);
        } else {
          this.loadNextInvoiceNumbers();
          this.loadHistoricalInvoiceOrders(0);
        }
      },
      error: (err) => {
        console.error('loadLatestSavedInvoice failed:', err);
        this.toaster.show('Could not load the last saved invoice.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
        this.loadNextInvoiceNumbers();
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

  // Shows only this order's own location as the sole dropdown option - not
  // a full dealer-wide list. Same simplification already applied on
  // warranty-order.ts: no matching/searching involved, so this also
  // sidesteps the cross-dealer mismatch entirely (the code can
  // legitimately belong to a different dealer than the one viewing it).
  private setLocationFromOrder(loccode: string | null | undefined, locname: string | null | undefined): void {
    if (loccode) {
      this.locationList = [{ loccode, locname: locname || loccode }];
      this.selectedLocation = loccode;
    } else {
      this.locationList = [];
      this.selectedLocation = null;
    }
  }

  // batchNo is deliberately NOT set here anymore, per explicit request -
  // it should stay blank until an order is actually linked
  // (preloadOrderFromQueryParam then copies THAT order's own batchNo),
  // rather than auto-generating an independent value from a separate
  // counter that naturally drifts from the order's own Batch No over
  // time (the root cause fixed last time for the backend auto-create
  // path - this closes the same gap for this manual form-load path).
  // invoicePrefix/invoiceNo are untouched - those remain genuinely
  // separate, auto-generated identifiers.
  loadNextInvoiceNumbers(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.warrantyInvoiceService.getNextInvoiceNumbers(dealerCode).subscribe({
      next: (res: any) => {
        this.invoicePrefix = res.invoicePrefix;
        this.invoiceNo = res.invoiceNo;
      },
      error: (err) => {
        console.error(err);
        this.toaster.show('Could not auto-generate Invoice No. Please refresh and try again.', {
          classname: 'bg-warning text-white',
          delay: 3000
        });
      }
    });
  }

  loadExistingInvoice(id: number): void {
    this.loader.show();
    this.warrantyInvoiceService.getWarrantyInvoiceById(id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.dateFrom = res.dateFrom?.substring(0, 10);
        this.dateTo = res.dateTo?.substring(0, 10);
        this.batchNo = res.batchNo;
        this.batchDate = res.batchDate?.substring(0, 10);
        this.invoicePrefix = res.invoicePrefix || '';
        this.invoiceNo = res.invoiceNo;
        this.invoiceDate = res.invoiceDate?.substring(0, 10);
        this.claimType = res.claimType;
        this.selectedSupplierId = res.supplierId;

        this.selectedOrders = res.orders || [];
        this.setLocationFromOrder(this.selectedOrders[0]?.location, this.selectedOrders[0]?.locationName);
        const firstClaim = this.selectedOrders[0]?.claims?.[0];
        this.repairBillNo = firstClaim?.invoiceNo || null;
        this.repairBillDate = firstClaim?.invoiceDate?.substring(0, 10) || null;
        this.isEditMode = false;
        this.wasApprovedOnLoad = !!res.isApproved;

        this.loadHistoricalInvoiceOrders(id);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load Warranty Invoice.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  // Loads recent OTHER invoices' orders for read-only display, stacked
  // above the current invoice's own orders. Mirrors loadHistoricalClaims
  // exactly, one level up.
  loadHistoricalInvoiceOrders(currentInvoiceId: number): void {
    this.warrantyInvoiceService.searchWarrantyInvoices({
      pageNumber: 1,
      pageSize: this.maxHistoricalInvoices + 1,
      includeInactive: true
    }).subscribe({
      next: (res: any) => {
        const otherInvoices: any[] = (res?.items || [])
          .filter((i: any) => i.id !== currentInvoiceId)
          .slice(0, this.maxHistoricalInvoices);

        if (otherInvoices.length === 0) {
          this.historicalOrders = [];
          return;
        }

        const orderedInvoices = [...otherInvoices].reverse(); // oldest first

        const requests = orderedInvoices.map(i => this.warrantyInvoiceService.getWarrantyInvoiceById(i.id));
        forkJoin(requests).subscribe({
          next: (invoices: any[]) => {
            // Dedup by order id - same reasoning as historicalClaims: the
            // same order can appear across multiple invoices if it was
            // ever re-batched, and only the most recent invoice's version
            // should show.
            const dedupedByOrderId = new Map<number, any>();
            invoices.forEach(invoice => {
              (invoice?.orders || []).forEach((order: any) => {
                dedupedByOrderId.set(order.id, {
                  ...order,
                  _invoiceId: invoice.id,
                  _invoicePrefix: invoice.invoicePrefix,
                  _invoiceNo: invoice.invoiceNo,
                  _batchNo: invoice.batchNo,
                  _isInvoiceDeleted: invoice.isActive === false
                });
              });
            });
            this.historicalOrders = Array.from(dedupedByOrderId.values());
          },
          error: (err) => console.error('Failed to load historical invoice orders:', err)
        });
      },
      error: (err) => console.error('Failed to load invoice list for history:', err)
    });
  }

  // Preloads a single order that was just approved and handed off here to
  // be batched into a new invoice. Mirrors preloadClaimFromQueryParam
  // exactly, one level up. No auto-save - by explicit, confirmed prior
  // decision for the Order/Claim relationship, nothing here should assume
  // that decision differently without being told to.
  preloadOrderFromQueryParam(orderId: number): void {
    this.loader.show();
    this.loadHistoricalInvoiceOrders(0);
    this.warrantyInvoiceService.getWarrantyOrderById(orderId).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.selectedOrders.push({
          id: res.id,
          orderNo: res.orderNo,
          orderDate: res.orderDate,
          batchNo: res.batchNo,
          batchDate: res.batchDate,
          location: res.location,
          locationName: res.locationName,
          claimType: res.claimType,
          supplierId: res.supplierId,
          totalClaims: (res.claims || []).length,
          totalAmount: (res.claims || []).flatMap((c: any) => c.details || [])
            .reduce((sum: number, d: any) => sum + (d.totalAmount || 0), 0),
          isApproved: false, // starts unchecked - checkbox approval is required again, per explicit request reversing the earlier "linking is itself approval" decision
          claims: res.claims || []
        });

        // Invoice's own Batch No now comes directly from the order just
        // linked here - per explicit request, this replaces whatever
        // (blank, since loadNextInvoiceNumbers no longer sets it)
        // was there before. Matches the same order.batchNo reuse already
        // applied to the backend auto-create/re-batch paths.
        this.batchNo = res.batchNo;

        this.setLocationFromOrder(res.location, res.locationName);
        const firstClaim = (res.claims || [])[0];
        this.repairBillNo = firstClaim?.invoiceNo || null;
        this.repairBillDate = firstClaim?.invoiceDate?.substring(0, 10) || null;

        if (res.supplierId) this.selectedSupplierId = res.supplierId;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Could not load the order just approved.', {
          classname: 'bg-warning text-white',
          delay: 3000
        });
      }
    });
  }

  // Removes an order and persists immediately, same as removeClaim's
  // pattern one level up.
  removeOrder(orderId: number): void {
    const remaining = this.selectedOrders.filter(o => o.id !== orderId);

    if (remaining.length === 0) {
      this.toaster.show(
        'Cannot remove the only order on this invoice - use Delete Invoice instead if you want to remove it entirely.',
        { classname: 'bg-warning text-white', delay: 4000 }
      );
      return;
    }

    this.selectedOrders = remaining;

    if (this.invoiceId > 0) {
      this.saveWarrantyInvoice();
    }
  }

  // Reversed back to checkbox-driven approval, per explicit request -
  // an order is approved only once its own checkbox is checked, same as
  // warranty-order.ts's own isApproved getter (linking alone is no longer
  // sufficient by itself).
  get isApproved(): boolean {
    return this.selectedOrders.some(o => !!o.isApproved);
  }

  // Also considers historicalOrders, mirroring warranty-order.ts's
  // hasAnyCheckedClaim exactly - checking a historical order (e.g. to
  // re-batch a deleted invoice's order) enables Save even when the
  // current invoice has zero orders of its own.
  get hasAnyCheckedOrder(): boolean {
    return this.isApproved || this.historicalOrders.some(o => !!o.isApproved);
  }

  // Header "select all" checkbox - checked only when every linked order is
  // approved (current AND historical), and there's at least one order.
  // Mirrors warranty-order.ts's allClaimsApproved exactly.
  get allOrdersApproved(): boolean {
    const allOrders = [...this.historicalOrders, ...this.selectedOrders];
    return allOrders.length > 0 && allOrders.every(o => !!o.isApproved);
  }

  toggleSelectAllApproved(checked: boolean): void {
    this.selectedOrders.forEach(o => o.isApproved = checked);
    this.historicalOrders.forEach(o => o.isApproved = checked);
  }

  // Updates the real order object (current OR historical) - purely local
  // state, same as warranty-order.ts's toggleClaimApproval. Nothing saves
  // from a checkbox toggle alone - the Save button pushes everything at
  // once.
  toggleOrderApproval(orderId: number, checked: boolean, historicalInvoiceId?: number): void {
    if (historicalInvoiceId) {
      const order = this.historicalOrders.find(o => o.id === orderId);
      if (order) {
        order.isApproved = checked;
      }
      return;
    }

    const currentOrder = this.selectedOrders.find(o => o.id === orderId);
    if (currentOrder) {
      currentOrder.isApproved = checked;
    }
  }

  get totalOrders(): number {
    return this.selectedOrders.length;
  }

  // Flattens orders -> claims -> line items into one row per line, same
  // approach as warranty-order.ts's buildRowsFromClaims/claimLineRows, one
  // hierarchy level deeper (order -> claim -> line, instead of just
  // claim -> line). isFirstLineOfClaim marks where the claim's own header
  // fields (Claim No, JobCard No, etc.) should visually anchor, mirroring
  // the Warranty Order grid's own row structure exactly.
 private buildInvoiceRowsFromOrders(orders: any[], startSrNo: number, isHistorical: boolean): any[] {
    const rows: any[] = [];
    let srNo = startSrNo;

    orders.forEach(order => {
      // Skip orders with no linked claims entirely - these render as an
      // all-blank row (only order-level Location/Party fill in) since
      // there's nothing claim-level to show. Typically an order whose
      // only claim(s) were later deleted, leaving zero
      // WarrantyOrderGridDetail rows behind.
      if (!order.claims || order.claims.length === 0) {
        return;
      }

      const claims = order.claims;

      claims.forEach((claim: any) => {
        // Skip claims with no line items too, for the same reason - a
        // claim with an empty details[] would otherwise still emit one
        // blank line row.
        if (!claim?.details || claim.details.length === 0) {
          return;
        }

        claim.details.forEach((line: any, i: number) => {
          rows.push({
            srNo: srNo++,
            orderId: order.id,
            isHistorical,

            claimId: claim.id,
            isFirstLineOfClaim: i === 0,
            isApproved: !!order.isApproved,

            claimNo: `${claim.claimPrefix || ''}${claim.claimNo || ''}`,
            claimDate: claim.claimDate,

            jobCardNo: claim.jobCardNo,
            jobCardDate: claim.jobCardDate,

            invoiceNo: claim.invoiceNo,
            invoiceDate: claim.invoiceDate,

            // The PARENT invoice's own identifying fields, per row - shows
            // "which invoice" this row belongs to. For historical rows,
            // these came from the tagging in loadHistoricalInvoiceOrders
            // (_invoicePrefix/_invoiceNo/_batchNo); for current rows, the
            // backend now returns these directly on each order summary.
            warrantyInvoicePrefix: isHistorical ? order._invoicePrefix : order.invoicePrefix,
            warrantyInvoiceNo: isHistorical ? order._invoiceNo : order.invoiceNo,
            warrantyInvoiceBatchNo: isHistorical ? order._batchNo : order.invoiceBatchNo,

            serviceHead: claim.serviceHead,
            kms: claim.kms,

            locationName: claim.locationName || order.locationName || '',

            chassisNo: claim.chassisNo,
            motorNo: claim.motorNo,
            partyName: claim.partyName || order.partyName,

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
    });

    return rows;
  }

  // Historical orders' rows first, then the current invoice's own orders -
  // same ordering convention as claimLineRows.
  get invoiceLineRows(): any[] {
    const historicalRows = this.buildInvoiceRowsFromOrders(this.historicalOrders, 1, true);
    const currentRows = this.buildInvoiceRowsFromOrders(this.selectedOrders, historicalRows.length + 1, false);
    return [...historicalRows, ...currentRows];
  }

  // Fire-and-report ERP submission for a single, just-saved invoice.
  // Deliberately isolated from the DB save's own success/failure state -
  // `saving`/`sendingToErp` are two independent flags, so a failure here
  // never appears to roll back or invalidate the DB save that already
  // completed successfully by the time this runs.
  private sendInvoiceToErp(invoiceId: number): void {
    this.sendingToErp = true;
    this.warrantyInvoiceService.sendWarrantyInvoiceToErp(invoiceId).subscribe({
      next: (res: any) => {
        this.sendingToErp = false;
        if (res?.success) {
          this.toaster.show(`Sent to ERP successfully (${res.linesSent} line(s)).`, {
            classname: 'bg-success text-white',
            delay: 3000
          });
        } else {
          this.toaster.show(`ERP submission failed: ${res?.message || 'Unknown error'}`, {
            classname: 'bg-danger text-white',
            delay: 6000
          });
        }
      },
      error: (err) => {
        this.sendingToErp = false;
        console.error('ERP submission failed:', err);
        const serverMsg = err?.error?.message || err?.error || 'Could not reach the ERP integration.';
        this.toaster.show(`ERP submission failed: ${serverMsg}`, {
          classname: 'bg-danger text-white',
          delay: 6000
        });
      }
    });
  }

  saveWarrantyInvoice(navigateAfter: boolean = true): void {
    if (this.saving) return;

    const updatesByInvoiceId = new Map<number, { orderId: number; isApproved: boolean }[]>();
    const deletedInvoiceOrdersToRebatch: any[] = [];

    this.historicalOrders.forEach(o => {
      const histInvoiceId = o._invoiceId;
      if (!histInvoiceId) return;

      if (o._isInvoiceDeleted) {
        if (o.isApproved) {
          deletedInvoiceOrdersToRebatch.push(o);
        }
        return;
      }

      if (!updatesByInvoiceId.has(histInvoiceId)) updatesByInvoiceId.set(histInvoiceId, []);
      updatesByInvoiceId.get(histInvoiceId)!.push({ orderId: o.id, isApproved: !!o.isApproved });
    });

    const hasHistoricalWork = updatesByInvoiceId.size > 0 || deletedInvoiceOrdersToRebatch.length > 0;
    const savingMainInvoice = this.selectedOrders.length > 0;

    if (!savingMainInvoice && !hasHistoricalWork) {
      this.toaster.show('No Warranty Order is linked to this invoice.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    if (savingMainInvoice) {
      if (!this.dateFrom || !this.dateTo) {
        this.toaster.show('Please select Date From and Date To.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.batchNo || !this.batchDate) {
        this.toaster.show('Batch No / Batch Date missing - please refresh the page.', { classname: 'bg-warning text-white', delay: 3000 });
        return;
      }
      if (!this.invoiceNo || !this.invoiceDate) {
        this.toaster.show('Invoice No / Invoice Date missing - please refresh the page.', { classname: 'bg-warning text-white', delay: 3000 });
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

    const request$: Observable<any> = savingMainInvoice
      ? (this.invoiceId > 0
          ? this.warrantyInvoiceService.updateWarrantyInvoice({
              id: this.invoiceId,
              dealerCode,
              dateFrom: this.dateFrom,
              dateTo: this.dateTo,
              batchNo: this.batchNo,
              batchDate: this.batchDate,
              invoicePrefix: this.invoicePrefix,
              invoiceNo: this.invoiceNo,
              invoiceDate: this.invoiceDate,
              claimType: this.claimType,
              supplierId: this.selectedSupplierId,
              isApproved: this.isApproved,
              warrantyOrderIds: this.selectedOrders.map(o => o.id),
              orderApprovals: this.selectedOrders.map(o => ({ orderId: o.id, isApproved: !!o.isApproved }))
            })
          : this.warrantyInvoiceService.insertWarrantyInvoice({
              id: this.invoiceId,
              dealerCode,
              dateFrom: this.dateFrom,
              dateTo: this.dateTo,
              batchNo: this.batchNo,
              batchDate: this.batchDate,
              invoicePrefix: this.invoicePrefix,
              invoiceNo: this.invoiceNo,
              invoiceDate: this.invoiceDate,
              claimType: this.claimType,
              supplierId: this.selectedSupplierId,
              isApproved: this.isApproved,
              warrantyOrderIds: this.selectedOrders.map(o => o.id),
              orderApprovals: this.selectedOrders.map(o => ({ orderId: o.id, isApproved: !!o.isApproved }))
            }))
      : of(null);

    const historicalUpdateRequests$ = Array.from(updatesByInvoiceId.entries())
      .map(([histInvoiceId, updates]) => this.saveHistoricalInvoiceApprovals(histInvoiceId, updates));

    const rebatchRequests$ = deletedInvoiceOrdersToRebatch
      .map(order => this.createNewInvoiceForOrder(order));

    forkJoin([request$, ...historicalUpdateRequests$, ...rebatchRequests$]).subscribe({
      next: ([res]: any[]) => {
        this.saving = false;
        this.loader.hide();
        this.toaster.show(
          savingMainInvoice
            ? (this.invoiceId > 0 ? 'Warranty Invoice updated successfully.' : 'Warranty Invoice saved successfully.')
            : 'Changes saved successfully.',
          { classname: 'bg-success text-white', delay: 3000 }
        );

        sessionStorage.removeItem('pendingWarrantyInvoiceOrder');

        // Push to ERP only when the main invoice itself was actually
        // inserted/updated this Save - not for pure historical-approval-
        // only saves, which don't touch this invoice's own header/lines.
        // Runs as an independent follow-up step: its own success/failure
        // is reported separately and never affects the DB save above,
        // which has already completed by this point.
        if (savingMainInvoice) {
          const savedInvoiceId = res?.invoiceId ?? this.invoiceId;
          if (savedInvoiceId) {
            this.sendInvoiceToErp(Number(savedInvoiceId));
          }
        }

        if (navigateAfter) {
          this.router.navigate(['/warranty-invoice-list']);
        } else {
          const savedId = res?.invoiceId ?? this.invoiceId;
          if (savedId) {
            this.invoiceId = Number(savedId);
          }
          this.loadHistoricalInvoiceOrders(this.invoiceId);
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

  // Fetches one historical invoice once, applies ALL given order-approval
  // updates to it in memory, then saves once. Mirrors
  // saveHistoricalOrderApprovals exactly.
  private saveHistoricalInvoiceApprovals(invoiceId: number, updates: { orderId: number; isApproved: boolean }[]): Observable<any> {
    return this.warrantyInvoiceService.getWarrantyInvoiceById(invoiceId).pipe(
      switchMap((invoice: any) => {
        const orders = invoice?.orders || [];
        const updateMap = new Map(updates.map(u => [u.orderId, u.isApproved]));

        const orderApprovals = orders.map((o: any) => ({
          orderId: o.id,
          isApproved: updateMap.has(o.id) ? updateMap.get(o.id) : !!o.isApproved
        }));

        const model = {
          id: invoice.id,
          dealerCode: this.storageService.getDealerCode(),
          dateFrom: invoice.dateFrom,
          dateTo: invoice.dateTo,
          batchNo: invoice.batchNo,
          batchDate: invoice.batchDate,
          invoicePrefix: invoice.invoicePrefix,
          invoiceNo: invoice.invoiceNo,
          invoiceDate: invoice.invoiceDate,
          claimType: invoice.claimType,
          supplierId: invoice.supplierId,
          isApproved: orderApprovals.some((a: any) => a.isApproved),
          warrantyOrderIds: orders.map((o: any) => o.id),
          orderApprovals
        };

        return this.warrantyInvoiceService.updateWarrantyInvoice(model);
      })
    );
  }

  // For a historical order whose original invoice was deleted: generates
  // a fresh Invoice No, but REUSES the order's own Batch No (order.batchNo)
  // rather than generating a new, independent one via
  // getNextInvoiceNumbers - same fix and same reasoning as
  // autoCreateInvoiceForOrder in warranty-order.ts: the Invoice's Batch No
  // should match its Order's Batch No, and the two numbers' own
  // independent counters (Order vs Invoice) naturally drift apart over
  // time since they aren't created in perfect 1:1 lockstep.
  private createNewInvoiceForOrder(order: any): Observable<any> {
    const dealerCode = this.storageService.getDealerCode();
    return this.warrantyInvoiceService.getNextInvoiceNumbers(dealerCode).pipe(
      switchMap((numbers: any) => {
        const model = {
          id: 0,
          dealerCode,
          dateFrom: this.dateFrom,
          dateTo: this.dateTo,
          batchNo: order.batchNo, // reused from the order, not numbers.batchNo
          batchDate: this.formatDate(new Date()),
          invoicePrefix: numbers.invoicePrefix,
          invoiceNo: numbers.invoiceNo,
          invoiceDate: this.formatDate(new Date()),
          claimType: this.claimType,
          supplierId: order.supplierId || this.selectedSupplierId,
          isApproved: true,
          warrantyOrderIds: [order.id],
          orderApprovals: [{ orderId: order.id, isApproved: true }]
        };

        return this.warrantyInvoiceService.insertWarrantyInvoice(model);
      })
    );
  }

  cancel(): void {
    this.router.navigate(['/warranty-invoice']);
  }

  goToInvoiceList(): void {
    this.router.navigate(['/warranty-invoice-list']);
  }

  enableEdit(): void {
    if (this.invoiceId > 0) {
      this.isEditMode = true;
    }
  }

  saveEditedInvoice(): void {
    this.saveWarrantyInvoice();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    if (this.invoiceId > 0) {
      this.loadExistingInvoice(this.invoiceId);
    }
  }

  deleteInvoice(): void {
    if (!(this.invoiceId > 0)) {
      this.toaster.show('Nothing to delete - this invoice has not been saved yet.', {
        classname: 'bg-warning text-white',
        delay: 3000
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this Warranty Invoice? This cannot be undone from this screen.')) {
      return;
    }

    this.loader.show();
    this.warrantyInvoiceService.deleteWarrantyInvoice(this.invoiceId).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Invoice deleted successfully.', {
          classname: 'bg-success text-white',
          delay: 3000
        });
        this.router.navigate(['/warranty-invoice-list']);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to delete the Warranty Invoice.', {
          classname: 'bg-danger text-white',
          delay: 3000
        });
      }
    });
  }
}