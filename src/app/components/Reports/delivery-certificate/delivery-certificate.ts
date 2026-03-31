import { Component } from '@angular/core';

@Component({
  selector: 'app-delivery-certificate',
  imports: [],
  templateUrl: './delivery-certificate.html',
  styleUrl: './delivery-certificate.scss',
})
export class DeliveryCertificate {
  currentDate: Date = new Date();

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
    popupWindow.print();
    // popupWindow.close(); // Uncomment to auto-close after printing
  }
}
