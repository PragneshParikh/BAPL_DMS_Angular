import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  LocalPartOption,
  LocalPartsLocation,
  PartsD2DTransaction,
  LocalPartsService,
  formatPartsD2DBillNo
} from '../../core/services/local-parts.service';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';

interface PartsD2DDraftLine {
  partCode: string;
  description: string;
  rate: number;
  currentStock: number;
  transferQuantity: number;
  remainingStock: number;
}

@Component({
  selector: 'app-parts-d2d',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parts-d2d.html',
  styleUrl: './parts-d2d.scss'
})
export class PartsD2D implements OnInit {
  prefix = '';
  d2DBillNo = '';
  transferDate = this.formatDate(new Date());
  fromLocationId: number | null = null;
  toLocationId: number | null = null;

  fromLocations: LocalPartsLocation[] = [];
  toLocations: LocalPartsLocation[] = [];
  parts: LocalPartOption[] = [];
  draftLines: PartsD2DDraftLine[] = [];

  partCode = '';
  transferQuantity: number | null = null;
  editingIndex: number | null = null;
  editingSavedTransferId: number | null = null;
  editingSavedTransfer: PartsD2DTransaction | null = null;

  isLoadingLocations = false;
  isLoadingToLocations = false;
  isLoadingParts = false;
  isLoadingBillNo = false;
  isSaving = false;
  isUpdatingSavedTransfer = false;
  deletingSavedTransferId: number | null = null;
  errorMessage = '';
  successMessage = '';

  isTransactionEditFlow = false;
  private billNoRequestId = 0;

  constructor(
    private readonly localPartsService: LocalPartsService,
    private readonly storageService: StorageService,
    private readonly toast: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const transactionId = Number(this.route.snapshot.queryParamMap.get('transactionId'));
    this.isTransactionEditFlow = Number.isInteger(transactionId) && transactionId > 0;
    if (!this.isTransactionEditFlow) {
      this.loadNextD2DBillNo();
    }
    this.loadLocations(this.isTransactionEditFlow ? transactionId : undefined);
  }

  get selectedPart(): LocalPartOption | undefined {
    return this.parts.find(part => part.partCode === this.partCode);
  }

  get remainingStock(): number {
    if (this.editingSavedTransfer) {
      return this.getSavedClosingStock(this.editingSavedTransfer);
    }

    const currentStock = this.selectedPart?.currentStock ?? 0;
    const quantity = Number(this.transferQuantity);
    return Number.isFinite(quantity) && quantity > 0 ? currentStock - quantity : currentStock;
  }

  get currentStock(): number | '' {
    return this.editingSavedTransfer
      ? this.getSavedPreviousStock(this.editingSavedTransfer)
      : this.selectedPart?.currentStock ?? '';
  }

  get currentRate(): number | '' {
    return this.editingSavedTransfer?.rate ?? this.selectedPart?.purchaseRate ?? '';
  }

  formatBillNo(billNo: string): string {
    return formatPartsD2DBillNo(billNo);
  }

  private loadNextD2DBillNo(): void {
    const requestId = ++this.billNoRequestId;
    this.isLoadingBillNo = true;
    this.localPartsService.getNextPartsD2DBillNo().subscribe({
      next: response => {
        if (requestId !== this.billNoRequestId) return;
        this.d2DBillNo = response.d2DBillNo;
        this.isLoadingBillNo = false;
      },
      error: error => {
        if (requestId !== this.billNoRequestId) return;
        this.isLoadingBillNo = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load the next D2D bill number.');
      }
    });
  }

  get canUpdateCurrentRow(): boolean {
    return this.canSendFromSelectedLocation || !!this.editingSavedTransfer?.isIncomingForCaller;
  }

  get canSendFromSelectedLocation(): boolean {
    const location = this.fromLocations.find(item => item.locationId === this.fromLocationId);
    if (!location) return false;

    const role = this.storageService.getRole().trim().toLowerCase();
    if (role === 'admin' || role === 'superadmin') return true;

    return location.dealerCode.trim().toLowerCase() ===
      this.storageService.getDealerCode().trim().toLowerCase();
  }

