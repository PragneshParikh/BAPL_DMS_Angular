import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/storage';
import { DealerService } from '../../../core/services/dealer-service';
import { DealerMasterViewModel } from '../../../ViewModels/Dealer/DealerMasterViewModel';
import { log } from 'console';
import { PerformaInvoiceService } from '../../../core/services/performa-invoice-service';
import { ActivatedRoute } from '@angular/router';
import { VehicleSaleBillService } from '../../../core/services/vehicle-sale-bill-service';

@Component({
  selector: 'app-performa-invoice',
  imports: [CommonModule],
  templateUrl: './performa-invoice.html',
  styleUrl: './performa-invoice.scss',
})
export class PerformaInvoice  implements OnInit {
 currentDate: Date = new Date();
  certificateNo: string = 'DEC12PBA012844';
  variant: string = 'BGauss C12i MAX 2.0 Brooklyn Black';
  vinNo: string = 'P6DEC12PBA012844';
  motorSerialNo: string = 'w3435332';
  dealerName: string = 'RRG Test Dealer Motors';
  dealerCode: string = 'CUS9999';
  saleDate: Date = this.currentDate;
  deliveryDate: Date = this.currentDate;
  dealer: DealerMasterViewModel | null = null;
  saleBillNo: string;
  saleBill: any;
/**
 *
 */
constructor(private storageService:StorageService,
  private dealerService:DealerService,
private performaInvoiceService:PerformaInvoiceService,
private route: ActivatedRoute,
private vehicleSaleBillService: VehicleSaleBillService) {
}



  ngOnInit() {
    this.getDealerDetails();
      this.saleBillNo = this.route.snapshot.paramMap.get('saleBillNo') || '';
      console.log(this.saleBillNo);
      
      if (this.saleBillNo) {
        this.getBillById(parseInt(this.saleBillNo));
      }

  }
getDealerDetails(){
  const dealerCode= this.storageService.getDealerCode();
  console.log('Dealer Code from storage:', dealerCode);
  this.dealerService.getDealers(dealerCode).subscribe((response:any)=>{
    if(response){
      console.log(response);
      
      this.dealer =  response.data[0];
      console.log('Dealer Details:', this.dealer);
    }
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

  savePerformaInvoice() {
    this.performaInvoiceService.generatePerformaInvoice({ vehicleSaleBillNo: this.saleBillNo }).
    subscribe(response => {
      console.log('Performa Invoice generated successfully:', response);
    }, error => {
      console.error('Error generating Performa Invoice:', error);
    });
  }


  getBillById(id: number) {
    this.vehicleSaleBillService.getVehicleSaleBillById(id).subscribe({
      next: (res) => {
        console.log('Vehicle Sale Bill Details:', res);
        this.saleBill= res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
