import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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

  printReport() {
    window.print();
    //   const printContents = document.getElementById('reportContent')?.innerHTML;
    //   if (!printContents) return;

    //   const popupWindow = window.open('', '_blank', 'width=900,height=700');
    //   if (!popupWindow) return;

    //   popupWindow.document.open();
    //   popupWindow.document.write(`
    //   <html>
    //     <head>
    //       <title>Print Preview</title>
    //       <style>
    //         body { font-family: Arial, sans-serif; margin: 20px; }
    //         table { width: 100%; border-collapse: collapse; }
    //         th, td { border: 1px solid black; padding: 5px; text-align: left; }
    //         h1 { text-align: center; }
    //       </style>
    //     </head>
    //     <body>
    //       ${printContents}
    //     </body>
    //   </html>
    // `);
    //   popupWindow.document.close();
    //   popupWindow.focus();
    //   // popupWindow.print();
    //   // popupWindow.close(); // Uncomment to auto-close after printing
  }
}