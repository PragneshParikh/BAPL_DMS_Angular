import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { FreeServiceClaimService } from '../../../core/services/free-service-claim';
import { Router } from '@angular/router';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-free-service-claim-list',
  imports: [SharedModule, CommonModule, NgbPagination, FormsModule, ReactiveFormsModule, NgbTooltip],
  templateUrl: './free-service-claim-list.html',
  styleUrl: './free-service-claim-list.scss',
})
export class FreeServiceClaimList implements OnInit {

  public searchTerm: string = '';
  dataSource: any[] = [];
  locationList: any[] = [];
  dealerCode: string | null = null;
  readonly SUBMENU_ID = 66;
  canCreate = false;
  canDownload = false;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean;

  filterFormData: any = {
    dateFrom: '',
    dateTo: '',
    location: '',
    claimNo: '',
    status: ''
  };

  constructor(
    private storageService: StorageService,
    private loader: LoaderService,
    private toaster: ToastService,
    private locationMasterService: LocationMasterService,
    private freeServiceClaimService: FreeServiceClaimService,
    private menuAccess: MenuAccessService,
    private router: Router
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.loadWorkShopLocations();
    this.initDefaultDates();
    this.getSubmittedClaimByDealer(); 
  }

  initDefaultDates() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    this.filterFormData.dateTo = to.toISOString().split('T')[0];
    this.filterFormData.dateFrom = from.toISOString().split('T')[0];
  }

  onPageChange(page: any) {
    this.page = page;
    this.getSubmittedClaimByDealer();
  }

  onSearch() {
    this.page = 1;
    this.getSubmittedClaimByDealer();
  }

  getLocationName(code: string): string {
    return this.locationList.find(x => x.loccode === code)?.locname || code;
  }

  getSubmittedClaimByDealer() {
    const selectedLoc = this.locationList.find(x => x.loccode === this.filterFormData.location);
    const _dealerCode = selectedLoc ? selectedLoc.dealerCode : this.dealerCode;

    this.loader.show();
    //this.freeServiceClaimService.getByDealerCode(_dealerCode, this.pageSize, this.page).subscribe({
    this.freeServiceClaimService.getByDealerCode(
  _dealerCode, this.pageSize, this.page,
  this.filterFormData.dateFrom, this.filterFormData.dateTo
  ).subscribe({
      next: (res: any) => {
        let allData = res.data || [];

        if (this.filterFormData.status) {
          allData = allData.filter((item: any) => item.status === this.filterFormData.status);
        }

        this.dataSource = allData;
        this.collectionSize = res.totalRecords;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  addNewClaim(data: any) {
    const claimNo = data?.claimNo || '0';
    const value = Date.now() + '|' + claimNo;
    const encClaim = btoa(value);
    this.router.navigate(['/free-service-claim', encClaim]);
  }

  downloadExcel() { }

  loadWorkShopLocations() {
    this.loader.show();
    this.locationMasterService.getLocationByDealerCodeAndAreaId(this.dealerCode, 2).subscribe({
      next: (res: any) => {
        this.locationList = res;
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  onDoubleClick(row: any) {
  if (row?.pendingCount === 0) return;     
  this.router.navigate(['/bg-free-service'], { queryParams: { claimId: row?.id } });
}
  generateInvoice(claim: any) {
  this.loader.show();
  this.freeServiceClaimService.generateInvoice(claim.id).subscribe({
    next: () => {
      this.loader.hide();
      this.toaster.show('Invoice generated successfully.', { classname: 'bg-success text-white', delay: 5000 });
      this.getSubmittedClaimByDealer();
    },
    error: (err) => {
      this.loader.hide();
      this.toaster.show(err?.error || 'Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
    }
  });
}

// private openPrint(title: string, bodyHtml: string) {
//   const w = window.open('', '_blank', 'width=1000,height=700');
//   if (!w) { this.toaster.show('Popup blocked. Please allow popups in your browser to print.', { classname: 'bg-danger text-white', delay: 5000 }); return; }
//   w.document.write(`<html><head><title>${title}</title><style>
//     body{font-family:Arial;padding:16px} table{border-collapse:collapse;width:100%}
//     th,td{border:1px solid #444;padding:4px;font-size:12px;text-align:left}</style></head>
//     <body>${bodyHtml}</body></html>`);
//   w.document.close(); w.focus(); w.print();
// }

// printClaim(claim: any) {
//   this.freeServiceClaimService.getClaimById(claim.id).subscribe((res: any) => {
//     const approved = (res?.ItemDetails || []).filter((x: any) => (x.isApproved ?? x.IsApproved) === true);
//     const rows = (res?.ItemDetails || []).filter((x: any) => x.isApproved !== false).map((x: any, i: number) =>
//       `<tr><td>${i + 1}</td><td>${x.jobNo ?? ''}</td><td>${x.registrationNo ?? ''} / ${x.chassisNo ?? ''}</td>
//        <td>${x.modelName ?? ''}</td><td>${x.couponNo ?? ''}</td><td>${x.partyName ?? ''}</td>
//        <td>${x.saleDate ?? ''}</td><td>${x.rate ?? 0}</td><td>${x.gstAmount ?? 0}</td></tr>`).join('');
//     this.openPrint('Free Service Claim', `<h3>Free Service Claim: ${claim.claimPrefix}</h3>
//       <table><tr><th>#</th><th>Job No</th><th>Reg / Chassis</th><th>Model</th><th>Coupon</th>
//       <th>Customer</th><th>Sale Date</th><th>Rate</th><th>GST</th></tr>${rows}</table>`);
//   });
// }

// printInvoice(claim: any) {
//   this.freeServiceClaimService.getClaimById(claim.id).subscribe((res: any) => {
//     const approved = (res?.ItemDetails || []).filter((x: any) => (x.isApproved ?? x.IsApproved) === true);
//     const byModel: any = {};
//     approved.forEach((x: any) => {
//       const k = x.modelName || '-';
//       byModel[k] = byModel[k] || { qty: 0, rate: Number(x.rate || 0), gst: 0 };
//       byModel[k].qty++;
//       byModel[k].gst += Number(x.gstAmount || 0);
//     });
//     let total = 0;
//     const rows = Object.keys(byModel).map(k => {
//       const m = byModel[k], amt = m.qty * m.rate + m.gst; total += amt;
//       return `<tr><td>${k}</td><td>${m.qty}</td><td>${m.rate}</td><td>${m.gst}</td><td>${amt}</td></tr>`;
//     }).join('');
//     this.openPrint('Free Service Invoice', `<h3>Invoice: ${claim.invoiceNo}</h3><p>Claim: ${claim.claimPrefix}</p>
//       <table><tr><th>Model</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>${rows}
//       <tr><th colspan="4">Total</th><th>${total}</th></tr></table>`);
//   });
// }

  // ================= PRINT =================
  private readonly SUPPLIER = {
    name: 'BGAUSS AUTO PRIVATE LIMITED',
    address: 'Unit No. A, Building No. B-500, Plot Nos D223/1, D223/2 and D223/3,IndoSpace Industrial Park Chakan,Chakan Industrial Area,Phase II,Village-Bhamboli,Taluka Khed,District-Pune-410501',
    city: 'Pune',
    state: 'MAHARASHTRA',
    gstin: '27AAJCB1512G1Z1',
    stateCode: '27'
  };
  private readonly HSN_SAC = '998729';

  private fmtDate(d: any): string {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
  }

  private n2(v: any): string {
    return Number(v || 0).toFixed(2);
  }

  private amountInWords(amount: number): string {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
      'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const two = (n: number) => n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    const three = (n: number) =>
      (n >= 100 ? a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '');
    let n = Math.round(amount);
    if (n === 0) return 'Zero Only';
    const parts: string[] = [];
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(two(crore) + ' Crore');
    if (lakh) parts.push(two(lakh) + ' Lakh');
    if (thousand) parts.push(two(thousand) + ' Thousand');
    if (n) parts.push(three(n));
    return parts.join(' ') + ' Only';
  }

  // private isIgst(dealer: any): boolean {
  //   const stateCode = (dealer?.gstin || '').substring(0, 2);
  //   return stateCode !== this.SUPPLIER.stateCode;
  // }
    private isIgst(dealer: any): boolean {
    const code = (dealer?.gstin || '').substring(0, 2);
    if (code) return code !== this.SUPPLIER.stateCode;
    return (dealer?.state || '').trim().toUpperCase() !== this.SUPPLIER.state;  
  }

  private approvedItems(res: any): any[] {
    return (res?.ItemDetails || []).filter((x: any) => (x.isApproved ?? x.IsApproved) === true);
  }

  private openPrint(title: string, css: string, bodyHtml: string) {
    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) {
      this.toaster.show('Popup blocked. Please allow popups in your browser to print.', { classname: 'bg-danger text-white', delay: 5000 });      return;
    }
    w.document.write(`<html><head><title>${title}</title><style>${css}</style></head><body>${bodyHtml}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  // ---------- PRINT CLAIM ----------
  printClaim(claim: any) {
    this.loader.show();
    this.freeServiceClaimService.getClaimById(claim.id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        const dealer = res?.Dealer ?? res?.dealer ?? {};
        const items = this.approvedItems(res);
        const gstType = this.isIgst(dealer) ? 'IGST' : 'CGST+SGST';

        let total = 0;
        const rows = items.map((x: any, i: number) => {
          const rate = Number(x.rate || 0);
          const gst = Number(x.gstAmount || 0);
          const tot = rate + gst;
          const pct = rate ? (gst / rate) * 100 : 0;
          total += tot;
          return `<tr>
            <td>${i + 1}.</td>
            <td>${x.jobNo ?? ''}<br>${this.fmtDate(x.jobDate)}</td>
            <td>${x.modelName ?? ''}<br>${x.vehicleKMs ?? ''} [${this.fmtDate(x.saleDate)}]</td>
            <td>${x.registrationNo ?? ''}<br>${x.chassisNo ?? ''}</td>
            <td>${x.couponNo ?? ''}<br>${x.serviceType ?? ''}</td>
            <td>${x.partyName ?? ''}<br>${x.mobileNo ?? ''}</td>
            <td class="r">${this.n2(rate)}<br>${gstType}</td>
            <td class="r">(${this.n2(pct)})<br>(${this.n2(gst)})</td>
            <td class="r">(${this.n2(tot)})</td>
          </tr>`;
        }).join('');

        const css = `
          body{font-family:Arial,Helvetica,sans-serif;font-size:12px;margin:20px;color:#000}
          .head{position:relative;text-align:center;line-height:1.35}
          .dname{font-size:18px;font-weight:bold;margin-bottom:4px}
          .logo{position:absolute;right:0;top:20px;font-size:22px;font-weight:bold;border:2px solid #1b2a5c;padding:2px 8px;color:#1b2a5c}
          .head .l{text-align:left;display:inline-block;margin-left:0}
          hr{border:0;border-top:1px solid #000;margin:8px 0}
          table.plain{width:100%;border-collapse:collapse}
          table.plain td{padding:3px 4px;vertical-align:top}
          table.grid{width:100%;border-collapse:collapse;margin-top:8px}
          table.grid th,table.grid td{border:1px solid #000;padding:3px 5px;text-align:left;vertical-align:top}
          .r{text-align:right !important}
          .u{text-decoration:underline;font-weight:bold;margin:6px 0}
          @media print{body{margin:8mm}}`;

        const html = `
          <div class="head">
            <div class="logo">BGAUSS</div>
            <div class="dname">${dealer.name ?? ''}</div>
            <div>${dealer.address1 ?? ''}</div>
            <div>${dealer.address2 ?? ''}</div>
            <div>${dealer.city ?? ''}</div>
            <div>${dealer.state ?? ''}</div>
            <div>${dealer.pin ?? ''}</div>
            <div>Phone No. ${dealer.phone ?? ''}</div>
            <div>GSTIN No. ${dealer.gstin ?? ''}</div>
            <div>PAN NO:- ${dealer.pan ?? ''}</div>
          </div>
          <hr>
          <table class="plain">
            <tr><td style="width:90px">Claim No</td><td>: ${res?.ClaimPrefix ?? claim.claimPrefix ?? ''}</td>
                <td class="r">Claim Date</td><td style="width:140px">: ${this.fmtDate(res?.ClaimDate)}</td></tr>
            <tr><td>Remarks</td><td colspan="3">:</td></tr>
          </table>
          <hr>
          <div class="u">Details of Receiver (Billed to)</div>
          <table class="plain">
            <tr><td style="width:90px"><b>Name</b></td><td>: ${this.SUPPLIER.name}</td></tr>
            <tr><td><b>Address</b></td><td>: ${this.SUPPLIER.address}</td></tr>
            <tr><td><b>State</b></td><td>: ${this.SUPPLIER.state}</td></tr>
            <tr><td><b>City</b></td><td>: ${this.SUPPLIER.city}</td></tr>
            <tr><td><b>GSTIN</b></td><td>: ${this.SUPPLIER.gstin}</td></tr>
          </table>
          <table class="grid">
            <tr>
              <th>Sr.No</th><th>Job No<br>Job Date</th><th>Model Name<br>KMS &amp; Sale Date</th>
              <th>Reg No<br>Chassis No</th><th>Coupon No<br>Service Type</th><th>Party Name<br>Party Mobile</th>
              <th class="r">Rate<br>GST Type</th><th class="r">GST %<br>GST Amount</th><th class="r">Total</th>
            </tr>
            ${rows}
            <tr><td colspan="7"></td><td class="r"><b>TOTAL</b></td><td class="r"><b>${this.n2(total)}</b></td></tr>
          </table>
          <p><b>Amount in words:</b> ${this.amountInWords(total)}</p>
          <p style="text-align:right;margin-top:40px"><b>For :${dealer.name ?? ''}</b></p>`;

        this.openPrint('Free Service Claim', css, html);
      },
      error: () => {
        this.loader.hide();
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  // ---------- PRINT INVOICE ----------
  // printInvoice(claim: any) {
  //   this.loader.show();
  //   this.freeServiceClaimService.getClaimById(claim.id).subscribe({
  //     next: (res: any) => {
  //       this.loader.hide();
  //       const dealer = res?.Dealer ?? res?.dealer ?? {};
  //       const items = this.approvedItems(res);
  //       const igst = this.isIgst(dealer);
  //       const locationName = this.getLocationName(claim.locationCode) || dealer.name || '';  
        
  //       const groups: any = {};
  //       items.forEach((x: any) => {
  //         const rate = Number(x.rate || 0);
  //         const key = `${x.serviceType}|${x.modelName}|${rate}`;
  //         groups[key] = groups[key] || { desc: `${x.serviceType ?? ''} - [${x.modelName ?? ''}]`, qty: 0, rate, gst: 0 };
  //         groups[key].qty += 1;
  //         groups[key].gst += Number(x.gstAmount || 0);
  //       });

  //       let total = 0, taxable = 0, gstTotal = 0;
  //       const rows = Object.keys(groups).map((k, i) => {
  //         const g = groups[k];
  //         const base = g.qty * g.rate;
  //         const finalAmt = base + g.gst;
  //         total += finalAmt; taxable += base; gstTotal += g.gst;
  //         return `<tr><td>${i + 1}.</td><td>${g.desc}</td><td>${g.qty}</td>
  //                 <td>${this.n2(g.rate)}</td><td>${this.n2(g.gst)}</td><td>${this.n2(finalAmt)}</td></tr>`;
  //       }).join('');

  //       const pct = taxable ? Math.round((gstTotal / taxable) * 100) : 0;
  //       const sRate = igst ? 0 : pct / 2, sAmt = igst ? 0 : gstTotal / 2;
  //       const iRate = igst ? pct : 0, iAmt = igst ? gstTotal : 0;
  //       const taxCells = `
  //         <td>${sRate}%</td><td>${this.n2(sAmt).replace(/\.?0+$/, '') || '0'}</td>
  //         <td>${sRate}%</td><td>${this.n2(sAmt).replace(/\.?0+$/, '') || '0'}</td>
  //         <td>${iRate}%</td><td>${this.n2(iAmt)}</td>`;

  //       const css = `
  //         body{font-family:'Times New Roman',serif;font-size:13px;margin:20px;color:#000}
  //         table{width:100%;border-collapse:collapse}
  //         td,th{border:1px solid #000;padding:4px 6px;vertical-align:top}
  //         .title{text-align:center;font-size:16px;padding:8px}
  //         .r{text-align:right}.c{text-align:center}
  //         .gray{background:#c8c8c8;font-weight:bold}
  //         @media print{body{margin:8mm}}`;

  //       const html = `
  //         <table>
  //           <tr><td colspan="4" class="title">Tax Invoice</td></tr>
  //           <tr><td colspan="4"><b>Dealer Name : ${dealer.name ?? ''}</b></td></tr>
  //           <tr><td style="width:15%">Claim No</td><td style="width:35%">${res?.ClaimPrefix ?? claim.claimPrefix ?? ''}</td>
  //               <td style="width:15%">Claim Date</td><td>${this.fmtDate(res?.ClaimDate)}</td></tr>
  //           <tr><td>GST NO</td><td>${dealer.gstin ?? ''}</td><td>PAN NO</td><td>${dealer.pan ?? ''}</td></tr>
  //           <tr><td>Invoice No.</td><td>${res?.InvoiceNo ?? claim.invoiceNo ?? ''}</td>
  //               <td>Invoice Date</td><td>${this.fmtDate(res?.InvoiceDate)}</td></tr>
  //           <tr><td>Dealer Location</td><td>${claim.locationName ?? dealer.name ?? ''}</td><td>Dealer Code</td><td>${res?.DealerCode ?? ''}</td></tr>
  //           <tr><td>State Code</td><td>${(dealer.gstin || '').substring(0, 2)}</td><td>State</td><td>${dealer.state ?? ''}</td></tr>
  //           <tr><td colspan="4">Party Detail(s):<br><span style="font-size:15px">
  //             ${this.SUPPLIER.name}<br>${this.SUPPLIER.address}<br>GSTIN No.: ${this.SUPPLIER.gstin}<br>
  //             ${this.SUPPLIER.city} (${this.SUPPLIER.state})</span></td></tr>
  //         </table>
  //         <table>
  //           <tr><th>SR.NO</th><th>Service Coupon Description</th><th>Qty</th><th>Rate</th><th>GST Amount</th><th>Final Amount</th></tr>
  //           ${rows}
  //           <tr><td colspan="5">Round off</td><td class="r">0.00</td></tr>
  //           <tr><td colspan="5">Total</td><td class="r">${this.n2(total)}</td></tr>
  //           <tr><td colspan="6"><b>In Word:</b> ${this.amountInWords(total)}</td></tr>
  //         </table>
  //         <table>
  //           <tr><td colspan="8" class="gray">Tax Summary GST Wise</td></tr>
  //           <tr class="c"><td rowspan="2">Sr. No.</td><td rowspan="2">Taxable Value</td>
  //               <td colspan="2">SGST Tax</td><td colspan="2">CGST Tax</td><td colspan="2">IGST Tax</td></tr>
  //           <tr class="c"><td>Rate%</td><td>Amount</td><td>Rate%</td><td>Amount</td><td>Rate%</td><td>Amount</td></tr>
  //           <tr><td>1</td><td>${this.n2(taxable)}</td>${taxCells}</tr>
  //           <tr><td colspan="2" class="r">Total:</td><td colspan="2">${this.n2(sAmt)}</td><td colspan="2">${this.n2(sAmt)}</td><td colspan="2">${this.n2(iAmt)}</td></tr>
  //           <tr><td colspan="8" class="gray">Tax Summary HSN Wise</td></tr>
  //           <tr class="c"><td rowspan="2">Sr. No.</td><td rowspan="2">HSN Code</td><td rowspan="2">Taxable Value</td>
  //               <td colspan="2">SGST Tax</td><td colspan="2">CGST Tax</td><td colspan="2">IGST Tax</td></tr>
  //           <tr class="c"><td>Rate%</td><td>Amount</td><td>Rate%</td><td>Amount</td><td>Rate%</td><td>Amount</td></tr>
  //           <tr><td>1</td><td>${this.HSN_SAC}</td><td>${this.n2(taxable)}</td>${taxCells}</tr>
  //         </table>
  //         <p style="font-size:11px">*This is system generated invoice signature and stamp is not required</p>
  //         <p class="r" style="margin-top:40px">For Authorized Signatory &amp; Stamp</p>`;

  //       this.openPrint('Free Service Invoice', css, html);
  //     },
  //     error: () => {
  //       this.loader.hide();
  //       this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
  //     }
  //   });
  // }
  // ---------- PRINT INVOICE ----------
  printInvoice(claim: any) {
    this.loader.show();
    this.freeServiceClaimService.getClaimById(claim.id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        const dealer = res?.Dealer ?? res?.dealer ?? {};
        const items = this.approvedItems(res);
        const igst = this.isIgst(dealer);
        const locationName = this.getLocationName(claim.locationCode) || dealer.name || '';

        const groups: any = {};
        items.forEach((x: any) => {
          const rate = Number(x.rate || 0);
          const key = `${x.serviceType}|${x.modelName}|${rate}`;
          groups[key] = groups[key] || {
            desc: `${x.serviceType ?? ''} - [${x.modelName ?? ''}]`,
            qty: 0,
            rate,
            gst: 0
          };
          groups[key].qty += 1;
          groups[key].gst += Number(x.gstAmount || 0);
        });

        let total = 0, taxable = 0, gstTotal = 0;
        const rows = Object.keys(groups).map((k, i) => {
          const g = groups[k];
          const base = g.qty * g.rate;
          const finalAmt = base + g.gst;
          total += finalAmt;
          taxable += base;
          gstTotal += g.gst;
          return `<tr>
            <td class="c">${i + 1}.</td>
            <td>${g.desc}</td>
            <td class="c">${g.qty}</td>
            <td class="r">${this.n2(g.rate)}</td>
            <td class="r">${this.n2(g.gst)}</td>
            <td class="r">${this.n2(finalAmt)}</td>
          </tr>`;
        }).join('');

        const pct = taxable ? Math.round((gstTotal / taxable) * 100) : 0;
        const sRate = igst ? 0 : pct / 2;
        const sAmt = igst ? 0 : gstTotal / 2;
        const iRate = igst ? pct : 0;
        const iAmt = igst ? gstTotal : 0;

        const taxCells = `
          <td class="c">${sRate}%</td><td class="r">${this.n2(sAmt)}</td>
          <td class="c">${sRate}%</td><td class="r">${this.n2(sAmt)}</td>
          <td class="c">${iRate}%</td><td class="r">${this.n2(iAmt)}</td>`;

        const css = `
          *{box-sizing:border-box}
          body{font-family:'Times New Roman',serif;font-size:12.5px;margin:16px;color:#000}
          table.inv-tbl{width:100%;border-collapse:collapse;table-layout:fixed}
          table.inv-tbl + table.inv-tbl{border-top:none}
          td,th{border:1px solid #000;padding:4px 6px;vertical-align:middle;word-wrap:break-word}
          .title{text-align:center;font-size:16px;font-weight:bold;padding:8px}
          .r{text-align:right}.c{text-align:center}
          .gray{background:#c8c8c8;font-weight:bold}
          @media print{body{margin:8mm}}`;

        const html = `
          <table class="inv-tbl">
            <colgroup>
              <col style="width:18%"><col style="width:32%"><col style="width:18%"><col style="width:32%">
            </colgroup>
            <tr><td colspan="4" class="title">Tax Invoice</td></tr>
            <tr><td colspan="4"><b>Dealer Name : ${dealer.name ?? ''}</b></td></tr>
            <tr>
              <td>Claim No</td><td>${res?.ClaimPrefix ?? claim.claimPrefix ?? ''}</td>
              <td>Claim Date</td><td>${this.fmtDate(res?.ClaimDate)}</td>
            </tr>
            <tr>
              <td>GST NO</td><td>${dealer.gstin ?? ''}</td>
              <td>PAN NO</td><td>${dealer.pan ?? ''}</td>
            </tr>
            <tr>
              <td>Invoice No.</td><td>${res?.InvoiceNo ?? claim.invoiceNo ?? ''}</td>
              <td>Invoice Date</td><td>${this.fmtDate(res?.InvoiceDate)}</td>
            </tr>
            <tr>
              <td>Dealer Location</td><td>${locationName}</td>
              <td>Dealer Code</td><td>${res?.DealerCode ?? ''}</td>
            </tr>
            <tr>
              <td>State Code</td><td>${(dealer.gstin || '').substring(0, 2)}</td>
              <td>State</td><td>${dealer.state ?? ''}</td>
            </tr>
            <tr>
              <td colspan="4">Party Detail(s):<br>
                <span style="font-size:14px;line-height:1.35">
                  <b>${this.SUPPLIER.name}</b><br>
                  ${this.SUPPLIER.address}<br>
                  GSTIN No.: ${this.SUPPLIER.gstin}<br>
                  ${this.SUPPLIER.city} (${this.SUPPLIER.state})
                </span>
              </td>
            </tr>
          </table>

          <table class="inv-tbl">
            <colgroup>
              <col style="width:8%"><col style="width:44%"><col style="width:8%">
              <col style="width:13%"><col style="width:13%"><col style="width:14%">
            </colgroup>
            <tr>
              <th class="c">SR.NO</th>
              <th>Service Coupon Description</th>
              <th class="c">Qty</th>
              <th class="r">Rate</th>
              <th class="r">GST Amount</th>
              <th class="r">Final Amount</th>
            </tr>
            ${rows}
            <tr><td colspan="5"><b>Round off</b></td><td class="r">0.00</td></tr>
            <tr><td colspan="5"><b>Total</b></td><td class="r"><b>${this.n2(total)}</b></td></tr>
            <tr><td colspan="6"><b>In Word:</b> ${this.amountInWords(total)}</td></tr>
          </table>

          <table class="inv-tbl">
            <colgroup>
              <col style="width:8%"><col style="width:20%">
              <col style="width:10%"><col style="width:14%">
              <col style="width:10%"><col style="width:14%">
              <col style="width:10%"><col style="width:14%">
            </colgroup>
            <tr><td colspan="8" class="gray">Tax Summary GST Wise</td></tr>
            <tr class="c">
              <th rowspan="2">Sr. No.</th>
              <th rowspan="2">Taxable Value</th>
              <th colspan="2">SGST Tax</th>
              <th colspan="2">CGST Tax</th>
              <th colspan="2">IGST Tax</th>
            </tr>
            <tr class="c">
              <th>Rate%</th><th>Amount</th>
              <th>Rate%</th><th>Amount</th>
              <th>Rate%</th><th>Amount</th>
            </tr>
            <tr>
              <td class="c">1</td>
              <td class="r">${this.n2(taxable)}</td>
              ${taxCells}
            </tr>
            <tr>
              <td colspan="2" class="r"><b>Total:</b></td>
              <td colspan="2" class="r">${this.n2(sAmt)}</td>
              <td colspan="2" class="r">${this.n2(sAmt)}</td>
              <td colspan="2" class="r">${this.n2(iAmt)}</td>
            </tr>
          </table>

          <table class="inv-tbl">
            <colgroup>
              <col style="width:8%"><col style="width:14%"><col style="width:16%">
              <col style="width:9%"><col style="width:12%">
              <col style="width:9%"><col style="width:12%">
              <col style="width:9%"><col style="width:12%">
            </colgroup>
            <tr><td colspan="9" class="gray">Tax Summary HSN Wise</td></tr>
            <tr class="c">
              <th rowspan="2">Sr. No.</th>
              <th rowspan="2">HSN Code</th>
              <th rowspan="2">Taxable Value</th>
              <th colspan="2">SGST Tax</th>
              <th colspan="2">CGST Tax</th>
              <th colspan="2">IGST Tax</th>
            </tr>
            <tr class="c">
              <th>Rate%</th><th>Amount</th>
              <th>Rate%</th><th>Amount</th>
              <th>Rate%</th><th>Amount</th>
            </tr>
            <tr>
              <td class="c">1</td>
              <td class="c">${this.HSN_SAC}</td>
              <td class="r">${this.n2(taxable)}</td>
              ${taxCells}
            </tr>
            <tr>
              <td colspan="3" class="r"><b>Total:</b></td>
              <td colspan="2" class="r">${this.n2(sAmt)}</td>
              <td colspan="2" class="r">${this.n2(sAmt)}</td>
              <td colspan="2" class="r">${this.n2(iAmt)}</td>
            </tr>
          </table>

          <p style="font-size:11px;margin-top:8px">*This is system generated invoice signature and stamp is not required</p>
          <p class="r" style="margin-top:36px"><b>For Authorized Signatory &amp; Stamp</b></p>`;

        this.openPrint('Free Service Invoice', css, html);
      },
      error: () => {
        this.loader.hide();
        this.toaster.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

}