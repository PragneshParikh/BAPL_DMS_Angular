import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { PrefixService } from '../../core/services/prefix';
import { ToastService } from '../../shared/toaster/toast-service';
import { WarrantyInvoiceService } from '../../core/services/warranty-invoice-service';
import { WarrantyPackingSlipService } from '../../core/services/warranty-packaging-service';
import { DealerService } from '../../core/services/dealer-service';

@Component({
  selector: 'app-warranty-packaging',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './warranty-packaging.html',
  styleUrl: './warranty-packaging.scss',
})
export class WarrantyPackaging implements OnInit {

  // Dealer dropdown - everything below (Slip Prefix, Invoice list, and
  // the Save payload's dealerCode) is now scoped to whichever dealer is
  // selected here, not just the logged-in user's own dealer - same
  // pattern already used on the Warranty JC Claim page.
  dealerList: any[] = [];
  selectedDealerCode: string | null = null;

  financialYears: { label: string; startDate: string; endDate: string }[] = [];
  selectedFinancialYear: string;

  invoiceList: any[] = [];
  selectedInvoiceId: number | null = null;
  invoiceDate: string | null = null;

  slipPrefix: string = '';
  slipNo: number = 0;
  slipDate: string;

  packableLines: any[] = [];
  selectAll: boolean = false;

boxNumberOptions: number[] = Array.from({ length: 20 }, (_, i) => i + 1);
boxNumber: number | null = null;
boxType: string | null = null;
boxDimension: string = '';

  boxLines: any[] = [];

