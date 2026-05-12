import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invoice-detail',
  imports: [CommonModule],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetail {
  @Input() invoiceDetails: any;
  @Input() sourceType: string;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    public activeModal: NgbActiveModal
  ) { }

  close(isAccepted) {
    if (isAccepted) {
      this.activeModal.close({ 'isAccepted': isAccepted, 'invoice': this.invoiceDetails });
    } else {
      this.activeModal.dismiss("closed");
    }

  }

  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.invoiceDetails.sort((a: any, b: any) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  }

}
