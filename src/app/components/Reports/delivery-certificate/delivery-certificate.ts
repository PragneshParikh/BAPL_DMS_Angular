import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';
import { error, log } from 'console';
import { DealerService } from '../../../core/services/dealer-service';
import { StorageService } from '../../../core/services/storage';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { resolve } from 'path';
import { reject } from 'lodash';

@Component({
  selector: 'app-delivery-certificate',
  imports: [CommonModule],
  templateUrl: './delivery-certificate.html',
  styleUrl: './delivery-certificate.scss',
})
export class DeliveryCertificate {
  currentDate: Date = new Date();
  certificateNo: string = 'DEC12PBA012844';
  variant: string = 'BGauss C12i MAX 2.0 Brooklyn Black';
  vinNo: string = 'P6DEC12PBA012844';
  motorSerialNo: string = 'w3435332';
  dealerName: string = 'RRG Test Dealer Motors';
  dealerCode: string = 'CUS9999';
  saleDate: Date = this.currentDate;
  deliveryDate: Date = this.currentDate;
  saleBillId: string;
  saleBill: any;
  dealer: DealerMasterViewModel | null = null;
  regNo: string = 'AP09CD1234';
  customerName: string = 'John Doe';
  invoiceNo: any;

  /**
   *
   */
  constructor(private route: ActivatedRoute,
    private vehicleSaleBillService: VehicleSaleBillService,
    private storageService: StorageService,
    private dealerService: DealerService,
  private router:Router) { }


  async ngOnInit() {
    this.saleBillId = this.route.snapshot.paramMap.get('id') || '';
    console.log(this.saleBillId);
    
    if (this.saleBillId) {
      await this.getDealerDetails();
      this.getBillById(parseInt(this.saleBillId));
    }
  }
  getDealerDetails(): Promise<any> {
    return new Promise((resolve, reject) => {
      const dealerCode = this.storageService.getDealerCode();

      this.dealerService.getByDealerCode(dealerCode).subscribe((res: any) => {
        this.dealer = res?.data|| null;
        resolve(true);
      }, error => {
        reject(false);
      });
    });
  }

  getBillById(id: number) {
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        this.saleBill = res;
        if (res) {
          this.currentDate = this.currentDate;
          this.certificateNo = res.saleBillNo;
          this.variant = res.details[0].modelName;
          this.vinNo = res.details[0].chassisNo;
          this.motorSerialNo = res.details[0].motorNo
          this.dealerName = this.dealer?.compname || '';
          this.dealerCode = res.dealerCode;
          this.saleDate = res.saleDate;
          this.deliveryDate = this.currentDate;
          // this.saleBillId = '';
          // this.saleBill = {};
          this.invoiceNo = res.details[0].invoiceNo;
          this.regNo = res.details[0].regNo;
          this.customerName = res.customerName;

        }

      },
      error: (err) => console.error(err)
    });


  }
  printReport() {
    const printContents = document.getElementById('reportContent')?.innerHTML;
    if (!printContents) return;

    const popupWindow = window.open('', '_blank', 'width=900,height=700');
    if (!popupWindow) return;

    popupWindow.document.open();
    popupWindow.document.write(`
      <html>
        <head>
          <title>Print Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 5px; text-align: left; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    popupWindow.document.close();
    popupWindow.focus();

  }

   goBack(): void {
  this.router.navigate(['/vehicle-sale-bill/edit', this.saleBillId]);
}

printInvoice(): void {
  window.print();
}
}