  loadLocations(transactionId?: number): void {
    this.isLoadingLocations = true;
    this.isLoadingToLocations = true;
    this.localPartsService.getD2DWorkshopLocations().subscribe({
      next: locations => {
      const warehouses = locations || [];
      const role = this.storageService.getRole().trim().toLowerCase();
      const dealerCode = this.storageService.getDealerCode().trim().toLowerCase();
      const loginLocationCode = (localStorage.getItem('locationCode') || '').trim().toLowerCase();

      this.toLocations = warehouses;
      if (role === 'admin' || role === 'superadmin') {
        this.fromLocations = warehouses;
      } else if (loginLocationCode) {
        this.fromLocations = warehouses.filter(location =>
          location.locationCode.trim().toLowerCase() === loginLocationCode &&
          location.dealerCode.trim().toLowerCase() === dealerCode
        );
      } else {
        this.fromLocations = warehouses.filter(location =>
          location.dealerCode.trim().toLowerCase() === dealerCode
        );
      }

      if (loginLocationCode && this.fromLocations.length === 0) {
        this.errorMessage = 'Your login location is not an active warehouse.';
      }
        this.isLoadingLocations = false;
        this.isLoadingToLocations = false;
        if (transactionId) {
          this.loadTransactionForEdit(transactionId);
        }
      },
      error: error => {
        this.isLoadingLocations = false;
        this.isLoadingToLocations = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load warehouse locations.');
      }
    });
  }

  onFromLocationChange(locationId: number | null): void {
    this.fromLocationId = locationId;
    this.parts = [];
    this.partCode = '';
    this.transferQuantity = null;
    this.editingIndex = null;
    this.draftLines = [];
    this.cancelSavedTransferEdit();
    if (locationId && this.canSendFromSelectedLocation) {
      this.loadParts(locationId);
    }
  }

  onToLocationChange(locationId: number | null): void {
    this.toLocationId = locationId;
  }

  openTransactions(): void {
    this.router.navigate(['/parts-d2d-transactions']);
  }

  private loadTransactionForEdit(transactionId: number): void {
    this.isLoadingParts = true;
    this.localPartsService.getPartsD2DHistory().subscribe({
      next: transactions => {
        const transaction = transactions.find(item => item.transactionId === transactionId);
        if (!transaction || transaction.isIncomingForCaller) {
          this.isLoadingParts = false;
          this.errorMessage = 'Outgoing D2D transaction was not found or is not accessible.';
          return;
        }

        const fromLocation = this.fromLocations.find(location =>
          location.locationCode.toLowerCase() === transaction.fromLocationCode.toLowerCase() &&
          location.dealerCode.toLowerCase() === transaction.fromDealerCode.toLowerCase());
        const toLocation = this.toLocations.find(location =>
          location.locationCode.toLowerCase() === transaction.toLocationCode.toLowerCase() &&
          location.dealerCode.toLowerCase() === transaction.toDealerCode.toLowerCase());
        if (!fromLocation || !toLocation) {
          this.isLoadingParts = false;
          this.errorMessage = 'The transfer locations are no longer available.';
          return;
        }

        this.fromLocationId = fromLocation.locationId;
        this.toLocationId = toLocation.locationId;
        this.prefix = transaction.prefix;
        this.d2DBillNo = transaction.d2DBillNo;
        this.transferDate = transaction.date.slice(0, 10);
        this.editingSavedTransfer = transaction;
        this.editingSavedTransferId = transaction.transactionId;
        this.partCode = transaction.partCode;
        this.transferQuantity = transaction.transferQuantity;
        this.loadParts(fromLocation.locationId);
      },
      error: error => {
        this.isLoadingParts = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load the D2D transaction.');
      }
    });
  }

  loadParts(locationId: number): void {
    this.isLoadingParts = true;
    this.localPartsService.getParts(locationId).subscribe({
      next: parts => {
        this.parts = (parts || []).filter(part => part.currentStock > 0);
        this.isLoadingParts = false;
      },
      error: error => {
        this.isLoadingParts = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load parts with stock.');
      }
    });
  }

  onPartChange(): void {
    this.transferQuantity = null;
  }

