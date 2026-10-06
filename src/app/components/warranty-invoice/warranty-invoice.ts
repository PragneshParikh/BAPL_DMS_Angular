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

  selectedLocation: string | null = null;
  locationList: any[] = [];

  repairBillNo: string | null = null;
  repairBillDate: string | null = null;

  supplierList: any[] = [];

  selectedOrders: any[] = [];

  historicalOrders: any[] = [];
  private readonly maxHistoricalInvoices = 10;

  saving = false;
  isEditMode = false;

  wasApprovedOnLoad = false;

  // REMOVED: sendingToErp. The ERP push now happens server-side, inside
  // the SAME Insert/UpdateWarrantyInvoice call `saving` already covers -
  // there's no longer a separate async step for this component to track.

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

    const viewInvoiceId = sessionStorage.getItem('viewWarrantyInvoiceId');

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

  private setLocationFromOrder(loccode: string | null | undefined, locname: string | null | undefined): void {
    if (loccode) {
      this.locationList = [{ loccode, locname: locname || loccode }];
      this.selectedLocation = loccode;
    } else {
      this.locationList = [];
      this.selectedLocation = null;
    }
  }

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
          isApproved: false,
          claims: res.claims || []
        });

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

  get isApproved(): boolean {
    return this.selectedOrders.some(o => !!o.isApproved);
  }

  get hasAnyCheckedOrder(): boolean {
    return this.isApproved || this.historicalOrders.some(o => !!o.isApproved);
  }

  get allOrdersApproved(): boolean {
    const allOrders = [...this.historicalOrders, ...this.selectedOrders];
    return allOrders.length > 0 && allOrders.every(o => !!o.isApproved);
  }

  toggleSelectAllApproved(checked: boolean): void {
    this.selectedOrders.forEach(o => o.isApproved = checked);
    this.historicalOrders.forEach(o => o.isApproved = checked);
  }

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

  private buildInvoiceRowsFromOrders(orders: any[], startSrNo: number, isHistorical: boolean): any[] {
    const rows: any[] = [];
    let srNo = startSrNo;

    orders.forEach(order => {
      if (!order.claims || order.claims.length === 0) {
        return;
      }

      const claims = order.claims;

      claims.forEach((claim: any) => {
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

  get invoiceLineRows(): any[] {
    const historicalRows = this.buildInvoiceRowsFromOrders(this.historicalOrders, 1, true);
    const currentRows = this.buildInvoiceRowsFromOrders(this.selectedOrders, historicalRows.length + 1, false);
    return [...historicalRows, ...currentRows];
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
      // next: ([res]: any[]) => {
      //   this.saving = false;
      //   this.loader.hide();
      //   this.toaster.show(
      //     savingMainInvoice
      //       ? (this.invoiceId > 0 ? 'Warranty Invoice updated successfully.' : 'Warranty Invoice saved successfully.')
      //       : 'Changes saved successfully.',
      //     { classname: 'bg-success text-white', delay: 3000 }
      //   );

      //   sessionStorage.removeItem('pendingWarrantyInvoiceOrder');

      //   // FIX: compute the saved invoice's id BEFORE the navigateAfter
      //   // branch below - sendToErp() needs it in both cases (previously
      //   // this was only computed in the non-navigate branch, since nothing
      //   // else needed it before navigating away).
      //   const savedId = res?.invoiceId ?? this.invoiceId;
      //   if (savedId) {
      //     this.invoiceId = Number(savedId);
      //   }

      //   // FIX: ERP submission is no longer bundled into Insert/Update's
      //   // response (res.erp no longer exists) - it's now its own endpoint
      //   // (UATWarrantyData), called explicitly here. See sendToErp() below.
      //   if (savingMainInvoice && savedId) {
      //     this.sendToErp(Number(savedId));
      //   }

      //   if (navigateAfter) {
      //     this.router.navigate(['/warranty-invoice-list']);
      //   } else {
      //     this.loadHistoricalInvoiceOrders(this.invoiceId);
      //   }
      // },
      error: (err) => {
        this.loader.hide();
        this.saving = false;
        console.error('Validation errors:', err?.error);
        const serverMsg = err?.error?.title || err?.error || 'Something went wrong. Check console for details.';
        this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
}

// REPLACES showErpResultToast - the old shape ({ success, message,
// linesSent }) no longer exists on the save response; PostToErpAsync
// now returns the ERP's raw response body directly from its own
// endpoint, so this makes that call explicitly and reports success/
// failure from it.
// private sendToErp(invoiceId: number): void {
//     this.warrantyInvoiceService.UATWarrantyData(invoiceId).subscribe({
//       next: () => {
//         this.toaster.show('Sent to ERP successfully.', {
//           classname: 'bg-success text-white',
//           delay: 3000
//         });
//       },
//       error: (err) => {
//         console.error('ERP submission failed:', err);
//         const serverMsg = err?.error || 'ERP submission failed. You can retry sending this invoice later.';
//         this.toaster.show(serverMsg, {
//           classname: 'bg-danger text-white',
//           delay: 6000
//         });
//       }
//     });
// }
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

  private createNewInvoiceForOrder(order: any): Observable<any> {
    const dealerCode = this.storageService.getDealerCode();
    return this.warrantyInvoiceService.getNextInvoiceNumbers(dealerCode).pipe(
      switchMap((numbers: any) => {
        const model = {
          id: 0,
          dealerCode,
          dateFrom: this.dateFrom,
          dateTo: this.dateTo,
          batchNo: order.batchNo,
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