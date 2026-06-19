import { Component } from '@angular/core';
import { publicDecrypt } from 'crypto';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobType, JobSource, userRole } from '../../constant';
import { NgbPagination, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { JobCardSearchModel } from '../../ViewModels/JobCardViewModel';
import { LocationMasterService } from '../../core/services/location-master-service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbPagination, NgbTooltipModule],
  templateUrl: './job-card.html',
  styleUrl: './job-card.scss',
})
export class JobCard {
  JobType = JobType;
  JobSource = JobSource;
  locations: LocationName[];
  jobCardList: any[] = [];
  jobCardId: number = 0;
  isEditMode = false;
  //dropdown changes
  selectedLocation: string = '';
  selectedJobtype: any;
  selectedJobSource: string = '';
  selectedComplaints: string = '';
  selectedViewJobs: string = '';
  selectedChassis: string = '';
  searchTimeout: any;
  jobTypeId: number = 0;
  isSuperAdmin: boolean;
  filteredChassisList: any[] = [];

  //Pagination
  page = 1;
  pageSize = 10;
  collectionSize: number = 0;
  pagedData: any[] = [];
  filteredData: any[] = [];
  serviceTypeList: any;
  selectedServiceType: string;
  chassisList: any[] = [];

  // userRole: string = ''; when userrole api done then this var use

  currentUserRole = userRole[0].value;


  constructor(private locationService: LocationMasterService,
    private storageService: StorageService,
    private jobCardService: JobCardService,
    private router: Router
  ) { }

  searchModel: JobCardSearchModel = {
    dealerCode: '',
    fromDate: '',
    toDate: '',
    serviceLocation: '',
    jobNo: null,
    customerName: '',
    chassisNo: ''
  };
  ngOnInit(): void {

    this.isSuperAdmin = this.storageService.getRole().toLocaleLowerCase() === 'superadmin';
    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }
    const today = new Date();

