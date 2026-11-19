import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LocalPartOption,
  LocalPartsLocation,
  LocalPartsSaveResponse,
  LocalPartsService,
  LocalPartsTransaction
} from '../../core/services/local-parts.service';

interface LocalPartsDraftLine extends LocalPartOption {
  purchaseQuantity: number;
  totalQuantity: number;
}

@Component({
  selector: 'app-add-local-parts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-local-parts.html'
})
export class AddLocalParts implements OnInit {
  locations: LocalPartsLocation[] = [];
  parts: LocalPartOption[] = [];
  draftLines: LocalPartsDraftLine[] = [];

  prefix = '';
  entryDate = this.formatDate(new Date());
  locationId: number | null = null;
  partCode = '';
  purchaseQuantity: number | null = null;
  editingIndex: number | null = null;
  editingTransactionId: number | null = null;
  isTransactionEditFlow = false;
  private originalTransaction: LocalPartsTransaction | null = null;

  isLoadingLocations = false;
  isLoadingParts = false;
  isLoadingTransaction = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly localPartsService: LocalPartsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    const transactionId = Number(this.route.snapshot.queryParamMap.get('transactionId'));
    if (Number.isInteger(transactionId) && transactionId > 0) {
      this.isTransactionEditFlow = true;
      this.loadTransaction(transactionId);
    }
  }

  get selectedPart(): LocalPartOption | undefined {
    return this.parts.find(part => part.partCode === this.partCode);
  }

  get calculatedTotal(): number {
    return (this.selectedPart?.currentStock ?? 0) + (this.purchaseQuantity ?? 0);
  }

  get selectedLocation(): LocalPartsLocation | undefined {
    return this.locations.find(location => location.locationId === this.locationId);
  }

  loadLocations(): void {
    this.isLoadingLocations = true;
    this.errorMessage = '';
    this.localPartsService.getWorkshopLocations().subscribe({
      next: locations => {
        this.locations = locations;
        this.isLoadingLocations = false;
      },
      error: error => {
        this.isLoadingLocations = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load workshop locations.');
      }
    });
  }

  onLocationChange(locationId: number | null): void {
    this.locationId = locationId;
    this.parts = [];
    this.partCode = '';
    this.purchaseQuantity = null;
    this.draftLines = [];
    this.editingIndex = null;
    this.errorMessage = '';
    this.successMessage = '';

    if (locationId) {
      this.loadParts(locationId);
    }
  }

  onPartChange(partCode: string): void {
    this.partCode = partCode;
    this.purchaseQuantity = null;
    this.errorMessage = '';
  }

  addOrUpdateLine(): void {
    const selected = this.selectedPart;
    const quantity = Number(this.purchaseQuantity);

    if (!selected) {
      this.errorMessage = 'Select a part code.';
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.errorMessage = 'Purchase quantity must be a whole number greater than zero.';
      return;
    }

    const line: LocalPartsDraftLine = {
      ...selected,
      purchaseQuantity: quantity,
      totalQuantity: selected.currentStock + quantity
    };

    if (this.editingIndex !== null) {
      const otherIndex = this.draftLines.findIndex(
        (draft, index) => index !== this.editingIndex && this.samePart(draft.partCode, selected.partCode)
      );

      if (otherIndex >= 0) {
        const mergedQuantity = this.draftLines[otherIndex].purchaseQuantity + quantity;
        this.draftLines[otherIndex] = {
          ...this.draftLines[otherIndex],
          purchaseQuantity: mergedQuantity,
          totalQuantity: this.draftLines[otherIndex].currentStock + mergedQuantity
        };
        this.draftLines.splice(this.editingIndex, 1);
      } else {
        this.draftLines[this.editingIndex] = line;
      }
      this.editingIndex = null;
    } else {
      const existingIndex = this.draftLines.findIndex(
        draft => this.samePart(draft.partCode, selected.partCode)
      );

      if (existingIndex >= 0) {
        const mergedQuantity = this.draftLines[existingIndex].purchaseQuantity + quantity;
        this.draftLines[existingIndex] = {
          ...this.draftLines[existingIndex],
          purchaseQuantity: mergedQuantity,
          totalQuantity: this.draftLines[existingIndex].currentStock + mergedQuantity
        };
      } else {
        this.draftLines = [...this.draftLines, line];
      }
    }

    this.partCode = '';
    this.purchaseQuantity = null;
    this.errorMessage = '';
  }

  editLine(index: number): void {
    const line = this.draftLines[index];
    this.editingIndex = index;
    this.partCode = line.partCode;
    this.purchaseQuantity = line.purchaseQuantity;
    this.errorMessage = '';
  }

  deleteLine(index: number): void {
    if (this.editingTransactionId !== null) {
      this.deleteTransaction();
      return;
    }

    this.draftLines.splice(index, 1);
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.partCode = '';
      this.purchaseQuantity = null;
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
  }

  save(): void {
    if (!this.entryDate || !this.locationId) {
      this.errorMessage = 'Date and workshop location are required.';
      return;
    }
    if (this.draftLines.length === 0) {
      this.errorMessage = 'Add at least one part before saving.';
      return;
    }

    if (this.editingTransactionId !== null) {
      this.updateTransaction();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.localPartsService.save({
      prefix: this.prefix.trim() || null,
      date: `${this.entryDate}T00:00:00Z`,
      locationId: this.locationId,
      items: this.draftLines.map(line => ({
        partCode: line.partCode,
        purchaseQuantity: line.purchaseQuantity
      }))
    }).subscribe({
      next: response => {
        this.isSaving = false;
        this.successMessage = this.successText(response);
        this.prefix = '';
        this.draftLines = [];
        this.editingIndex = null;
        this.partCode = '';
        this.purchaseQuantity = null;
        if (this.locationId) {
          this.loadParts(this.locationId);
        }
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to save local parts.');
      }
    });
  }

  cancelEdit(): void {
    const original = this.originalTransaction;
    if (this.isTransactionEditFlow && original) {
      this.prefix = original.receiptNumber;
      this.entryDate = original.date.slice(0, 10);
      this.partCode = original.partCode;
      this.purchaseQuantity = original.purchaseQuantity;
      this.draftLines = this.draftLines.map(line => ({
        ...line,
        currentStock: original.previousStock,
        purchaseQuantity: original.purchaseQuantity,
        totalQuantity: original.totalStock
      }));
    }
    this.editingIndex = null;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.isTransactionEditFlow) {
      this.partCode = '';
      this.purchaseQuantity = null;
    }
  }

  cancelSavedEdit(): void {
    this.router.navigate(['/add-local-parts-transactions'], {
      queryParams: { locationId: this.locationId }
    });
  }

  openTransactions(): void {
    this.router.navigate(['/add-local-parts-transactions'], {
      queryParams: this.locationId === null ? {} : { locationId: this.locationId }
    });
  }

  trackByPartCode(_index: number, line: LocalPartsDraftLine): string {
    return line.partCode;
  }

  private loadTransaction(transactionId: number): void {
    this.isLoadingTransaction = true;
    this.errorMessage = '';
    this.localPartsService.getTransaction(transactionId).subscribe({
      next: transaction => {
        this.originalTransaction = transaction;
        this.prefix = transaction.receiptNumber;
        this.entryDate = transaction.date.slice(0, 10);
        this.locationId = transaction.locationId;
        this.partCode = transaction.partCode;
        this.purchaseQuantity = transaction.purchaseQuantity;
        this.editingTransactionId = transaction.id;
        this.editingIndex = 0;

        this.loadParts(transaction.locationId, parts => {
          const existingPart = parts.find(part => this.samePart(part.partCode, transaction.partCode));
          const transactionPart: LocalPartOption = existingPart ?? {
            partCode: transaction.partCode,
            partName: transaction.partName,
            description: transaction.description,
            displayName: null,
            modelName: null,
            hsnCode: '',
            uom: null,
            purchaseRate: 0,
            currentStock: transaction.previousStock
          };
          const editablePart = {
            ...transactionPart,
            currentStock: transaction.previousStock
          };

          if (!existingPart) {
            this.parts = [...this.parts, editablePart];
          } else {
            this.parts = this.parts.map(part =>
              this.samePart(part.partCode, transaction.partCode) ? editablePart : part
            );
          }

          this.draftLines = [{
            ...editablePart,
            purchaseQuantity: transaction.purchaseQuantity,
            totalQuantity: transaction.totalStock
          }];
          this.isLoadingTransaction = false;
        });
      },
      error: error => {
        this.isLoadingTransaction = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load the transaction for editing.');
      }
    });
  }

  private updateTransaction(): void {
    const transactionId = this.editingTransactionId;
    const line = this.draftLines[0];
    const quantity = Number(line?.purchaseQuantity);
    if (transactionId === null || !line || !Number.isInteger(quantity) || quantity <= 0) {
      this.errorMessage = 'Purchase quantity must be a whole number greater than zero.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.localPartsService.updateTransaction(transactionId, {
      prefix: this.prefix.trim() || null,
      date: `${this.entryDate}T00:00:00Z`,
      purchaseQuantity: quantity
    }).subscribe({
      next: updated => {
        this.isSaving = false;
        this.originalTransaction = updated;
        this.prefix = updated.receiptNumber;
        this.entryDate = updated.date.slice(0, 10);
        this.partCode = '';
        this.purchaseQuantity = null;
        this.editingIndex = null;
        this.draftLines = this.draftLines.map(line => ({
          ...line,
          currentStock: updated.previousStock,
          purchaseQuantity: updated.purchaseQuantity,
          totalQuantity: updated.totalStock
        }));
        this.successMessage = 'Local parts transaction updated successfully.';
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to update the local-parts transaction.');
      }
    });
  }

  private deleteTransaction(): void {
    const transactionId = this.editingTransactionId;
    if (transactionId === null || !window.confirm('Delete this transaction and reverse its stock quantity?')) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.localPartsService.deleteTransaction(transactionId).subscribe({
      next: () => {
        this.isSaving = false;
        this.cancelSavedEdit();
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to delete the local-parts transaction.');
      }
    });
  }

  private loadParts(locationId: number, onLoaded?: (parts: LocalPartOption[]) => void): void {
    this.isLoadingParts = true;
    this.localPartsService.getParts(locationId).subscribe({
      next: parts => {
        this.parts = parts;
        this.isLoadingParts = false;
        onLoaded?.(parts);
      },
      error: error => {
        this.isLoadingParts = false;
        this.isLoadingTransaction = false;
        this.errorMessage = this.getErrorMessage(error, 'Unable to load dealer-owned Spares.');
      }
    });
  }

  private samePart(left: string, right: string): boolean {
    return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
  }

  private successText(response: LocalPartsSaveResponse): string {
    const lineCount = response.items.length;
    const quantity = response.items.reduce((total, item) => total + item.purchaseQuantity, 0);
    const lineLabel = lineCount === 1 ? 'part line' : 'part lines';
    const unitLabel = quantity === 1 ? 'unit' : 'units';
    const enteredPrefix = this.prefix.trim();
    const reference = enteredPrefix ? ` Reference: ${enteredPrefix}.` : '';
    return `Local parts saved successfully. ${lineCount} ${lineLabel} and ${quantity} ${unitLabel} added to stock at ${response.locationName}.${reference}`;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (typeof body?.message === 'string' && body.message.trim()) {
        return body.message;
      }
      return error.message || fallback;
    }
    return fallback;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