  addOrUpdateLine(): void {
    if (!this.canSendFromSelectedLocation) {
      this.errorMessage = 'You can only send stock from your own dealer location.';
      return;
    }

    const part = this.selectedPart;
    const quantity = Number(this.transferQuantity);

    if (!part) {
      this.errorMessage = 'Select a part with available stock.';
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.errorMessage = 'Up Stock quantity must be a whole number greater than zero.';
      return;
    }
    if (quantity > part.currentStock) {
      this.errorMessage = `Transfer quantity cannot exceed current stock (${part.currentStock}).`;
      return;
    }

    if (this.draftLines.length === 0 && this.editingIndex === null && !this.editingSavedTransfer) {
      this.d2DBillNo = '';
    }

    const line: PartsD2DDraftLine = {
      partCode: part.partCode,
      description: part.description,
      rate: part.purchaseRate,
      currentStock: part.currentStock,
      transferQuantity: quantity,
      remainingStock: part.currentStock - quantity
    };

    if (this.editingIndex !== null) {
      this.draftLines[this.editingIndex] = line;
      this.editingIndex = null;
    } else {
      const existingIndex = this.draftLines.findIndex(item =>
        item.partCode.toLowerCase() === line.partCode.toLowerCase());
      if (existingIndex >= 0) {
        this.draftLines[existingIndex] = line;
      } else {
        this.draftLines.push(line);
      }
    }

    this.partCode = '';
    this.transferQuantity = null;
    this.errorMessage = '';
  }

  editLine(index: number): void {
    const line = this.draftLines[index];
    this.partCode = line.partCode;
    this.transferQuantity = line.transferQuantity;
    this.editingIndex = index;
  }

  deleteLine(index: number): void {
    this.draftLines.splice(index, 1);
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.partCode = '';
      this.transferQuantity = null;
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
  }

  startEditSavedTransfer(transfer: PartsD2DTransaction): void {
    this.editingIndex = null;
    this.editingSavedTransfer = transfer;
    this.editingSavedTransferId = transfer.transactionId;
    this.partCode = transfer.partCode;
    this.transferQuantity = transfer.transferQuantity;
    this.errorMessage = '';
  }

  cancelSavedTransferEdit(): void {
    this.editingSavedTransfer = null;
    this.editingSavedTransferId = null;
    this.partCode = '';
    this.transferQuantity = null;
    if (this.isTransactionEditFlow) {
      this.router.navigate(['/parts-d2d-transactions']);
    }
  }

  getSavedClosingStock(transfer: PartsD2DTransaction): number {
    if (this.editingSavedTransferId !== transfer.transactionId) {
      return transfer.isIncomingForCaller ? transfer.toClosingStock : transfer.fromClosingStock;
    }

    const quantity = Number(this.transferQuantity);
    if (!Number.isInteger(quantity)) {
      return transfer.isIncomingForCaller ? transfer.toClosingStock : transfer.fromClosingStock;
    }
    return transfer.isIncomingForCaller
      ? transfer.toPreviousStock + quantity
      : transfer.fromPreviousStock - quantity;
  }

  getSavedPreviousStock(transfer: PartsD2DTransaction): number {
    return transfer.isIncomingForCaller ? transfer.toPreviousStock : transfer.fromPreviousStock;
  }

  saveSavedTransferEdit(): void {
    const transfer = this.editingSavedTransfer;
    if (!transfer) return;
    if (!this.canUpdateCurrentRow) {
      this.errorMessage = 'You cannot update this D2D transfer.';
      return;
    }

    const quantity = Number(this.transferQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.errorMessage = 'Transfer quantity must be a whole number greater than zero.';
      return;
    }
    if (quantity > transfer.fromPreviousStock) {
      this.errorMessage = `Transfer quantity cannot exceed source stock before this transfer (${transfer.fromPreviousStock}).`;
      return;
    }

    this.isUpdatingSavedTransfer = true;
    this.errorMessage = '';
    this.localPartsService.updatePartsD2DTransaction(transfer.transactionId, quantity).subscribe({
      next: () => {
        this.isUpdatingSavedTransfer = false;
        this.cancelSavedTransferEdit();
        this.successMessage = 'D2D transfer line updated.';
        this.toast.show(this.successMessage, { classname: 'bg-success text-white', delay: 5000 });
      },
      error: error => {
        this.isUpdatingSavedTransfer = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to update D2D transfer line.');
      }
    });
  }

