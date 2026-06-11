import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../../core/services/loader';
import { RepairBillService } from '../../../core/services/repair-bill-service';
import { StorageService } from '../../../core/services/storage';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IssueTypes } from '../../../constant';
import { CurrencyService } from '../../../core/services/currency-service';

@Component({
  selector: 'app-repair-bill-performa',
  imports: [CommonModule],
  templateUrl: './repair-bill-performa.html',
  styleUrl: './repair-bill-performa.scss',
})
export class RepairBillPerforma implements OnInit {
  performaData: any;
  repairBillId: number;
  partDetails: any[] = [];
  labourDetails: any[] = [];
  currentDate: Date = new Date();
  issueTypes = IssueTypes;
  invoiceTotal: number
  taxSummary: any[] = [];
  sgstRate:number
  cgstRate:number
  igstRate:number



  constructor(private loader: LoaderService,
    private repairBillService: RepairBillService,
    private storageService: StorageService,
    private convertToWord : CurrencyService,
    private route: ActivatedRoute,
  ) {

  }
  ngOnInit(): void {
    this.currentDate = new Date();
    this.route.params.subscribe(params => {

      if (params['repairBillId']) {
        this.repairBillId = +params['repairBillId'];
        this.loadgenerateRepairBillPerforma(this.repairBillId);
      }
    });


  }

  loadgenerateRepairBillPerforma(repairBillId: number) {
    this.loader.show();

    const DealerCode = this.storageService.getDealerCode();
    this.repairBillService.generateRepairBillPerformaDetails(DealerCode, repairBillId).subscribe({
      next: (res) => {
        this.loader.hide();
        this.performaData = res;
        this.partDetails =
          this.performaData.repairBillDetail
            .filter((x: any) => x.itemType === 'Part');
        this.labourDetails =
          this.performaData.repairBillDetail
            .filter((x: any) => x.itemType === 'Labour');
        this.getIssueTypeName(this.performaData.repairBillDetail[0].issueType);
        this.invoiceTotal = (this.performaData.subTotal || 0) + (this.performaData.roundOff || 0)
        this.loadTaxSummary();

        console.log(this.performaData);
      },
      error: (err) => {
        console.log(err);
        this.loader.hide();

      }

    });
  }
  get invoiceTotalInWords(): string {
    return this.convertToWord.convertToWords(this.invoiceTotal);
  }
  getIssueTypeName(id: number): string {
    return this.issueTypes.find(x => x.id === id)?.name || '';
  }

  get totalTaxable(): number {
    return this.performaData?.hsncoDeTaxSummary?.reduce(
      (sum: number, item: any) => sum + (item.taxableValue || 0),
      0
    ) || 0;
  }

  get totalSGST(): number {
    return this.performaData?.hsncoDeTaxSummary?.reduce(
      (sum: number, item: any) => sum + (item.sgstAmount || 0),
      0
    ) || 0;
  }

  get totalCGST(): number {
    return this.performaData?.hsncoDeTaxSummary?.reduce(
      (sum: number, item: any) => sum + (item.cgstAmount || 0),
      0
    ) || 0;
  }

  get totalIGST(): number {
    return this.performaData?.hsncoDeTaxSummary?.reduce(
      (sum: number, item: any) => sum + (item.igstAmount || 0),
      0
    ) || 0;
  }

  loadTaxSummary() {

  this.taxSummary = [
    {
      sgstRate : this.performaData.hsncoDeTaxSummary[1].sgstRate,
      cgstRate : this.performaData.hsncoDeTaxSummary[1].cgstRate,
      igstRate : this.performaData.hsncoDeTaxSummary[1].igstRate,
      taxableValue: this.totalTaxable,
      sgstAmount: this.totalSGST,
      cgstAmount: this.totalCGST,
      igstAmount: this.totalIGST
    }
  ];

}

}
