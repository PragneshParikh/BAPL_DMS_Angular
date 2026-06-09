import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private ones: string[] = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  private tens: string[] = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  // Convert number to words (Indian numbering system)
  convertToWords(amount: number): string {
    if (isNaN(amount) || amount < 0) {
      return 'Invalid amount';
    }

    if (amount === 0) {
      return 'Zero';
    }

    const numStr = amount.toString().split('.');
    const integerPart = parseInt(numStr[0], 10);
    const decimalPart = numStr[1] ? parseInt(numStr[1].substring(0, 2), 10) : 0;

    let words = this.convertNumber(integerPart) + ' Rupees';
    if (decimalPart > 0) {
      words += ' and ' + this.convertNumber(decimalPart) + ' Paise';
    }
    return words.trim();
  }

  private convertNumber(num: number): string {
    if (num === 0) return '';

    if (num < 20) {
      return this.ones[num] + ' ';
    } else if (num < 100) {
      return this.tens[Math.floor(num / 10)] + ' ' + this.ones[num % 10] + ' ';
    } else if (num < 1000) {
      return this.ones[Math.floor(num / 100)] + ' Hundred ' + this.convertNumber(num % 100);
    } else if (num < 100000) {
      return this.convertNumber(Math.floor(num / 1000)) + 'Thousand ' + this.convertNumber(num % 1000);
    } else if (num < 10000000) {
      return this.convertNumber(Math.floor(num / 100000)) + 'Lakh ' + this.convertNumber(num % 100000);
    } else {
      return this.convertNumber(Math.floor(num / 10000000)) + 'Crore ' + this.convertNumber(num % 10000000);
    }
  }
}