  deleteSavedTransfer(transfer: PartsD2DTransaction): void {
    const confirmed = window.confirm(
      `Delete part ${transfer.partCode} from bill ${this.formatBillNo(transfer.d2DBillNo)} and restore stock?`
    );
    if (!confirmed) return;

    this.deletingSavedTransferId = transfer.transactionId;
    this.errorMessage = '';
    this.localPartsService.deletePartsD2DTransaction(transfer.transactionId).subscribe({
      next: () => {
        this.deletingSavedTransferId = null;
        this.successMessage = 'D2D transfer line deleted and stock restored.';
        this.toast.show(this.successMessage, { classname: 'bg-success text-white', delay: 5000 });
      },
      error: error => {
        this.deletingSavedTransferId = null;
        this.errorMessage = this.getErrorMessage(error, 'Unable to delete D2D transfer line.');
      }
    });
  }

  save(): void {
    if (this.editingSavedTransfer) {
      this.successMessage = '';
      this.saveSavedTransferEdit();
      return;
    }

    if (!this.prefix.trim()) {
      this.errorMessage = 'Prefix is required.';
      return;
    }
    if (!this.transferDate || !this.fromLocationId || !this.toLocationId) {
      this.errorMessage = 'Date, from location and to location are required.';
      return;
    }
    if (!this.canSendFromSelectedLocation) {
      this.errorMessage = 'You can only send stock from your own dealer location.';
      return;
    }
    if (this.draftLines.length === 0) {
      this.errorMessage = 'Add at least one part before saving.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.localPartsService.savePartsD2D({
      prefix: this.prefix.trim(),
      date: `${this.transferDate}T00:00:00Z`,
      fromLocationId: this.fromLocationId,
      toLocationId: this.toLocationId,
      items: this.draftLines.map(line => ({
        partCode: line.partCode,
        transferQuantity: line.transferQuantity
      }))
    }).subscribe({
      next: response => {
        this.isSaving = false;
        this.billNoRequestId++;
        this.d2DBillNo = response.d2DBillNo;
        this.successMessage =
          `D2D transfer ${this.formatBillNo(response.d2DBillNo)} saved. Prefix: ${response.prefix}`;
        this.toast.show(this.successMessage, { classname: 'bg-success text-white', delay: 5000 });
        this.draftLines = [];
        this.partCode = '';
        this.transferQuantity = null;
        this.loadNextD2DBillNo();
        if (this.fromLocationId) {
          this.loadParts(this.fromLocationId);
        }
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to save D2D transfer.');
      }
    });
  }

  downloadSampleExcel(): void {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Sr. No.', 'Part No', 'Description', 'Rate', 'C.Stock', 'Up.Stock']
    ]);
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 36 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts D2D Template');
    XLSX.writeFile(workbook, 'Parts_D2D_Sample.xlsx');
  }

  dismissError(): void {
    this.errorMessage = '';
  }

  dismissSuccess(): void {
    this.successMessage = '';
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        for (const row of rows) {
          const partCode = String(row['Part No'] ?? row['PartCode'] ?? row['Part Code'] ?? '').trim();
          const quantity = Number(row['Up.Stock'] ?? row['Transfer Qty'] ?? row['TransferQuantity']);
          const part = this.parts.find(item =>
            item.partCode.toLowerCase() === partCode.toLowerCase());

          if (!part || !Number.isInteger(quantity) || quantity <= 0 || quantity > part.currentStock) {
            continue;
          }

          const line: PartsD2DDraftLine = {
            partCode: part.partCode,
            description: part.description,
            rate: part.purchaseRate,
            currentStock: part.currentStock,
            transferQuantity: quantity,
            remainingStock: part.currentStock - quantity
          };
          const existingIndex = this.draftLines.findIndex(item =>
            item.partCode.toLowerCase() === part.partCode.toLowerCase());
          if (existingIndex >= 0) {
            this.draftLines[existingIndex] = line;
          } else {
            this.draftLines.push(line);
          }
        }
        this.successMessage = 'Excel rows imported into the grid.';
      } catch {
        this.errorMessage = 'Unable to read the Excel file.';
      } finally {
        input.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || fallback;
    }
    return fallback;
  }
}
