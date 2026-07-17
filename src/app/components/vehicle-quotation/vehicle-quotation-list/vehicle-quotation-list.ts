import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleQuotationService } from '../../../core/services/vehicle-quotationservice';
import { AuthenticationService } from '../../../core/services/auth.service';
import { VehicleQuotation } from '../../vehicle-quotation/vehicle-quotation';

@Component({
  selector: 'app-vehicle-quotation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehicleQuotation],
  templateUrl: './vehicle-quotation-list.html',
  styleUrls: ['./vehicle-quotation-list.scss']
})
export class VehicleQuotationListComponent implements OnInit {

  quotations: any[] = [];
  filteredData: any[] = [];

  searchText = '';
  loading = false;

  showEditModal = false;
  selectedQuotationId?: number;

  printingId?: number; // shows a spinner/disabled state on the row being printed

  // Access control — SuperAdmin sees every dealer's quotations; any other
  // role only ever sees their own dealer's, same pattern already used by
  // StockReportComponent. NOTE: this only controls what this screen *asks
  // for* — the real boundary has to be enforced server-side too, otherwise
  // a dealer user could still request another dealer's data by calling the
  // API directly with a different dealerCode. See chat for what's needed
  // on the service/backend side to close that gap.
  isSuperAdmin = false;

  constructor(
    private quotationService: VehicleQuotationService,
    private authService: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.isSuperAdmin = currentUser?.role === 'SuperAdmin';

    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    const currentUser = this.authService.currentUserValue;
    const dealerCode = this.isSuperAdmin
      ? undefined
      : (currentUser?.dealerCode ?? undefined);

    this.quotationService.getQuotations(dealerCode).subscribe({
      next: (res: any) => {
        this.quotations = Array.isArray(res) ? res : (res.data || []);
        this.filteredData = [...this.quotations];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  search(): void {
    const txt = this.searchText.toLowerCase();

    this.filteredData = this.quotations.filter(x =>
      (x.quotationNo ?? '').toLowerCase().includes(txt) ||
      (x.customerName ?? '').toLowerCase().includes(txt) ||
      (x.mobileNo ?? '').toLowerCase().includes(txt) ||
      (x.dealerName ?? '').toLowerCase().includes(txt) ||
      (x.modelName ?? '').toLowerCase().includes(txt)
    );
  }

  addNew(): void {
    this.router.navigateByUrl('/vehicle-quotation/add');
  }

  edit(id: number): void {
    if (!id) {
      console.error('Cannot edit — id missing on row:', id);
      alert('Unable to edit this record — missing ID.');
      return;
    }
    this.selectedQuotationId = id;
    this.showEditModal = true;
  }

  closeModal(): void {
    this.showEditModal = false;
    this.selectedQuotationId = undefined;
  }

  onSaved(): void {
    this.closeModal();
    this.loadData();
  }

  delete(id: number): void {
    if (!id) {
      console.error('Cannot delete — id missing on row:', id);
      return;
    }

    if (!confirm('Delete this quotation?')) {
      return;
    }

    this.quotationService.deleteQuotation(id).subscribe({
      next: () => {
        alert('Deleted Successfully');
        this.loadData();
      },
      error: err => {
        console.error(err);
        alert('Delete Failed');
      }
    });
  }

  // =====================================
  // PRINT / PDF
  // Fetches the full record (list grid only has summary fields), builds a
  // formatted A4 print layout in a new window, and triggers the browser's
  // print dialog. The user can "Save as PDF" from there — no extra PDF
  // library dependency needed since this uses the browser's native
  // print-to-PDF renderer.
  // =====================================
  printQuotation(id: number): void {
    if (!id) {
      console.error('Cannot print — id missing on row:', id);
      return;
    }

    this.printingId = id;

    this.quotationService.getQuotationById(id).subscribe({
      next: (data: any) => {
        this.openPrintWindow(data);
        this.printingId = undefined;
      },
      error: (err) => {
        console.error('Print load error', err);
        alert('Unable to load quotation for printing.');
        this.printingId = undefined;
      }
    });
  }

  private openPrintWindow(d: any): void {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow pop-ups to print the quotation.');
      return;
    }

    const fmtDate = (v: any) => {
      if (!v) return '-';
      const dt = new Date(v);
      return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-GB');
    };

    const num = (v: any) => Number(v) || 0;

    const fmtCurrency = (v: any) => {
      const n = num(v);
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Always-shown core rows (even if 0) so the buyer sees the full calculation,
    // matching the "Customer Price + GST − FAME2" note shown on-screen.
    const coreRow = (label: string, value: any, opts: { negative?: boolean } = {}) => {
      const amount = opts.negative ? -Math.abs(num(value)) : num(value);
      const sign = amount < 0 ? '- ' : '';
      return `<tr><td>${label}</td><td class="amt">${sign}₹ ${fmtCurrency(Math.abs(amount))}</td></tr>`;
    };

    // Optional rows — only shown if the charge is actually non-zero, to avoid
    // cluttering the quotation with a wall of "₹ 0.00" lines.
    const optionalRow = (label: string, value: any) =>
      num(value) !== 0 ? coreRow(label, value) : '';

    const custPrice = num(d.custPrice);
    const fame2 = num(d.fame2Amount);
    const sgst = num(d.sgstAmount);
    const cgst = num(d.cgstAmount);
    const igst = num(d.igstAmount);
    const gstTotal = num(d.taxAmount) || (sgst + cgst + igst);
    const exShowroom = num(d.exShowroomPrice);

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Quotation ${d.quotationNo ?? ''}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #222;
    margin: 0;
    padding: 28px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #333;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .header h1 {
    font-size: 21px;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header .sub {
    font-size: 13px;
    color: #555;
    font-weight: bold;
  }
  .quote-meta {
    text-align: right;
    font-size: 12.5px;
  }
  .quote-meta div { margin-bottom: 3px; }
  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    background: #fff3cd;
    color: #7a5b00;
    font-weight: bold;
    font-size: 11px;
  }
  .section-title {
    background: #f0f0f0;
    font-weight: bold;
    padding: 6px 10px;
    margin-top: 18px;
    margin-bottom: 8px;
    border-left: 4px solid #333;
    text-transform: uppercase;
    font-size: 12px;
  }
  table.info {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
  }
  table.info td {
    padding: 5px 8px;
    vertical-align: top;
    width: 25%;
    font-size: 12.5px;
  }
  table.info td.label {
    color: #666;
    width: 15%;
  }
  table.pricing {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
  }
  table.pricing td {
    padding: 6px 10px;
    border-bottom: 1px solid #e8e8e8;
  }
  table.pricing td.amt {
    text-align: right;
    width: 160px;
    font-variant-numeric: tabular-nums;
  }
  table.pricing tr.subtotal td {
    border-top: 1px solid #999;
    font-weight: 600;
    background: #fafafa;
  }
  table.pricing tr.total td {
    border-top: 2px solid #333;
    border-bottom: none;
    font-weight: bold;
    font-size: 15px;
    padding-top: 10px;
  }
  .calc-note {
    font-size: 11px;
    color: #666;
    padding: 4px 10px 0 10px;
    font-style: italic;
  }
  .terms {
    margin-top: 22px;
    font-size: 11px;
    color: #555;
    line-height: 1.5;
  }
  .signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
  }
  .signature-box {
    text-align: center;
    width: 220px;
    border-top: 1px solid #333;
    padding-top: 6px;
    font-size: 12px;
  }
  @media print {
    body { padding: 0 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

  <div class="header">
    <div>
      <h1>Vehicle Quotation</h1>
      <div class="sub">${d.dealerName ?? '-'}</div>
    </div>
    <div class="quote-meta">
      <div><strong>Quotation No:</strong> ${d.quotationNo ?? '-'}</div>
      <div><strong>Date:</strong> ${fmtDate(d.quotationDate)}</div>
      <div><strong>Valid Till:</strong> ${fmtDate(d.validTill ?? d.validTillDate)}</div>
      <div><span class="status-badge">${d.status ?? 'Draft'}</span></div>
    </div>
  </div>

  <div class="section-title">Customer Details</div>
  <table class="info">
    <tr>
      <td class="label">Name</td><td>${d.customerName ?? '-'}</td>
      <td class="label">Mobile</td><td>${d.mobileNo ?? '-'}</td>
    </tr>
    <tr>
      <td class="label">Email</td><td>${d.emailId ?? '-'}</td>
      <td class="label">Address</td><td>${d.address ?? '-'}</td>
    </tr>
    <tr>
      <td class="label">State</td><td>${d.stateName ?? '-'}</td>
      <td class="label">City</td><td>${d.cityName ?? '-'}</td>
    </tr>
  </table>

  <div class="section-title">Vehicle Details</div>
  <table class="info">
    <tr>
      <td class="label">Model</td><td>${d.modelName ?? '-'}</td>
      <td class="label">Variant</td><td>${d.variantName ?? '-'}</td>
    </tr>
    <tr>
      <td class="label">Color</td><td>${d.colorName ?? '-'}</td>
      <td class="label">Dealer</td><td>${d.dealerName ?? '-'}</td>
    </tr>
  </table>

  <div class="section-title">Ex-Showroom Price Calculation</div>
  <table class="pricing">
    ${coreRow('Customer Price (Base)', custPrice)}
    ${coreRow('Add: SGST', sgst)}
    ${coreRow('Add: CGST', cgst)}
    ${igst !== 0 ? coreRow('Add: IGST', igst) : ''}
    ${coreRow('Less: FAME II Subsidy', fame2, { negative: true })}
    <tr class="subtotal">
      <td>Ex-Showroom Price</td>
      <td class="amt">₹ ${fmtCurrency(exShowroom)}</td>
    </tr>
  </table>
  <div class="calc-note">
    Ex-Showroom Price = Customer Price (₹ ${fmtCurrency(custPrice)})
    + GST (₹ ${fmtCurrency(gstTotal)})
    − FAME II Subsidy (₹ ${fmtCurrency(fame2)})
  </div>

  <div class="section-title">Additional Charges</div>
  <table class="pricing">
    ${optionalRow('RTO Charges', d.rtoCharges ?? d.registrationAmount)}
    ${optionalRow('Insurance Amount', d.insuranceAmount)}
    ${optionalRow('Accessories Amount', d.accessoriesAmount)}
    ${optionalRow('Extended Warranty', d.extendedWarrantyAmount)}
    ${optionalRow('AMC Amount', d.amcAmount)}
    ${optionalRow('Other Charges', d.otherCharges)}
    ${optionalRow('Hypothecation Amount', d.hypothecationAmount)}
    ${optionalRow('Plate Amount', d.plateAmount)}
    ${optionalRow('Handling Charges', d.handlingCharges)}
    ${num(d.discountAmount) !== 0 ? coreRow('Discount', d.discountAmount, { negative: true }) : ''}
    ${num(d.exchangeAmount) !== 0 ? coreRow('Exchange Amount', d.exchangeAmount, { negative: true }) : ''}
    <tr class="total">
      <td>Total Amount</td>
      <td class="amt">₹ ${fmtCurrency(d.totalAmount)}</td>
    </tr>
  </table>

  ${d.isFinance ? `
  <div class="section-title">Finance Details</div>
  <table class="info">
    <tr>
      <td class="label">Finance Company</td><td>${d.financeCompanyName ?? '-'}</td>
      <td class="label"></td><td></td>
    </tr>
    <tr>
      <td class="label">Loan Amount</td><td>₹ ${fmtCurrency(d.loanAmount)}</td>
      <td class="label">Down Payment</td><td>₹ ${fmtCurrency(d.downPayment)}</td>
    </tr>
  </table>` : ''}

  ${d.remarks ? `
  <div class="section-title">Remarks</div>
  <div>${d.remarks}</div>` : ''}

  <div class="terms">
    <strong>Terms &amp; Conditions:</strong> This quotation is valid until the date mentioned above.
    Prices are subject to change without prior notice. On-road price may vary based on RTO,
    insurance provider and applicable government charges at the time of booking. GST rates and
    FAME II subsidy amounts are subject to change as per prevailing government regulations.
  </div>

  <div class="signature-row">
    <div class="signature-box">Customer Signature</div>
    <div class="signature-box">Authorized Signatory</div>
  </div>

</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}