import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { CounterBillPrintDetail, CounterBillPrintModel } from '../../../ViewModels/CounterBillModel';
import { CurrencyService } from '../../../core/services/currency-service';

@Component({
  selector: 'app-counter-bill-print',
  imports: [CommonModule, FormsModule, NgbModule],
  templateUrl: './counter-bill-print.html',
  styleUrl: './counter-bill-print.scss',
})

export class CounterBillPrint implements OnInit {
  
  billData!: CounterBillPrintModel;

  id!: number;

  amountInWords = '';

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,private currencyService:CurrencyService
  ) { }

  ngOnInit(): void {

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    if (this.id) {
      this.loadCounterBillPrint();
    }
  }
formatTerms(text: string): string {
  if (!text) return '';

  return text.replace(/(\d+\.)/g, '<br>$1');
}
  loadCounterBillPrint() {
    this.reportService.getCounterBillPrint(this.id)
      .subscribe({
        next: (response) => {
          console.log(response);
          

          this.billData = response;

          this.amountInWords = this.currencyService.convertToWords(
            this.getTotalAmount()
          );

        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  getSubTotal(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce(
      (sum, item) => sum + (item.qty * item.rate),
      0
    );
  }

  getDiscountTotal(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce(
      (sum, item) => sum + (item.discount || 0),
      0
    );
  }

  getTotalSGST(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce(
      (sum, item) => sum + (item.sgstamnt || 0),
      0
    );
  }

  getTotalCGST(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce(
      (sum, item) => sum + (item.cgstamnt || 0),
      0
    );
  }

  getTotalIGST(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce(
      (sum, item) => sum + (item.igstamnt || 0),
      0
    );
  }

  getTaxTotal(): number {

    return (
      this.getTotalSGST() +
      this.getTotalCGST() +
      this.getTotalIGST()
    );
  }

  getTotalAmount(): number {

    if (!this.billData?.details?.length) {
      return 0;
    }

    return this.billData.details.reduce((sum, item) => {

      const lineTotal =
        (item.qty * item.rate)
        - (item.discount || 0)
        + (item.sgstamnt || 0)
        + (item.cgstamnt || 0)
        + (item.igstamnt || 0);

      return sum + lineTotal;

    }, 0);
  }

  printInvoice(): void {
    window.print();
  }

  goBack(): void {
    history.back();
  }

  // Temporary amount in words
  // convertNumberToWords(amount: number): string {

  //   if (!amount) {
  //     return 'Zero Only';
  //   }

  //   return amount.toFixed(2) + ' Rupees Only';
  // }

  getTaxableAmount(item: CounterBillPrintDetail): number {
  return (item.qty * item.rate) - item.discount;
}

getLineTotal(item: CounterBillPrintDetail): number {

  return (
    this.getTaxableAmount(item) +
    item.igstamnt +
    item.cgstamnt +
    item.sgstamnt
  );
}

}