    // Current month first date
    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.searchModel.fromDate = this.formatDate(firstDayOfMonth);
    this.searchModel.toDate = this.formatDate(today);
    this.loadJobCardList();
    this.setUserRole();
    this.fetchLocations();
    this.loadChassisList();

  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  //Fetech Dealer Location
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
        // console.log("location data",data)
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }


  // load Chassis number
  loadChassisList() {
    const dealerCode = this.storageService.getDealerCode();
    this.jobTypeId = this.selectedJobtype;
    this.jobCardService.getInspectedChassisListDropDown(dealerCode).subscribe({
      next: (res: any) => {
        console.log("list", res);

        // a duplicate chassis no remove (optional)
          this.chassisList = res.chassisNo || [];
      },
      error: (err) => {
        console.error('Error fetching chassis', err);
      }
    });
  }

  filterChassis() {
  const searchText = (this.searchModel.chassisNo || '').toLowerCase();

  this.filteredChassisList = this.chassisList
    .filter((x: string) =>
      x.toLowerCase().includes(searchText)
    )
    .slice(0, 10);
}
  hideDropdown() {
    setTimeout(() => {
      this.filteredChassisList = [];
    }, 200);
  }

  selectChassis(item: string) {
  console.log('Selected:', item);

  this.searchModel.chassisNo = item;
  this.filteredChassisList = [];
  this.search();
}

  loadJobCardList() {
   // debugger;
    //console.log("dealercode testing",this.searchModel.dealerCode);
    this.searchModel.dealerCode = this.storageService.getDealerCode();
    this.jobCardService.getJobCardList(this.searchModel)
      .subscribe({
        next: (res) => {
          this.jobCardList = res;
          console.log("listing", this.jobCardList)
        },
        error: (err) => {
          console.error('Error fetching job cards', err);
        }
      });
  }

  onEdit(row: any) {
    this.router.navigate(['/job-card-addForm/job-card-add-form'], {
      state: { data: row }
    });
  }


  deleteJobCard(id: number) {
    const dealerCode = this.storageService.getDealerCode();
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this Job Card!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      width: '350px'
    }).then((result) => {

      if (result.isConfirmed) {

        this.jobCardService.deleteJobCard(id).subscribe({
          next: (res: any) => {

            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Job Card deleted successfully',
              width: '350px'
            });

            //  Refresh list
            this.loadJobCardList();

          },
          error: (err) => {
            console.error(err);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error || 'Delete failed',
              width: '300px'
            });
          }
        });

      }
    });
  }
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.search();
    }, 500); // 500ms delay
  }
  setUserRole() {
    const dealerCode = this.storageService.getDealerCode();

    const superAdminCodes = ['ADMIN001']; // 👈 multiple bhi rakh sakte ho

    const role = superAdminCodes.includes(dealerCode)
      ? 'SuperAdmin'
      : 'Dealer';

    this.storageService.setRole(role);
    this.currentUserRole = role;
  }

  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;

    console.log('Selected Location:', this.selectedLocation);
  }
  onJobType(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedJobtype = target.value;

    console.log('Selected Location:', this.selectedJobtype);
  }
  onJobSource(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedJobSource = target.value;

    console.log('Selected Location:', this.selectedJobSource);
  }
  onComplaints(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedComplaints = target.value;

    console.log('Selected Location:', this.selectedComplaints);
  }
  onViewJobs(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedViewJobs = target.value;

    console.log('Selected Location:', this.selectedViewJobs);
  }
  onChassisChange() {
    this.selectedChassis = '';
  }
  search() {
debugger
    const payload = {
      dealerCode: this.storageService.getDealerCode(),
      fromDate: this.searchModel.fromDate || null,
      toDate: this.searchModel.toDate || null,
      serviceLocation: this.searchModel.serviceLocation || null,
      jobNo: this.searchModel.jobNo ? Number(this.searchModel.jobNo) : null,
      customerName: this.searchModel.customerName || null,
      chassisNo: this.searchModel.chassisNo || null
    };
    this.jobCardService.getJobCardList(payload).subscribe(res => {
      this.jobCardList = res;
    });
  }

  //  PAGINATION
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }

  refreshTable() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);
  }

  downloadExcel(): void {
  if (!this.jobCardList || this.jobCardList.length === 0) {
    return;
  }

  const headers = [
    'Sr No', 'Job No', 'Job Date', 'Job Status', 'Manual Job No',
    'Location', 'Job Type', 'Job Source', 'Complaint', 'Supervisor',
    'Register No', 'Chassis No', 'Vehicle Name', 'Service Head',
    'Service Type', 'Customer Name', 'Customer Mobile'
  ];

  const rows = this.jobCardList.map((item, i) => [
    i + 1,
    item.jobCardHeader?.jobNo ?? '',
    item.jobCardHeader?.jobinDate
      ? new Date(item.jobCardHeader.jobinDate).toLocaleDateString('en-GB')
      : '',
    item.jobStatus ?? '',
    item.jobCardHeader?.manualjobNo ?? '',
    item.location ?? '',
    item.jobtype ?? '',
    item.jobsource ?? '',
    item.complaint ?? '',
    item.jobCardHeader?.supervisor ?? '',
    item.jobCardCustomer?.registerNo ?? '',
    item.jobCardCustomer?.chassisNo ?? '',
    item.jobCardCustomer?.modelName ?? '',
    item.serviceHead ?? '',
    item.serviceType ?? '',
    item.jobCardCustomer?.customerName ?? '',
    item.jobCardCustomer?.customerMobile ?? ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'JobCards');
  XLSX.writeFile(wb, `JobCardList_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

printJobCard(item: any): void {
  const html = this.buildInvoiceHtml(item);
  const win = window.open('', '_blank', 'width=900,height=650');
  if (!win) {
    Swal.fire('Popup blocked', 'Please allow popups to print the invoice.', 'warning');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
    // win.close(); // uncomment to auto-close after printing
  };
}

private fmtDate(d: any): string {
  if (!d) return '-';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-GB');
}

private buildInvoiceHtml(item: any): string {

  /* ── DB source objects ─────────────────────────────────── */
  const h  = item.jobCardHeader   ?? {};
  const c  = item.jobCardCustomer ?? {};
  const b  = item.jobCardBattery  ?? {};
  const complaints: any[] = item.jobCardComplaint ?? [];

  /* ── Customer (LedgerMaster party* → fallback jobCardCustomer) ── */
  const customerName   = item.partyName     ?? c.customerName   ?? '-';
  const customerMobile = item.partyMobileNo ?? c.customerMobile ?? '-';
  const altMobile      = c.customerAltMobile ?? '-';
  const address        = item.partyAddress  ?? '';
  const city           = item.partyCity     ?? '-';
  const pin            = item.partyPin      ?? '';
  const state          = item.partyState    ?? '-';
  const gstNo          = item.partyGstNo    ?? '-';
  const cityPin        = pin ? `${city} - ${pin}` : city;

  /* ── Vehicle ──────────────────────────────────────────── */
  const modelName    = c.modelName        ?? item.oemModelName ?? '-';
  const colour       = item.colour        ?? c.colourName      ?? '-';
  const oemModel     = item.oemModelName  ?? '-';
  const modelDisplay = (colour && colour !== '-') ? `${modelName} (${colour})` : modelName;
  const chassisNo    = c.chassisNo        ?? h.chassisno       ?? '-';
  const batteryNo    = c.batteryNo        ?? b.batterySerialNo ?? '-';
  const chargerNo    = b.chargerNo        ?? '-';
  const controllerNo = b.controllerNo     ?? '-';
  const registerNo   = c.registerNo       ?? '-';

  /* ── Helpers ──────────────────────────────────────────── */
  const fd   = (d: any)  => this.fmtDate(d);
  const dash = (v: any)  => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v) : '-';

  /* ── Complaint rows (job card only) ──────────────────────────────────── */
  const complaintRows = complaints.length
    ? complaints.map((x: any, i: number) => `
        <tr>
          <td class="tc">${i + 1}</td>
          <td>${x.customerVoice ?? '-'}</td>
          <td>${x.complaintCode ?? '-'}</td>
          <td>${x.complaint     ?? '-'}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="tc muted">No complaints recorded</td></tr>`;

  /* ════════════════════════════════════════════════════════
     HTML
  ════════════════════════════════════════════════════════ */
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Job Card – ${h.invoiceNo ?? ''}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

body{
  font-family:Arial,Helvetica,sans-serif;
  font-size:11px;
  color:#111;
  background:#fff;
  padding:10mm 12mm;
}

/* ── Doc header ───────────────────────────────────── */
.doc-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  border-bottom:2.5px solid #1a4f8b;
  padding-bottom:7px;
  margin-bottom:8px;
}
.co-name{font-size:15px;font-weight:bold;color:#1a4f8b;letter-spacing:.2px}
.co-sub{font-size:9px;color:#555;margin-top:3px}
.doc-right{text-align:right}
.doc-title{font-size:15px;font-weight:bold;color:#1a4f8b;letter-spacing:.5px;margin-bottom:5px}
.doc-right table{margin-left:auto;border-collapse:collapse;font-size:9.5px;color:#333}
.doc-right td{padding:1.5px 3px}
.doc-right td.lbl{color:#666;text-align:right;padding-right:5px}
.doc-right td.val{font-weight:bold}

/* ── Section ──────────────────────────────────────── */
.sec{border:1px solid #c8c8c8;border-radius:2px;margin-bottom:6px;page-break-inside:avoid}
.sec-title{
  background:#1a4f8b;
  color:#fff;
  font-size:8.5px;
  font-weight:bold;
  letter-spacing:.9px;
  text-transform:uppercase;
  padding:4px 8px;
}

/* ── Side-by-side row ─────────────────────────────── */
.row2{display:flex;gap:6px;margin-bottom:6px}
.row2>.sec{flex:1;margin-bottom:0}

/* ── KV table ─────────────────────────────────────── */
.kv{width:100%;border-collapse:collapse}
.kv tr{border-bottom:1px solid #eaeaea}
.kv tr:last-child{border-bottom:none}
.kv td{padding:3.5px 8px;vertical-align:top;line-height:1.45}
.kv td.k{width:46%;font-size:9px;color:#555;white-space:nowrap}
.kv td.v{font-size:10px;font-weight:bold;word-break:break-word}

/* ── Two-column split inside one section ─────────── */
.split{display:flex}
.split .col{flex:1;border-right:1px solid #e0e0e0}
.split .col:last-child{border-right:none}

/* ── Complaints table ─────────────────────────────── */
.cpl{width:100%;border-collapse:collapse;font-size:10px}
.cpl thead tr{background:#eef2f9}
.cpl th{
  padding:5px 8px;text-align:left;
  font-size:8.5px;font-weight:bold;color:#1a4f8b;
  border-bottom:1px solid #c8c8c8;white-space:nowrap
}
.cpl td{padding:4.5px 8px;border-bottom:1px solid #eaeaea;vertical-align:top;line-height:1.4}
.cpl tbody tr:last-child td{border-bottom:none}

/* ── Observation strip ────────────────────────────── */
.obs-strip{
  border:1px solid #c8c8c8;border-radius:2px;
  padding:6px 10px;margin-bottom:6px;
  font-size:10px;line-height:1.65;
  display:flex;gap:20px;flex-wrap:wrap;
}
.obs-item{flex:1;min-width:160px}
.obs-lbl{
  display:block;font-size:8px;font-weight:bold;
  color:#1a4f8b;text-transform:uppercase;
  letter-spacing:.5px;margin-bottom:2px;
}
.obs-val{font-size:10px}

/* ── Signatures ───────────────────────────────────── */
.sigs{display:flex;justify-content:space-around;margin-top:28px}
.sig{
  width:28%;text-align:center;font-size:9px;
  color:#333;border-top:1px solid #333;padding-top:6px;
}

/* ── Utility ──────────────────────────────────────── */
.tc   {text-align:center}
.muted{color:#999;font-style:italic}

/* ── Gate pass — matches download.pdf exactly ─────── */
/* Dotted separator → centered "Gate Pass" heading → compact 2-col field rows */
.gp-separator{
  border:none;
  border-top:1.5px dotted #555;
  margin:20px 0 0;
}
.gp-heading{
  text-align:center;
  font-size:11px;
  font-weight:bold;
  letter-spacing:.4px;
  padding:5px 0 8px;
  border-bottom:1px solid #ccc;
  margin-bottom:10px;
}
/* 4-column table: lbl | val | lbl | val */
.gp-tbl{
  width:100%;
  border-collapse:collapse;
  font-size:10px;
}
.gp-tbl td{
  padding:5px 8px;
  border:1px solid #ddd;
  vertical-align:middle;
  line-height:1.4;
}
.gp-tbl td.gl{
  color:#333;
  font-size:9.5px;
  white-space:nowrap;
  width:16%;
}
.gp-tbl td.gv{
  font-size:9.5px;
  font-weight:bold;
  word-break:break-word;
}

/* ── Print ────────────────────────────────────────── */
.page-break{page-break-before:always}
@media print{
  body{padding:0}
  @page{size:A4;margin:10mm 12mm}
  .sec{page-break-inside:avoid}
  .gp-separator,.gp-heading,.gp-tbl{page-break-inside:avoid}
}
</style>
</head>
<body>

<!-- ══════════════════════════════════════
     PAGE 1 — JOB CARD
══════════════════════════════════════ -->

<!-- Document header -->
<div class="doc-head">
  <div>
    <div class="co-name">YOUR COMPANY NAME</div>
    <div class="co-sub">Dealer Code: ${dash(h.dealerCode)} &nbsp;|&nbsp; ${dash(item.location)}</div>
  </div>
  <div class="doc-right">
    <div class="doc-title">JOB CARD</div>
    <table>
      <tr>
        <td class="lbl">Invoice No:</td>
        <td class="val">${dash(h.invoiceNo)}</td>
      </tr>
      <tr>
        <td class="lbl">Job No:&nbsp;&nbsp;${dash(h.jobNo)}&nbsp;&nbsp;Date:</td>
        <td class="val">${fd(h.jobinDate)}</td>
      </tr>
    </table>
  </div>
</div>

<!-- Row 1: Job Details + Customer Details -->
<div class="row2">

  <div class="sec">
    <div class="sec-title">Job Details</div>
    <div class="split">
      <div class="col">
        <table class="kv">
          <tr><td class="k">Job Type</td>     <td class="v">${dash(item.jobtype)}</td></tr>
          <tr><td class="k">Job Source</td>   <td class="v">${dash(item.jobsource)}</td></tr>
          <tr><td class="k">Service Head</td> <td class="v">${dash(item.serviceHead)}</td></tr>
          <tr><td class="k">Service Type</td> <td class="v">${dash(item.serviceType)}</td></tr>
          <tr><td class="k">Est. Delivery</td><td class="v">${fd(h.estdelDate)}</td></tr>
        </table>
      </div>
      <div class="col">
        <table class="kv">
          <tr><td class="k">Vehicle Kms</td>   <td class="v">${dash(h.vehiclekms)}</td></tr>
          <tr><td class="k">Manual Job No</td> <td class="v">${dash(h.manualjobNo)}</td></tr>
          <tr><td class="k">Supervisor</td>    <td class="v">${dash(h.supervisor)}</td></tr>
          <tr><td class="k">Technician</td>    <td class="v">${dash(h.technician)}</td></tr>
          <tr><td class="k">Delivery Time</td> <td class="v">${dash(h.estdelTime)}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Customer Details</div>
    <table class="kv">
      <tr><td class="k">Customer Name</td><td class="v">${customerName}</td></tr>
      <tr><td class="k">Address</td>       <td class="v">${address || '&nbsp;'}</td></tr>
      <tr><td class="k">City &amp; Pin</td><td class="v">${cityPin}</td></tr>
      <tr><td class="k">State</td>         <td class="v">${state}</td></tr>
      <tr><td class="k">GST No.</td>       <td class="v">${gstNo}</td></tr>
      <tr><td class="k">Mobile</td>        <td class="v">${customerMobile}</td></tr>
      <tr><td class="k">Alt. Mobile</td>   <td class="v">${altMobile}</td></tr>
    </table>
  </div>

</div>

<!-- Vehicle Details -->
<div class="sec">
  <div class="sec-title">Vehicle Details</div>
  <div class="split">
    <div class="col">
      <table class="kv">
        <tr><td class="k">Chassis No</td>    <td class="v">${chassisNo}</td></tr>
        <tr><td class="k">Battery No</td>    <td class="v">${batteryNo}</td></tr>
        <tr><td class="k">Charger No</td>    <td class="v">${chargerNo}</td></tr>
        <tr><td class="k">Controller No</td> <td class="v">${controllerNo}</td></tr>
        <tr><td class="k">Register No</td>   <td class="v">${registerNo}</td></tr>
      </table>
    </div>
    <div class="col">
      <table class="kv">
        <tr><td class="k">Model</td>          <td class="v">${modelDisplay}</td></tr>
        <tr><td class="k">OEM Model</td>      <td class="v">${oemModel}</td></tr>
        <tr><td class="k">Colour</td>         <td class="v">${colour}</td></tr>
        <tr><td class="k">Sale Date</td>      <td class="v">${fd(c.saleDate)}</td></tr>
        <tr><td class="k">Insurance Exp.</td> <td class="v">${fd(c.insuranceExpDate)}</td></tr>
      </table>
    </div>
  </div>
</div>

<!-- Battery Details -->
<div class="sec">
  <div class="sec-title">Battery Details</div>
  <div class="split">
    <div class="col">
      <table class="kv">
        <tr><td class="k">Battery Make</td>                <td class="v">${dash(b.batteryMake)}</td></tr>
        <tr><td class="k">Battery Serial No(s)</td>        <td class="v">${dash(b.batterySerialNo)}</td></tr>
        <tr><td class="k">Voltage at Full Charge (OCV)</td><td class="v">${dash(b.batteryOcv)}</td></tr>
        <tr><td class="k">Voltage at Full Charge (CCV)</td><td class="v">${dash(b.batteryCcv)}</td></tr>
        <tr><td class="k">Voltage at Discharge</td>        <td class="v">${dash(b.batteryDischarge)}</td></tr>
      </table>
    </div>
    <div class="col">
      <table class="kv">
        <tr><td class="k">Capacity (AH)</td>              <td class="v">${dash(b.batteryCapacityAh)}</td></tr>
        <tr><td class="k">Battery Set Voltage</td>        <td class="v">${dash(b.batteryVoltage)}</td></tr>
        <tr><td class="k">Motor Drawing (No Load)</td>    <td class="v">${dash(b.motorDrawing)}</td></tr>
        <tr><td class="k">Controller No. Make</td>        <td class="v">${controllerNo}</td></tr>
        <tr><td class="k">Battery Chemical</td>           <td class="v">${dash(b.batteryChemical)}</td></tr>
        <tr><td class="k">Battery Capacity</td>           <td class="v">${dash(b.batteryCapacity)}</td></tr>
      </table>
    </div>
  </div>
</div>

<!-- Customer Voice & Complaints -->
<div class="sec">
  <div class="sec-title">Customer Voice &amp; Complaints</div>
  <table class="cpl">
    <thead>
      <tr>
        <th style="width:36px">Sr</th>
        <th style="width:24%">Customer Voice</th>
        <th style="width:24%">Code</th>
        <th>Complaint</th>
      </tr>
    </thead>
    <tbody>${complaintRows}</tbody>
  </table>
</div>

<!-- Observation & Supervisor Comment -->
<div class="obs-strip">
  <div class="obs-item">
    <span class="obs-lbl">Observation</span>
    <span class="obs-val">${dash(h.observation)}</span>
  </div>
  <div class="obs-item">
    <span class="obs-lbl">Supervisor Comment</span>
    <span class="obs-val">${dash(h.supervisorComment)}</span>
  </div>
</div>

<!-- Signatures -->
<div class="sigs">
  <div class="sig">Technician</div>
  <div class="sig">Supervisor / Advisor</div>
  <div class="sig">Customer</div>
</div>


<!-- ══════════════════════════════════════
     GATE PASS — matches download.pdf
     Dotted line separator → "Gate Pass" centered heading
     → compact 2-row, 4-column label:value table
══════════════════════════════════════ -->

<!-- Dotted separator line (same as PDF) -->
<hr class="gp-separator">

<!-- Centered "Gate Pass" title -->
<div class="gp-heading">Gate Pass</div>

<!-- 5 fields in two rows, exactly as in the PDF:
     Row 1: Customer Name | [value]  ||  Job Date  | [value]  ||  Job No | [value]
     Row 2: Vehicle No.   | [value]  ||  Chassis No| [value]  ||  (empty span)
-->
<table class="gp-tbl">
  <tr>
    <td class="gl">Customer Name</td>
    <td class="gv">${customerName}</td>
    <td class="gl">Job Date</td>
    <td class="gv">${fd(h.jobinDate)}</td>
    <td class="gl">Job No</td>
    <td class="gv">${dash(h.jobNo)}</td>
  </tr>
  <tr>
    <td class="gl">Vehicle No.</td>
    <td class="gv">${registerNo !== '-' ? registerNo : ''}</td>
    <td class="gl">Chassis No.</td>
    <td class="gv">${chassisNo}</td>
    <td class="gl"></td>
    <td class="gv"></td>
  </tr>
</table>

</body>
</html>`;
}
  //Navigate Job Card Add form
  onNavigate() {
    this.router.navigate(['/job-card-addForm', 'test']);
  }
}
