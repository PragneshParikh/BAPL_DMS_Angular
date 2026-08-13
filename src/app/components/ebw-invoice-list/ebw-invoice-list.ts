//BAPL_DMS_Angular\src\app\components\ebw-invoice-list\ebw-invoice-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EbwInvoiceService } from '../../core/services/ebw-invoice-service';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { ToastService } from '../../shared/toaster/toast-service';
import { TermConditionService } from '../../core/services/term-condition-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import * as XLSX from 'xlsx';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ebw-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPagination], // ADD NgbPagination HERE
  templateUrl: './ebw-invoice-list.html',
  styleUrl: './ebw-invoice-list.scss',
})
export class EbwInvoiceList implements OnInit {
  gridData: any[] = [];
  searchTerm: string = '';
  canManageInvoices: boolean = false;

  private readonly EBW_INVOICE_MODULE_ID = 8;
  private readonly WORKSHOP_AREA_ID = 2;

  locationList: any[] = [];

  // ===== Pagination =====
  page: number = 1;
  pageSize: number = 10;

  filter = {
    fromDate: '',
    toDate: '',
    billNo: '',
    billType: 'All',
    locationCode: '',
  };

  // ===== Print popup =====
  showPrintPopup: boolean = false;
  printRow: any = null;

  constructor(
    private ebwInvoiceService: EbwInvoiceService,
    private loader: LoaderService,
    private storageService: StorageService,
    private toast: ToastService,
    private http: HttpClient,
    private termConditionService: TermConditionService,
    private locationMasterService: LocationMasterService,
    private router: Router
  ) {
    const role = this.storageService.getRole().toLowerCase();
    this.canManageInvoices = role === 'employee' || role === 'superadmin';

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    this.filter.fromDate = from.toISOString().split('T')[0];
    this.filter.toDate = to.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.getLocationList();
    this.loadList();
  }

  getLocationList() {
    const dealerCode = this.storageService.getDealerCode();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(dealerCode, this.WORKSHOP_AREA_ID).subscribe({
      next: (res: any) => {
        this.locationList = res || [];
      },
      error: (err) => console.error(err),
    });
  }

  loadList() {
    this.loader.show();
    this.ebwInvoiceService.getAll(undefined, this.filter.fromDate, this.filter.toDate).subscribe({
      next: (res: any) => {
        this.gridData = res.data || [];
        this.page = 1; // reset to first page on every new load/search
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
      },
    });
  }

  get filteredGrid() {
    let result = this.gridData;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((r) =>
        (r.partyName || '').toLowerCase().includes(term) || String(r.billNo).includes(term)
      );
    }

    if (this.filter.billNo) {
      result = result.filter((r) => String(r.billNo).includes(this.filter.billNo));
    }

    if (this.filter.billType && this.filter.billType !== 'All') {
      result = result.filter((r) => (r.billType || '').toLowerCase() === this.filter.billType.toLowerCase());
    }

    if (this.filter.locationCode) {
      result = result.filter((r) => r.locationCode === this.filter.locationCode);
    }

