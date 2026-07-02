import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { RepairBillService } from '../../core/services/repair-bill-service';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-repair-bill-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repair-bill-invoice.html',
  styleUrls: ['./repair-bill-invoice.scss']
})
export class RepairBillInvoiceComponent implements OnInit {

  repairBillId = 0;

  data: any = {};

  details: any[] = [];

  taxSummary: any[] = [];

  loading = false;

  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private repairBillService: RepairBillService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {

    this.repairBillId =
      Number(this.route.snapshot.paramMap.get('id'));

    this.loadInvoice();
  }

  loadInvoice(): void {

    const dealerCode =
      this.storageService.getDealerCode();

    this.loading = true;

    this.repairBillService
      .generateRepairBillPerformaDetails(
        dealerCode,
        this.repairBillId
      )
      .subscribe({

        next: (res: any) => {

          this.data = res;

          this.details =
            res.repairBillDetail || [];

          this.taxSummary =
            res.hsncoDeTaxSummary ||
            res.hsnCodeTaxSummary ||
            [];

          this.loading = false;
        },

        error: (err) => {

          console.error(err);

          this.loading = false;

          this.errorMsg =
            'Unable to load invoice.';
        }
      });
  }

  printPage(): void {

    window.print();
  }

  goBack(): void {

    history.back();
  }

  get subTotal(): number {

    return (
      (this.data?.totalPartNetAmount || 0) +
      (this.data?.totalLabourNetAmount || 0)
    );
  }

  getCode(item: any) {

    return item.itemType === 'Part'
      ? item.partCode
      : item.labourCode;
  }

  getDesc(item: any) {

    return item.itemType === 'Part'
      ? item.partDesc
      : item.labourDescription;
  }

  getRate(item: any) {

    return item.itemType === 'Part'
      ? item.partRate
      : item.rate;
  }

  getQty(item: any) {

    return item.itemType === 'Part'
      ? item.partQty
      : item.qty;
  }

  getDiscount(item: any) {

    return item.itemType === 'Part'
      ? item.partDiscount
      : item.discount;
  }

  getTaxable(item: any) {

    return item.itemType === 'Part'
      ? item.partTaxbleAmount
      : item.taxableAmount;
  }

  getNet(item: any) {

    return item.itemType === 'Part'
      ? item.partNetAmount
      : item.netAmount;
  }

  getHsn(item: any) {

    return item.itemType === 'Part'
      ? item.partHSNCode
      : item.labourHSNCode;
  }

  amountInWords(amount: number): string {

    return `${amount.toFixed(2)} Rupees Only`;
  }
}