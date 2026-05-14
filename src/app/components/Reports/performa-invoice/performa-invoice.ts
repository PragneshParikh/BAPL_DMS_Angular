import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/storage';
import { DealerService } from '../../../core/services/dealer-service';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { ProformaInvoiceService } from '../../../core/services/proforma-invoice-service';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';
import { LedgerMaster } from '../../../core/services/ledger-master';
import { CurrencyService } from '../../../core/services/currency-service';

@Component({
  selector: 'app-performa-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performa-invoice.html',
  styleUrl: './performa-invoice.scss',
})
export class PerformaInvoice implements OnInit {

  currentDate: Date = new Date();

  dealer: DealerMasterViewModel | null = null;
  saleBillId: string = '';
  saleBill: any;
  CustomerLedger: any;

  invoiceType: string = 'ex';

  registrationAmount: number = 0;
  insuranceAmount: number = 0;
  preGstDiscount: number = 0;
  onRoadTotal: number = 0;

  amounts = {
    taxable: 0,
    cgst: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: 0,
    sgst: 0,
    igst: 0,
    exShowroom: 0,
    discount: 0,
    total: 0
  };
  inWords: string;
  isInvoiced: boolean;

  constructor(
    private storageService: StorageService,
    private dealerService: DealerService,
    private proformaInvoiceService: ProformaInvoiceService,
    private route: ActivatedRoute,
    private vehicleSaleBillService: VehicleSaleBillService,
    private router: Router,
    private ledgerService: LedgerMaster,
    private currencyService: CurrencyService
  ) { }

  ngOnInit() {
    this.getDealerDetails();

    this.saleBillId = this.route.snapshot.paramMap.get('saleBillNo') || '';

    this.route.queryParams.subscribe(params => {
      this.invoiceType = params['type'] || 'ex';
    });
    if (this.saleBillId) {
      this.getBillById(parseInt(this.saleBillId));
    }
  }

  // CALCULATE FOR MULTIPLE ROWS
  calculateAmounts() {
    const details = this.saleBill?.details || [];

    this.amounts.taxable = 0;
    this.amounts.cgst = 0;
    this.amounts.sgst = 0;
    this.amounts.igst = 0;
    this.amounts.discount = 0;
    this.amounts.total = 0;

    this.registrationAmount = 0;
    this.insuranceAmount = 0;
    this.preGstDiscount = 0;

    details.forEach((item: any) => {
      this.amounts.taxable += item.itemRate || 0;

      this.amounts.cgst += item.cgstamnt || 0;
      this.amounts.sgst += item.sgstamnt || 0;
      this.amounts.igst += item.igstamnt || 0;

      this.amounts.cgstPercent = item.cgstper || 0;
      this.amounts.sgstPercent = item.sgstper || 0;
      this.amounts.igstPercent = item.igstper || 0;

      this.amounts.discount += item.preGstDiscount || 0;

      //  Use finalAmount directly (already calculated in backend)
      // this.amounts.total += item.finalAmount || 0;

      this.preGstDiscount += item.preGstDiscount || 0;

      this.registrationAmount += item.regAmount || 0;

      this.insuranceAmount += item.insuranceAmount || 0;

      this.amounts.total += item.finalAmount || 0;
    });

    // Ex-showroom = taxable + taxes
    this.amounts.exShowroom =
      this.amounts.taxable +
      this.amounts.cgst +
      this.amounts.sgst +
      this.amounts.igst;
    this.convert();

    this.onRoadTotal =
      this.amounts.total +
      this.registrationAmount +
      this.insuranceAmount;

    this.convert();
  }

  getDealerDetails() {
    const dealerCode = this.storageService.getDealerCode();

    this.dealerService.getDealers(dealerCode).subscribe((res: any) => {
      console.log(res, "Dealer Response");
      this.dealer = res?.data?.[0] || null;
    });
  }

  getBillById(id: number) {
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        this.saleBill = res;
        if (this.saleBill.erpStatus == "Invoiced") {
          this.isInvoiced = true;
        }
        console.log(res, "Sale Bill Response");
        this.calculateAmounts();

        if (this.saleBill?.ledgerId) {
          console.log(this.saleBill.ledgerId);

          this.ledgerService.getLedgerById(this.saleBill.ledgerId).subscribe({
            next: (ledgerRes) => {
              this.CustomerLedger = ledgerRes;
              console.log(ledgerRes, "Ledger inside");
            },
            error: (err) => console.error(err)
          });
        }
      },
      error: (err) => console.error(err)
    });


  }

  printReport() {
    setTimeout(() => window.print(), 300);
  }

  savePerformaInvoice() {
    this.proformaInvoiceService.generatePerformaInvoice({
      vehicleSaleBillNo: this.saleBill.saleBillNo,
    }).subscribe({
      next: () => this.router.navigate(['/proforma-invoice']),
      error: (err) => console.error(err)
    });
  }
  get taxType() {
    const item = this.saleBill?.details?.[0];
    if (!item) return '';

    return item.igstPer > 0 ? 'IGST' : 'GST';
  }
  // convert() {
  //     this.inWords = this.currencyService.convertToWords(this.amounts.total);
  //   }

  convert() {

    const amount =
      this.invoiceType === 'onroad'
        ? this.onRoadTotal
        : this.amounts.total;

    this.inWords =
      this.currencyService.convertToWords(amount);

  }

}