    return result;
  }

  // ADDED — slices filteredGrid down to the current page for the table to render
  get pagedGrid() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredGrid.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.page = page;
  }

  onPageSizeChange() {
    this.page = 1;
  }

  onFilterChange() {
    this.page = 1;
  }

  openInvoice(row: any) {
    this.router.navigate(['/ebw-invoice', row.id]);
  }

  editRow(row: any) {
    this.router.navigate(['/ebw-invoice', row.id]);
  }

  deleteRow(row: any) {
    const confirmed = window.confirm(`Delete Extended Warranty Invoice for ${row.partyName}? This cannot be undone.`);
    if (!confirmed) return;

    this.loader.show();
    this.ebwInvoiceService.delete(row.id).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('Invoice deleted successfully.', { classname: 'bg-success text-white', delay: 5000 });
        this.loadList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Failed to delete invoice.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  addNew() {
    this.router.navigate(['/ebw-invoice']);
  }

  // ===== Print flow — With GatePass only =====
  openPrintPopup(row: any) {
    this.printRow = row;
    this.showPrintPopup = true;
  }

  closePrintPopup() {
    this.showPrintPopup = false;
    this.printRow = null;
  }

  printInvoice() {
    if (!this.printRow) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      this.toast.show('Popup blocked. Please allow popups for this site and try again.', {
        classname: 'bg-danger text-white', delay: 6000,
      });
      return;
    }

    printWindow.document.write('<p style="font-family:sans-serif;padding:20px;">Loading invoice…</p>');
    printWindow.document.close();

    this.loader.show();
    this.ebwInvoiceService.getById(this.printRow.id).subscribe({
      next: (invoiceData: any) => {
        const dealerCode = invoiceData?.dealerCode || this.storageService.getDealerCode();

        this.ebwInvoiceService.getDealerInfo(dealerCode).subscribe({
          next: (dealerData: any) => this.loadTermsAndFinishPrint(printWindow, invoiceData, dealerData),
          error: (err) => {
            console.error(err);
            this.loadTermsAndFinishPrint(printWindow, invoiceData, {});
          },
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        printWindow.close();
        this.toast.show('Failed to load invoice for printing.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  private loadTermsAndFinishPrint(printWindow: Window, invoiceData: any, dealerData: any) {
    this.termConditionService.getTermConditionsByModule(this.EBW_INVOICE_MODULE_ID).subscribe({
      next: (res: any) => {
        const terms = res.data || [];
        this.finishPrint(printWindow, invoiceData, dealerData, terms);
      },
      error: (err) => {
        console.error(err);
        this.finishPrint(printWindow, invoiceData, dealerData, []);
      },
    });
  }

  private finishPrint(printWindow: Window, invoiceData: any, dealerData: any, terms: any[]) {
    const templateUrl = 'assets/print-templates/EBW_Invoice_With_GatePass.html';

    this.http.get(templateUrl, { responseType: 'text' }).subscribe({
      next: (templateHtml: string) => {
        this.loader.hide();
        const finalHtml = this.buildPrintHtml(templateHtml, invoiceData, dealerData, terms);

        printWindow.document.open();
        printWindow.document.write(finalHtml);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => { printWindow.print(); }, 300);
        this.closePrintPopup();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        printWindow.close();
        this.toast.show('Failed to load print template.', { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  private buildPrintHtml(template: string, inv: any, dealer: any, terms: any[]): string {
    const items = inv.ebwInvoiceDetails || [];

    const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
    const fmt2 = (n: any) => (Number(n) || 0).toFixed(2);
    const fmt3 = (n: any) => (Number(n) || 0).toFixed(3);

    const itemRows = items.map((item: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.itemCode || ''} ${item.description || item.itemName || ''}</td>
        <td>${item.hsnCode || ''}</td>
        <td>${item.qty || 0}</td>
        <td class="num">${fmt3(item.baseItemRate)}</td>
        <td class="num">${fmt2(item.discount)}</td>
        <td class="num">${fmt3((item.baseItemRate || 0) * (item.qty || 0))}</td>
        <td>(${item.sgstPer || 0})<br>${fmt3(item.sgstAmount)}</td>
        <td>(${item.cgstPer || 0})<br>${fmt3(item.cgstAmount)}</td>
        <td class="num">${fmt3(item.amount)}</td>
      </tr>
    `).join('');

    const totalQty = items.reduce((s: number, i: any) => s + Number(i.qty || 0), 0);
    const totalTaxable = items.reduce((s: number, i: any) => s + (Number(i.baseItemRate || 0) * Number(i.qty || 0)), 0);
    const totalSgst = items.reduce((s: number, i: any) => s + Number(i.sgstAmount || 0), 0);
    const totalCgst = items.reduce((s: number, i: any) => s + Number(i.cgstAmount || 0), 0);
    const totalDiscount = items.reduce((s: number, i: any) => s + Number(i.discount || 0), 0);
    const totalIgst = items.reduce((s: number, i: any) => s + Number(i.igstAmount || 0), 0);
    const dealerAddress = [dealer?.adress1, dealer?.adress2].filter((x) => !!x).join(', ');
    const dealerPhone = [dealer?.phoneOff, dealer?.mobile].filter((x) => !!x).join(' ');

    const hsnGroups: { [key: string]: any } = {};
    items.forEach((item: any) => {
      const key = item.hsnCode || '';
      if (!hsnGroups[key]) {
        hsnGroups[key] = { hsnCode: key, taxable: 0, sgst: 0, cgst: 0, igst: 0, sgstPer: item.sgstPer, cgstPer: item.cgstPer, igstPer: item.igstPer };
      }
      hsnGroups[key].taxable += (item.baseItemRate || 0) * (item.qty || 0);
      hsnGroups[key].sgst += Number(item.sgstAmount || 0);
      hsnGroups[key].cgst += Number(item.cgstAmount || 0);
      hsnGroups[key].igst += Number(item.igstAmount || 0);
    });
    const hsnRows = Object.values(hsnGroups).map((g: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${g.hsnCode}</td>
        <td>${fmt3(g.taxable)}</td>
        <td>(${g.sgstPer || 0})<br>${fmt3(g.sgst)}</td>
        <td>(${g.cgstPer || 0})<br>${fmt3(g.cgst)}</td>
        <td>(${g.igstPer || 0})<br>${fmt3(g.igst)}</td>
      </tr>
    `).join('');

    const termsHtml = terms.length > 0
      ? terms.map((t: any, i: number) => `<div>${i + 1}. ${t.termCondition}</div>`).join('')
      : '<div>No terms and conditions configured.</div>';

    const tokens: { [key: string]: string } = {
      dealerShopName: dealer?.compname || '',
      dealerAddressLine1: dealerAddress,
      dealerCity: dealer?.city || '',
      dealerState: dealer?.state || '',
      dealerPincode: dealer?.pin || '',
      dealerPhone: dealerPhone,
      dealerGstin: dealer?.compgstinNo || '',
      dealerPan: dealer?.pan || '',
      logoText: 'BGAUSS',
      billType: inv.billType || '',
      invoiceNo: inv.billNo || '',
      invoiceDate: fmtDate(inv.invoiceDate),
      partyName: inv.partyName || '',
      partyAddress: inv.partyAddress || '',
      partyCity: inv.partyCity || '',
      partyPincode: inv.partyPincode || '',
      partyMobile: inv.partyMobile || '',
      partyGstNo: '',
      partyState: inv.partyState || '',
      totalQty: String(totalQty),
      totalDiscount: fmt2(totalDiscount),
      totalTaxableValue: fmt3(totalTaxable),
      totalSgstAmount: fmt3(totalSgst),
      totalCgstAmount: fmt3(totalCgst),
      totalNetAmount: fmt3(inv.netAmount),
      invoiceDiscount: fmt2(totalDiscount),
      roundedOff: '0.00',
      invoiceTotal: fmt2(inv.netAmount),
      amountInWords: this.numberToWords(Math.round(inv.netAmount || 0)),
      hsnTotalTaxableValue: fmt3(totalTaxable),
      hsnTotalSgst: fmt3(totalSgst),
      hsnTotalCgst: fmt3(totalCgst),
      hsnTotalIgst: fmt3(totalIgst),
      gstSrNo: '1',
      gstTaxableValue: fmt3(totalTaxable),
      gstSgstPercent: items[0]?.sgstPer || 0,
      gstSgstAmount: fmt3(totalSgst),
      gstCgstPercent: items[0]?.cgstPer || 0,
      gstCgstAmount: fmt3(totalCgst),
      gstIgstPercent: items[0]?.igstPer || 0,
      gstIgstAmount: fmt3(totalIgst),
      gstTotalTaxableValue: fmt3(totalTaxable),
      gstTotalSgst: fmt3(totalSgst),
      gstTotalCgst: fmt3(totalCgst),
      gstTotalIgst: fmt3(totalIgst),
      lorryNumber: '',
      lotNo: '',
      lotDate: fmtDate(inv.invoiceDate),
      driverName: '',
      driverMobile: '',
      schemeName: inv.schemeName || '',
      chassisNo: inv.chassisNo || '',
      serialNo: inv.serialNo || '',
      saleDate: fmtDate(inv.chassisSaleDate),
      batteryNumber: '',
      ewPurchaseDate: fmtDate(inv.invoiceDate),
      ewEndDate: fmtDate(inv.validityExpiryDate),
      currentPrintDate: new Date().toLocaleDateString('en-GB'),
      termsAndConditionsList: termsHtml,
    };

    let html = template;

    html = html.replace(
      /<tbody>[\s\S]*?<\/tbody>/,
      `<tbody>${itemRows || '<tr><td colspan="10" style="text-align:center;">No items</td></tr>'}</tbody>`
    );

    html = html.replace(
      /(<caption>Tax Summary HSN\/SAC Wise<\/caption>[\s\S]*?<tbody>)[\s\S]*?(<tr>\s*<td colspan="2">Total:<\/td>)/,
      `$1${hsnRows}$2`
    );

    Object.keys(tokens).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(tokens[key]));
    });

    return html;
  }

  private numberToWords(num: number): string {
    if (num === 0) return 'Zero Only';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    };

    return inWords(num) + ' Only';
  }

  exportToExcel(): void {
    if (!this.filteredGrid || this.filteredGrid.length === 0) {
      this.toast.show('No records to export.', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }

    const exportData = this.filteredGrid.map((row: any, index: number) => ({
      'S.No': index + 1,
      'Bill No': row.billNo,
      'Date': row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-GB') : '',
      'Chassis No': row.chassisNo,
      'Party Name': row.partyName,
      'Location': row.locationName || row.locationCode,
      'Bill Type': row.billType,
      'Mode': row.cashAccName,
      'Bill Amount': row.netAmount,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
    ];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EW Invoices');

    const fileName = `EW_Invoice_List_${this.formatDateForFileName(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private formatDateForFileName(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
}