  constructor(
    private loader: LoaderService,
    private storageService: StorageService,
    private prefixService: PrefixService,
    private toaster: ToastService,
    private warrantyInvoiceService: WarrantyInvoiceService,
    private warrantypackingService: WarrantyPackingSlipService,
    private dealerService: DealerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.slipDate = this.formatDate(new Date());
    this.buildFinancialYears();
    this.loadDealers();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  buildFinancialYears(): void {
    const today = new Date();
    const currentStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

    this.financialYears = [0, 1, 2].map(offset => {
      const startYear = currentStartYear - offset;
      return {
        label: `01 Apr ${startYear} to 31 Mar ${startYear + 1}`,
        startDate: `${startYear}-04-01`,
        endDate: `${startYear + 1}-03-31`
      };
    });

    this.selectedFinancialYear = this.financialYears[0].label;
  }

  // Populates the Dealer dropdown, defaults the selection to the
  // logged-in user's own dealer, then triggers everything scoped to it.
  loadDealers(): void {
    this.loader.show();
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        this.loader.hide();
        // GetDealerDropdown wraps the array in { success, data } - unwrap
        // it here rather than assuming res itself is the list.
        this.dealerList = res?.data || [];

        const currentDealerCode = this.storageService.getDealerCode();
        if (currentDealerCode && this.dealerList.some((d: any) => d.dealerCode === currentDealerCode)) {
          this.selectedDealerCode = currentDealerCode;
        }

        this.onDealerChange();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load dealer list.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  // Re-runs everything scoped to a single dealer whenever the selection
  // changes - resets whatever Invoice/lines/boxes were in progress for
  // the previous dealer, then reloads Slip Prefix and the Invoice list
  // for the new one.
  onDealerChange(): void {
    this.selectedInvoiceId = null;
    this.invoiceDate = null;
    this.packableLines = [];
    this.boxLines = [];
    this.selectAll = false;

    if (!this.selectedDealerCode) {
      this.slipPrefix = '';
      this.slipNo = 0;
      this.invoiceList = [];
      return;
    }

    this.loadPrefix();
    this.loadInvoices();
  }

  // Slip Prefix is the dealer code itself (with a trailing "/" for visual
  // separation, matching InvoicePrefix/ClaimPrefix conventions elsewhere
  // in this app). PrefixService's own "wpack_prefix" call is used ONLY to
  // obtain the next sequence number - its own prefix portion is discarded.
  loadPrefix(): void {
    if (!this.selectedDealerCode) return;

    const dealerCode = this.selectedDealerCode;
    this.slipPrefix = `${dealerCode}/`;

    this.prefixService.getPrefixByDealerByModule(dealerCode, 'wpack_prefix').subscribe({
      next: (res: string) => {
        const parts = res.split('/');
        const lastSegment = parts.pop() ?? '';
        this.slipNo = Number(lastSegment);
      },
      error: (err) => console.error(err)
    });
  }

  loadInvoices(): void {
    if (!this.selectedDealerCode) return;

    const dealerCode = this.selectedDealerCode;
    const fy = this.financialYears.find(f => f.label === this.selectedFinancialYear);

    this.loader.show();
    this.warrantyInvoiceService.searchWarrantyInvoices({
      dealerCode,
      isApproved: true,
      dateFrom: fy?.startDate ?? null,
      dateTo: fy?.endDate ?? null,
      pageNumber: 1,
      pageSize: 500
    }).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.invoiceList = res?.items || [];
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load invoices.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

  onFinancialYearChange(): void {
    this.selectedInvoiceId = null;
    this.invoiceDate = null;
    this.packableLines = [];
    this.loadInvoices();
  }

  onInvoiceChange(): void {
    const invoice = this.invoiceList.find(i => i.id === this.selectedInvoiceId);
    this.invoiceDate = invoice?.invoiceDate ?? null;

    this.boxLines = [];
    this.packableLines = [];

    if (!this.selectedInvoiceId) return;

    this.loader.show();
    this.warrantypackingService.getPackableLines(this.selectedInvoiceId).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.packableLines = (res || []).map((l: any) => ({
          warrantyOrderGridDetailId: l.warrantyOrderGridDetailId,
          claimNo: l.claimNo,
          itemType: l.itemType,
          partDescription: l.partDescription,
          partCode: l.partCode,
          invQty: 0,
          qty: l.alreadyPackedQty,
          maxQty: l.remainingQty,
          selected: false,
          locked: false
        }));
        this.selectAll = false;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load packable lines for this invoice.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }


onLineSelectToggle(line: any): void {
    line.invQty = line.selected ? Math.min(1, line.maxQty) : 0;
}

toggleSelectAll(): void {
    this.packableLines.forEach(l => {
      if (!l.locked) {
        l.selected = this.selectAll;
        l.invQty = l.selected ? Math.min(1, l.maxQty) : 0;
      }
    });
}

    addBox(): void {
    if (!this.boxNumber) {
      this.toaster.show('Please select a Box Number.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    if (!this.boxType) {
      this.toaster.show('Please select a Box Type.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const selectedLines = this.packableLines.filter(l => l.selected && !l.locked);
    if (selectedLines.length === 0) {
      this.toaster.show('Please select at least one line to add to this box.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const invalidQty = selectedLines.find(l => !l.invQty || l.invQty <= 0 || l.invQty > l.maxQty);
    if (invalidQty) {
      this.toaster.show(`Enter a valid Inv. Qty (1 to ${invalidQty.maxQty}) for ${invalidQty.partCode}.`, { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    selectedLines.forEach(line => {
      this.boxLines.push({
        srNo: this.boxLines.length + 1,
        slipNo: `${this.slipPrefix}${this.slipNo}`,
        slipDate: this.slipDate,
        // Converted to string here - the dropdown's [ngValue] binds a
        // real JS number, but the backend's BoxNumber property is a
        // System.Text.Json-deserialized string, which throws on a raw
        // numeric JSON value rather than silently converting it.
        boxNumber: String(this.boxNumber),
        boxType: this.boxType,
        itemType: line.itemType,
        partCode: line.partCode,
        partDescription: line.partDescription,
        qty: line.invQty,
        dimension: this.boxDimension,
        warrantyOrderGridDetailId: line.warrantyOrderGridDetailId
      });

      line.maxQty -= line.invQty;
      line.qty += line.invQty;
      line.selected = false;
      line.locked = line.maxQty <= 0;
      line.invQty = 0;
    });

    this.selectAll = false;

    this.boxNumber = null;
    this.boxType = null;
    this.boxDimension = '';
}

    removeBoxLine(row: any): void {
        this.boxLines = this.boxLines.filter(l => l !== row);

        let line = this.packableLines.find(l => l.warrantyOrderGridDetailId === row.warrantyOrderGridDetailId);
        if (line) {
          line.maxQty += row.qty;
          line.qty -= row.qty;
          line.locked = line.maxQty <= 0;
          line.invQty = line.selected ? Math.min(1, line.maxQty) : 0;
        } else {
          this.packableLines.push({
            warrantyOrderGridDetailId: row.warrantyOrderGridDetailId,
            claimNo: '',
            itemType: row.itemType,
            partDescription: row.partDescription,
            partCode: row.partCode,
            invQty: 0,
            qty: 0,
            maxQty: row.qty,
            selected: false,
            locked: false
          });
        }

        this.boxLines.forEach((l, i) => l.srNo = i + 1);
    }

  saveWarrantyPackingSlip(): void {
    if (!this.selectedDealerCode) {
      this.toaster.show('Please select a Dealer.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    if (!this.selectedInvoiceId) {
      this.toaster.show('Please select an Invoice.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }



    if (this.boxLines.length === 0) {
      this.toaster.show('Please add at least one box before saving.', { classname: 'bg-warning text-white', delay: 3000 });
      return;
    }

    const boxesMap = new Map<string, any>();
    this.boxLines.forEach(line => {
      const key = `${line.boxNumber}|${line.boxType}|${line.dimension}`;
      if (!boxesMap.has(key)) {
        boxesMap.set(key, {
          boxNumber: line.boxNumber,
          boxType: line.boxType,
          length: line.dimension,
          width: 0,
          height: 0,
          weight: 0,
          details: []
        });
      }
      boxesMap.get(key).details.push({
        warrantyOrderGridDetailId: line.warrantyOrderGridDetailId,
        qty: line.qty
      });
    });

    const model = {
      dealerCode: this.selectedDealerCode,
      warrantyInvoiceHeaderId: this.selectedInvoiceId,
      slipPrefix: this.slipPrefix,
      slipNo: `${this.slipNo}`,
      slipDate: this.slipDate,
      boxes: Array.from(boxesMap.values())
    };

    this.loader.show();
    this.warrantypackingService.insertWarrantyPackingSlip(model).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Warranty Packing Slip saved successfully.', { classname: 'bg-success text-white', delay: 3000 });
        this.cancel();
        this.router.navigate(['/warranty-packaging-list']);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        const serverMsg = err?.error?.title || err?.error || 'Something went wrong. Check console for details.';
        this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

    goToPackingList(): void {
      this.router.navigate(['/warranty-packaging-list']);
  }

cancel(): void {
    this.selectedInvoiceId = null;
    this.invoiceDate = null;
    this.packableLines = [];
    this.boxLines = [];
    this.boxNumber = null;
    this.boxType = null;
    this.boxDimension = '';
}
}