// src\app\components\Reports\sale-letter\sale-letter.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { CommonModule } from '@angular/common';
import { DealerService } from '../../../core/services/dealer-service';
import { StorageService } from '../../../core/services/storage';
import { LedgerMasterService } from '../../../core/services/ledger-master';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';

@Component({
  selector: 'app-sale-letter',
  imports: [CommonModule],
  templateUrl: './sale-letter.html',
  styleUrl: './sale-letter.scss',
})
export class SaleLetter implements OnInit {
  dealer: DealerMasterViewModel;
  partyName!: string;
  modelName!: string;
  chassisNo!: string;
  motorNo!: string;
  regNo!: string;

  today: Date = new Date();
  saleBillId: string;
  invoiceType: any;
  saleBill: any;
  isInvoiced: boolean;
  CustomerLedger: any;

  constructor(
    private route: ActivatedRoute,
    private dealerService: DealerService,
    private storageService: StorageService,
    private ledgerService: LedgerMasterService,
    private vehicleSaleBillService: VehicleSaleBillService,
    private router:Router
  ) { }

  ngOnInit(): void {
    //this.getDealerDetails();

    this.saleBillId = this.route.snapshot.paramMap.get('saleBillNo') || '';
    if (this.saleBillId) {
      this.getBillById(parseInt(this.saleBillId));
    }

  }
  getDealerDetails(dealerCode:string) {
 //   const dealerCode = this.storageService.getDealerCode();

    this.dealerService.getByDealerCode(dealerCode).subscribe((res: any) => {
      this.dealer = res?.data|| null;
    });

  }
  getBillById(id: number) {
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        this.saleBill = res;
        this.getDealerDetails(res.dealerCode);
        if (this.saleBill.erpStatus == "Invoiced") {
          this.isInvoiced = true;
        }

        if (this.saleBill?.ledgerId) {

          this.ledgerService.getLedgerById(this.saleBill.ledgerId).subscribe({
            next: (ledgerRes) => {
              this.CustomerLedger = ledgerRes;
            },
            error: (err) => console.error(err)
          });
        }
      },
      error: (err) => console.error(err)
    });


  }
goBack(): void {
  this.router.navigate(['/vehicle-sale-bill/edit', this.saleBillId]);
}

printInvoice(): void {
  window.print();
}

}
