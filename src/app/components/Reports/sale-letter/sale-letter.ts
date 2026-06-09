import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { CommonModule } from '@angular/common';
import { DealerService } from '../../../core/services/dealer-service';
import { StorageService } from '../../../core/services/storage';
import { LedgerMaster } from '../../../core/services/ledger-master';
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
    private ledgerService: LedgerMaster,
    private vehicleSaleBillService: VehicleSaleBillService
  ) { }

  ngOnInit(): void {
    this.getDealerDetails();

    this.saleBillId = this.route.snapshot.paramMap.get('saleBillNo') || '';
    if (this.saleBillId) {
      this.getBillById(parseInt(this.saleBillId));
    }

  }
  getDealerDetails() {
    const dealerCode = this.storageService.getDealerCode();

    this.dealerService.getByDealerCode(dealerCode).subscribe((res: any) => {
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


}
