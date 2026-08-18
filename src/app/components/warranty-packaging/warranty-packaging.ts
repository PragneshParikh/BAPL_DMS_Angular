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

  // 0 = create, otherwise the Id being edited - same convention as
  // WarrantyInvoice's own invoiceId.
  packingSlipId: number = 0;

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

    // Same sessionStorage handoff pattern as viewWarrantyInvoiceId - set
    // by the Packing Slip List's own double-click row handler.
    const viewId = sessionStorage.getItem('viewWarrantyPackingSlipId');
    if (viewId) {
      sessionStorage.removeItem('viewWarrantyPackingSlipId');
      this.packingSlipId = Number(viewId);
    }

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

  loadDealers(): void {
    this.loader.show();
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.dealerList = res?.data || [];

        // Loading an existing slip - skip normal "new slip" defaulting
        // entirely, same branching as WarrantyInvoice.ngOnInit checking
        // viewInvoiceId before falling through to a fresh form.
        if (this.packingSlipId > 0) {
          this.loadExistingPackingSlip(this.packingSlipId);
          return;
        }

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

  // Loads an existing slip directly into this same persistent form -
  // mirrors WarrantyInvoice.loadExistingInvoice's role exactly. Unlike
  // the invoice page, this also has to ask GetPackableLines to exclude
  // THIS slip's own already-saved quantities (excludePackingSlipId),
  // then replay its saved lines back on top - a packaging-specific step
  // with no equivalent on the invoice side, since invoices don't draw
  // from a shared, already-partially-consumed pool the way packing does.
  loadExistingPackingSlip(id: number): void {
    this.loader.show();
    this.warrantypackingService.getWarrantyPackingSlipById(id).subscribe({
      next: (res: any) => {
        this.selectedDealerCode = res.dealerCode;
        this.slipPrefix = res.slipPrefix;
        this.slipNo = Number(res.slipNo);
        this.slipDate = res.slipDate?.substring(0, 10) ?? this.slipDate;

        this.invoiceList = [{
          id: res.warrantyInvoiceHeaderId,
          invoicePrefix: res.invoicePrefix,
          invoiceNo: res.invoiceNo,
          invoiceDate: res.invoiceDate
        }];
        this.selectedInvoiceId = res.warrantyInvoiceHeaderId;
        this.invoiceDate = res.invoiceDate;

        const savedLines: any[] = [];
        (res.boxes || []).forEach((box: any) => {
          (box.lines || []).forEach((line: any) => {
            savedLines.push({
              warrantyOrderGridDetailId: line.warrantyOrderGridDetailId,
              itemType: line.itemType,
              partCode: line.partCode,
              partDescription: line.partDescription,
              qty: line.qty,
              boxNumber: box.boxNumber,
              boxType: box.boxType,
              dimension: box.length
            });
          });
        });

        // Pre-fills the "Add new box" fields with the first saved box's
        // details, per explicit prior request.
        if (res.boxes && res.boxes.length > 0) {
          const firstBox = res.boxes[0];
          this.boxNumber = Number(firstBox.boxNumber) || null;
          this.boxType = firstBox.boxType ?? null;
          this.boxDimension = firstBox.length ?? '';
        }

        this.warrantypackingService.getPackableLines(this.selectedInvoiceId!, id).subscribe({
          next: (linesRes: any) => {
            this.loader.hide();

            this.packableLines = (linesRes || []).map((l: any) => ({
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

            this.boxLines = [];
            let srNo = 1;
            savedLines.forEach(saved => {
              this.boxLines.push({
                srNo: srNo++,
                slipNo: `${this.slipPrefix}${this.slipNo}`,
                slipDate: this.slipDate,
                boxNumber: saved.boxNumber,
                boxType: saved.boxType,
                itemType: saved.itemType,
                partCode: saved.partCode,
                partDescription: saved.partDescription,
                qty: saved.qty,
                dimension: saved.dimension,
                warrantyOrderGridDetailId: saved.warrantyOrderGridDetailId
              });

              const line = this.packableLines.find(l => l.warrantyOrderGridDetailId === saved.warrantyOrderGridDetailId);
              if (line) {
                line.maxQty -= saved.qty;
                line.qty += saved.qty;
              }
            });
          },
          error: (err) => {
            this.loader.hide();
            console.error(err);
            this.toaster.show('Failed to load packable lines for this invoice.', { classname: 'bg-danger text-white', delay: 3000 });
          }
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show('Failed to load this Packing Slip.', { classname: 'bg-danger text-white', delay: 3000 });
      }
    });
  }

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

  // Ternary between insert/update based on packingSlipId - same shape as
  // WarrantyInvoice.saveWarrantyInvoice's own request$ ternary on invoiceId.
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
      this.toaster.show(
        this.packingSlipId > 0
          ? 'A slip needs at least one box - use Delete on the List page to remove it entirely instead.'
          : 'Please add at least one box before saving.',
        { classname: 'bg-warning text-white', delay: 3000 }
      );
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

    const model: any = {
      dealerCode: this.selectedDealerCode,
      warrantyInvoiceHeaderId: this.selectedInvoiceId,
      slipPrefix: this.slipPrefix,
      slipNo: `${this.slipNo}`,
      slipDate: this.slipDate,
      boxes: Array.from(boxesMap.values())
    };

    this.loader.show();

    if (this.packingSlipId > 0) {
      model.id = this.packingSlipId;
      this.warrantypackingService.updateWarrantyPackingSlip(model).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show('Warranty Packing Slip updated successfully.', { classname: 'bg-success text-white', delay: 3000 });
          this.router.navigate(['/warranty-packaging-list']);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          const serverMsg = err?.error?.title || err?.error || 'Something went wrong. Check console for details.';
          this.toaster.show(serverMsg, { classname: 'bg-danger text-white', delay: 3000 });
        }
      });
    } else {
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
  }

  goToPackingList(): void {
    this.router.navigate(['/warranty-packaging-list']);
  }

  // Mirrors WarrantyInvoice's simple cancel()/goToInvoiceList() pair -
  // discards to the list when editing an existing slip, resets the form
  // in place when it was a fresh, unsaved "create".
  cancel(): void {
    if (this.packingSlipId > 0) {
      this.router.navigate(['/warranty-packaging-list']);
      return;
    }
    this.selectedInvoiceId = null;
    this.invoiceDate = null;
    this.packableLines = [];
    this.boxLines = [];
    this.boxNumber = null;
    this.boxType = null;
    this.boxDimension = '';
  }
}