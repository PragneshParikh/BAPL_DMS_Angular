import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proforma-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proforma-invoice.html',
  styleUrl: './proforma-invoice.scss',
})
export class ProformaInvoice {

  // 🔹 Main Form Data
  formData: any = {
    date: '',
    location: '',
    prefix: '',
    proformaNo: '1',
    billType: 'Cash',
    cashAccount: '',

    partyName: '',
    mobile: '',
    state: '',
    scheme: '',

    jobNo: '',
    regNo: '',
    model: '',
    odo: '',
    category: '',
    technician: '',

    remarks: '',

    taxable: 0,
    net: 0,
    received: 0,
    balance: 0
  };

  // 🔹 Current Item Entry
  item: any = {
    type: 'Part',
    description: '',
    qty: 0,
    rate: 0,
    discount: 0
  };

  // 🔹 Item List
  items: any[] = [];

  // ✅ Add Item
  addItem() {
    if (!this.item.description || this.item.qty <= 0) return;

    const amount =
      (this.item.qty * this.item.rate) - this.item.discount;

    this.items.push({
      ...this.item,
      amount
    });

    this.calculateTotals();

    // reset item row
    this.item = {
      type: 'Part',
      description: '',
      qty: 0,
      rate: 0,
      discount: 0
    };
  }

  // ✅ Calculate Totals
  calculateTotals() {
    const total = this.items.reduce((sum, i) => sum + i.amount, 0);

    this.formData.taxable = total;
    this.formData.net = total;

    this.calculateBalance();
  }

  // ✅ Balance Calculation
  calculateBalance() {
    this.formData.balance =
      this.formData.net - (this.formData.received || 0);
  }

}