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
    private route: ActivatedRoute, private currencyService: CurrencyService
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
            this.getInvoiceTotal()
          );

        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  // getSubTotal(): number {

  //   if (!this.billData?.details?.length) {
  //     return 0;
  //   }

  //   return this.billData.details.reduce(
  //     (sum, item) => sum + (item.qty * item.rate),
  //     0
  //   );
  // }
getRoundOff(): number {

  const total = this.getTotalAmount();

  return Number((Math.round(total) - total).toFixed(2));
}

getSubTotal(): number {

  if (!this.billData?.details?.length) {
    return 0;
  }

  return this.billData.details.reduce(
    (sum, item) => sum + this.getLineTotal(item),
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
getInvoiceTotal(): number {
  return Math.round(this.getSubTotal());
}
  printInvoice(): void {
    window.print();
  }

  goBack(): void {
    history.back();
  }


  getTaxableAmount(item: CounterBillPrintDetail): number {
    console.log(item, 'inside');
    const discountAmount = item.discType === '%' ? (item.rate * Number(item.discount || 0)) / 100 : Number(item.discount || 0);
    return (item.rate - discountAmount) *item.qty;
  }

  getLineTotal(item: CounterBillPrintDetail): number {
    const taxableAmount = this.getTaxableAmount(item);
    const GstAmount =( (taxableAmount * item.igstper ||0)/100) + ((taxableAmount * item.sgstper ||0)/100) + ((taxableAmount * item.cgstper ||0)/100);
    return (

      taxableAmount +(GstAmount ))
  }


  getGstWiseSummary(): any[] {

  if (!this.billData?.details?.length) {
    return [];
  }

  const groups: any = {};

  this.billData.details.forEach(item => {

    const key = `${item.sgstper}_${item.cgstper}_${item.igstper}`;

    if (!groups[key]) {
      groups[key] = {
        taxableValue: 0,
        sgstper: item.sgstper || 0,
        sgstamnt: 0,
        cgstper: item.cgstper || 0,
        cgstamnt: 0,
        igstper: item.igstper || 0,
        igstamnt: 0
      };
    }

    groups[key].taxableValue += this.getTaxableAmount(item);
    groups[key].sgstamnt += item.sgstamnt || 0;
    groups[key].cgstamnt += item.cgstamnt || 0;
    groups[key].igstamnt += item.igstamnt || 0;
  });

  return Object.values(groups);
}

getTotalTaxableAmount(): number {
  return this.billData?.details?.reduce(
    (sum, item) => sum + this.getTaxableAmount(item),
    0
  ) || 0;
}

getTotalSGSTCalculated(): number {
  return this.billData?.details?.reduce(
    (sum, item) =>
      sum + ((this.getTaxableAmount(item) * (item.sgstper || 0)) / 100),
    0
  ) || 0;
}

getTotalCGSTCalculated(): number {
  return this.billData?.details?.reduce(
    (sum, item) =>
      sum + ((this.getTaxableAmount(item) * (item.cgstper || 0)) / 100),
    0
  ) || 0;
}

getTotalIGSTCalculated(): number {
  return this.billData?.details?.reduce(
    (sum, item) =>
      sum + ((this.getTaxableAmount(item) * (item.igstper || 0)) / 100),
    0
  ) || 0;
}
}