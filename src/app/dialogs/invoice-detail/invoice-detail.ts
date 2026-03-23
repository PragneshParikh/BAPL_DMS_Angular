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
}
