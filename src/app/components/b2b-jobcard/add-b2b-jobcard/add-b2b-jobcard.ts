//src\app\components\b2b-jobcard\add-b2b-jobcard\add-b2b-jobcard.ts
// B2B Job Card add / view / edit (/b2bjobcards/add, /b2bjobcards/:id - MenuMaster 160).
// 25.11.2026: same layout as the B2C form (/job-card-addForm): Job Basic Information (job details left, customer details
// right) -> Battery Details -> Customer Voice -> Photos (required) -> Service Card History; Save / Cancel at the bottom.
// Fields, cascades and rules follow the JobCardScanner Job Card Wizard (web JobCardWizardPage.tsx / mobile JobCardWizardScreen.tsx):
//   Job Type -> Service Head -> Priority : JobCardScanner dbo.ServiceMenuMasters (value posted = PriorityLabel)
//   Service Location (workshop)         : JobCardScanner dbo.WorkshopLocations of the dealer (DMS workshops while none are synced)
//   Complaint                            : JobCardScanner dbo.ComplaintMasters (16 buttons + search) + free text
//   Job Source                           : DMS JobSource master (the wizard reads it from DMS too)
//   Chassis / Reg No search              : from 2 characters, the dealer first, then every dealer (JobCardScanner vehicles,
//                                          DMS sales, imported service history) - like GET /api/jobcards/vehicle-suggestions
//   Photos                               : required, Azure Blob -> JobCardScanner dbo.JobCardPhotos (Stage CheckIn)
// Edit = what JobCardScanner's own Update allows: Priority, Expected delivery, Technician (+ more photos).
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { JobcardServiceHistoryLookupService } from '../../../core/services/jobcard-service-history-lookup.service';
import { StorageService } from '../../../core/services/storage';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';
import { JobCardService } from '../../../core/services/job-card-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { ChassisSearchService } from '../../../core/services/chassis-search-service';
import { JobcardPhotoService, PendingPhoto } from '../../../core/services/jobcard-photo.service';
import { B2BJobcardService } from '../services/b2b-jobcard.service';
import {
  B2BComplaint, B2BDealer, B2BHistoryRow, B2BJobCardCreateRequest, B2BJobCardDetail, B2BPhoto, B2BServiceMenuRow,
  B2BStaff, B2BVehicleCard, B2BVehicleSuggestion, B2BWorkshop
} from '../models/b2b-jobcard.model';

interface Opt<T> { value: T; label: string; }

@Component({
  selector: 'app-add-b2b-jobcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbDropdownModule],
  templateUrl: './add-b2b-jobcard.html',
  styleUrl: './add-b2b-jobcard.scss',
})
export class AddB2BJobcard implements OnInit, OnDestroy {
  readonly SUBMENU_ID = 160;
  readonly COMPLAINT_BUTTON_LIMIT = 16;

  mode: 'add' | 'view' = 'add';
  jobCardId = '';
  isAdmin = false;
  canCreate = false;
  canEdit = false;
  isOpen: Record<string, boolean> = { job: true, battery: false, voice: true, photos: true, history: false };

  // ---------- dealer + masters
  dealers: B2BDealer[] = [];
  dealerCode: string | null = null;
  dealerName = '';
  dealerMessage = '';
  serviceMenu: B2BServiceMenuRow[] = [];
  complaintMaster: B2BComplaint[] = [];
  workshops: B2BWorkshop[] = [];
  workshopSource: 'JobCardScanner' | 'DMS' | '' = '';
  jobSources: { jobSourceId: number; jobSourceName: string }[] = [];
  /** Supervisor/Advisor + Technician of the selected workshop (JobCardScanner Users / Technicians) */
  supervisors: string[] = [];
  technicians: string[] = [];
  /** the selected workshop's people first, then the dealer's other workshops */
  supervisorsHere: B2BStaff[] = [];
  supervisorsOther: B2BStaff[] = [];
  techniciansHere: B2BStaff[] = [];
  techniciansOther: B2BStaff[] = [];
  staffLoading = false;
  staffError = '';
  private staffKey = '';
  mastersLoading = false;
  mastersError = '';

  // ---------- chassis / reg no search
  searchTerm = '';
  suggestions: B2BVehicleSuggestion[] = [];
  suggestScope: 'dealer' | 'all' = 'dealer';
  suggestLoading = false;
  suggestDone = false;
  vehicleLoading = false;
  vehicleMessage = '';
  vehicleSource: '' | 'JobCardScanner' | 'DMS sale' | 'New' = '';
  /** this dealer's JobCardScanner vehicle -> reused on save, its details read-only */
  vehicleLocked = false;
  card: B2BVehicleCard | null = null;
  previousOdometer: number | null = null;
  openJobCardNumber = '';
  history: B2BHistoryRow[] = [];
  private suggestTimer: any;
  private suggestSeq = 0;
  /** chassis the merged Service Card History belongs to (ignore late answers for an older chassis) */
  private historyChassis = '';

  // ---------- "Search Chassis Across All Dealers" popup (same as the B2C form)
  globalTerm = '';
  globalSearching = false;
  globalNotFound = false;
  globalResult: { source: string; chassisNo: string; regNo?: string | null; customerName?: string | null; mobile?: string | null;
    model?: string | null; dealerCode?: string | null; saleDate?: string | null } | null = null;
  globalSuggestions: B2BVehicleSuggestion[] = [];
  private globalTimer: any;
  private globalModalRef: any = null;

  // ---------- form
  f: B2BJobCardCreateRequest = this.emptyForm();
  jobInDate = '';
  jobInTime = '';
  estDelDate = '';
  estDelTime = '';
  selectedComplaints: string[] = [];
  complaintSearch = '';
  manualComplaint = '';
  pendingPhotos: PendingPhoto[] = [];
  savedPhotos: B2BPhoto[] = [];
  photoError = '';
  submitted = false;
  saving = false;
  formError = '';

  // ---------- view / edit
  detail: B2BJobCardDetail | null = null;
  edit = { priority: '', assignedTechnicianName: '' };

  constructor(
    private api: B2BJobcardService,
    private photoService: JobcardPhotoService,
    private storage: StorageService,
    private menuAccess: MenuAccessService,
    private toaster: ToastService,
    private loader: LoaderService,
    private jobCardService: JobCardService,
    private locationService: LocationMasterService,
    private chassisSearch: ChassisSearchService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private shLookup: JobcardServiceHistoryLookupService
  ) {}

  ngOnInit(): void {
    const role = (this.storage.getRole() || '').toLowerCase();
    this.isAdmin = role === 'superadmin' || role === 'admin';
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.loadJobSources();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'add') {
      this.mode = 'view';
      this.jobCardId = id;
      this.loadDetail();
      return;
    }

    this.mode = 'add';
    if (!this.canCreate) {
      this.toaster.show('You do not have create rights for B2B Job Card.', { classname: 'bg-warning text-dark', delay: 5000 });
      this.router.navigate(['/b2bjobcards']);
      return;
    }
    const now = new Date();
    this.jobInDate = this.ymd(now);
    this.jobInTime = this.hm(now);
    this.estDelDate = this.ymd(now);
    this.estDelTime = this.hm(now);
    this.dealerCode = this.isAdmin ? (this.route.snapshot.queryParamMap.get('dealer') || null) : (this.storage.getDealerCode() || null);
    if (this.isAdmin) {
      this.api.getDealers().subscribe({
        next: (d) => (this.dealers = d || []),
        error: (e) => (this.dealerMessage = B2BJobcardService.errorText(e, 'Could not load JobCardScanner dealers.'))
      });
    }
    this.loadMasters();
  }

  ngOnDestroy(): void {
    clearTimeout(this.suggestTimer);
    clearTimeout(this.globalTimer);
    JobcardPhotoService.release(this.pendingPhotos);
  }

  private emptyForm(): B2BJobCardCreateRequest {
    return {
      chassisNo: '', jobTypeId: null, serviceHeadId: null, priority: '', serviceLocationCode: '',
      odometerAtCheckIn: null, expectedDeliveryAt: null, complaints: [], batteryLevelAtCheckIn: null, jobSourceId: null,
      supervisorName: null, technicianName: null
    };
  }

  private p2(n: number): string { return String(n).padStart(2, '0'); }
  private ymd(d: Date): string { return `${d.getFullYear()}-${this.p2(d.getMonth() + 1)}-${this.p2(d.getDate())}`; }
  private hm(d: Date): string { return `${this.p2(d.getHours())}:${this.p2(d.getMinutes())}`; }

  utc(iso?: string | null): string | null {
    if (!iso) return null;
    return /[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + 'Z';
  }

  get ro(): boolean { return this.mode === 'view'; }

  get customerStateEditable(): boolean {
    return (!this.ro && (!this.vehicleLocked || !this.f.customerState?.trim()))
      || (this.ro && this.editable && !this.f.customerState?.trim());
  }

  toggle(key: string): void {
    this.isOpen[key] = !this.isOpen[key];
  }

  // =========================================================== masters
  onDealerChange(): void {
    this.workshops = [];
    this.f.serviceLocationCode = '';
    this.f.supervisorName = null;
    this.f.technicianName = null;
    this.staffKey = '';
    this.supervisors = [];
    this.technicians = [];
    this.loadMasters();
    if (this.f.chassisNo) this.lookupVehicle(this.f.chassisNo);
  }

  loadMasters(): void {
    this.mastersLoading = true;
    this.mastersError = '';
    this.api.getMasters(this.dealerCode).subscribe({
      next: (m) => {
        this.mastersLoading = false;
        this.serviceMenu = [...(m.serviceMenu || [])].sort((a, b) => a.sortOrder - b.sortOrder);
        this.complaintMaster = m.complaints || [];
        this.dealerMessage = m.dealerMessage || '';
        this.dealerName = m.dealer ? `${m.dealer.name} (${m.dealer.dmsDealerCode || m.dealer.code})` : '';
        this.workshops = m.workshops || [];
        this.workshopSource = this.workshops.length ? 'JobCardScanner' : '';
        if (!this.workshops.length && m.dealer && !this.ro) this.loadDmsWorkshops();
        if (!this.ro) this.defaultWorkshop();
      },
      error: (e) => {
        this.mastersLoading = false;
        this.mastersError = B2BJobcardService.errorText(e, 'Could not load the JobCardScanner masters.');
      }
    });
  }

  /** the dealer has no JobCardScanner WorkshopLocations yet - its DMS workshops (LocationMaster area 2) */
  private loadDmsWorkshops(): void {
    if (!this.dealerCode) return;
    this.locationService.getLocationList(this.dealerCode).subscribe({
      next: (data: any[]) => {
        this.workshops = (data || []).filter(x => x.locareadidNo === 2).map(x => ({ locCode: x.locCode, locName: x.locname || x.locCode }));
        this.workshopSource = this.workshops.length ? 'DMS' : '';
        this.defaultWorkshop();
      },
      error: () => (this.workshops = [])
    });
  }

  /** wizard: pre-select the lowest "W" series workshop */
  private defaultWorkshop(): void {
    if (this.f.serviceLocationCode || !this.workshops.length) return;
    const n = (c: string) => Number(/W(\d+)$/i.exec(c)?.[1] ?? Number.MAX_SAFE_INTEGER);
    this.f.serviceLocationCode = [...this.workshops].sort((a, b) => n(a.locCode) - n(b.locCode))[0].locCode;
    this.loadStaff();
  }

  /** Service Location changed: the supervisor / technician lists belong to the workshop */
  onLocationChange(): void {
    this.f.supervisorName = null;
    this.f.technicianName = null;
    this.loadStaff();
  }

  loadStaff(): void {
    const loc = this.f.serviceLocationCode || '';
    const dealer = this.isAdmin ? this.dealerCode : null;
    if ((this.isAdmin && !this.dealerCode) || !this.dealerName) { this.supervisors = []; this.technicians = []; return; }
    const key = `${dealer || ''}|${loc}`;
    if (key === this.staffKey) return;
    this.staffKey = key;
    this.staffLoading = true;
    this.staffError = '';
    this.api.getStaff(dealer, loc).subscribe({
      next: (r) => {
        if (key !== this.staffKey) return;
        const sup = r?.supervisors || [];
        const tech = r?.technicians || [];
        this.supervisorsHere = sup.filter(x => x.atLocation);
        this.supervisorsOther = sup.filter(x => !x.atLocation);
        this.techniciansHere = tech.filter(x => x.atLocation);
        this.techniciansOther = tech.filter(x => !x.atLocation);
        this.supervisors = sup.map(x => x.name);
        this.technicians = tech.map(x => x.name);
        this.staffLoading = false;
      },
      error: (e) => {
        if (key !== this.staffKey) return;
        this.supervisors = []; this.technicians = [];
        this.supervisorsHere = []; this.supervisorsOther = []; this.techniciansHere = []; this.techniciansOther = [];
        this.staffLoading = false;
        this.staffKey = '';   // allow a retry
        this.staffError = B2BJobcardService.errorText(e, 'Could not load supervisors / technicians.');
      }
    });
  }

  /** list + the saved value when it is no longer in the list (old job cards) */
  withCurrent(list: string[], current: string | null | undefined): string[] {
    const c = (current || '').trim();
    return c && !list.some(x => x.toLowerCase() === c.toLowerCase()) ? [c, ...list] : list;
  }

  private loadJobSources(): void {
    this.jobCardService.getJobSource().subscribe({
      next: (res: any[]) => (this.jobSources = res || []),
      error: () => (this.jobSources = [])
    });
  }

  // ---------- cascade (derived from the Service Menu rows, same as the wizard)
  get jobTypes(): Opt<number>[] {
    const seen = new Set<number>();
    return this.serviceMenu.filter(r => !seen.has(r.jobTypeId) && seen.add(r.jobTypeId)).map(r => ({ value: r.jobTypeId, label: r.jobTypeName }));
  }

  get serviceHeads(): Opt<number>[] {
    const seen = new Set<number>();
    return this.serviceMenu.filter(r => r.jobTypeId === this.f.jobTypeId)
      .filter(r => !seen.has(r.serviceHeadId) && seen.add(r.serviceHeadId))
      .map(r => ({ value: r.serviceHeadId, label: r.serviceHeadName }));
  }

  prioritiesFor(jobTypeId: number | null | undefined, serviceHeadId: number | null | undefined): Opt<string>[] {
    const seen = new Set<string>();
    return this.serviceMenu.filter(r => r.jobTypeId === jobTypeId && r.serviceHeadId === serviceHeadId)
      .filter(r => !seen.has(r.priorityLabel.toLowerCase()) && seen.add(r.priorityLabel.toLowerCase()))
      .map(r => ({ value: r.priorityLabel, label: r.priorityValue }));
  }

  get priorities(): Opt<string>[] {
    const list = this.prioritiesFor(this.f.jobTypeId, this.f.serviceHeadId);
    if (this.ro && this.edit.priority && !list.some(p => p.value.toLowerCase() === this.edit.priority.toLowerCase()))
      list.unshift({ value: this.edit.priority, label: this.edit.priority });
    return list;
  }

  onJobTypeChange(): void {
    const heads = this.serviceHeads;
    this.f.serviceHeadId = heads.length === 1 ? heads[0].value : null;
    this.onServiceHeadChange();
  }

  onServiceHeadChange(): void {
    const p = this.prioritiesFor(this.f.jobTypeId, this.f.serviceHeadId);
    this.f.priority = p.length === 1 ? p[0].value : '';
  }

  // =========================================================== chassis / reg no search (starts while typing)
  onSearchInput(): void {
    clearTimeout(this.suggestTimer);
    const term = (this.searchTerm || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    this.suggestDone = false;
    if (term.length < 2) { this.suggestions = []; this.suggestLoading = false; return; }
    this.suggestLoading = true;
    const seq = ++this.suggestSeq;
    this.suggestTimer = setTimeout(() => {
      this.api.suggestVehicles(term, this.dealerCode).subscribe({
        next: (r) => {
          if (seq !== this.suggestSeq) return;
          this.suggestions = r?.items || [];
          this.suggestScope = r?.scope || 'dealer';
          this.suggestLoading = false;
          this.suggestDone = true;
        },
        error: () => {
          if (seq !== this.suggestSeq) return;
          this.suggestions = [];
          this.suggestLoading = false;
          this.suggestDone = true;
        }
      });
    }, 250);
  }

  hideSuggestions(): void {
    setTimeout(() => { this.suggestions = []; this.suggestDone = false; }, 200);
  }

  pickSuggestion(s: B2BVehicleSuggestion): void {
    this.suggestions = [];
    this.suggestDone = false;
    this.searchTerm = s.chassisNo || s.regNo || '';
    this.lookupVehicle(this.searchTerm);
  }

  onSearchEnter(): void {
    this.suggestions = [];
    this.suggestDone = false;
    if ((this.searchTerm || '').replace(/[^A-Za-z0-9]/g, '').length >= 2) this.lookupVehicle(this.searchTerm);
  }

  private clearVehicle(): void {
    const k = this.f;
    this.f = {
      ...this.emptyForm(),
      jobTypeId: k.jobTypeId, serviceHeadId: k.serviceHeadId, priority: k.priority, serviceLocationCode: k.serviceLocationCode,
      jobSourceId: k.jobSourceId, manualJobNo: k.manualJobNo, couponNo: k.couponNo, supervisorName: k.supervisorName,
      technicianName: k.technicianName, batteryLevelAtCheckIn: k.batteryLevelAtCheckIn, customerVoice: k.customerVoice
    };
    this.card = null;
    this.history = [];
    this.historyChassis = '';
    this.previousOdometer = null;
    this.openJobCardNumber = '';
    this.vehicleLocked = false;
    this.vehicleSource = '';
    this.vehicleMessage = '';
  }

  /** JobCardScanner first (vehicle + customer + history); not there -> DMS sale data pre-fills a new vehicle */
  async lookupVehicle(value: string): Promise<void> {
    const v = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length < 2) return;
    this.clearVehicle();
    this.vehicleLoading = true;
    try {
      const card = await firstValueFrom(this.api.getVehicle(v, this.dealerCode));
      this.card = card;
      if (card?.found && card.vehicle) {
        const veh = card.vehicle;
        const cust = card.customer || {};
        Object.assign(this.f, {
          chassisNo: veh.chassisNo || v, regNo: veh.regNo, model: veh.model, variant: veh.variant, color: veh.color,
          batteryNo: veh.batteryNo, motorNo: veh.motorNo, controllerNo: veh.controllerNo, converterNo: veh.converterNo,
          chargerNo: veh.chargerNo, purchaseDate: veh.purchaseDate || null,
          customerName: cust.name, customerMobile: cust.mobile, customerEmail: cust.email, customerAddress: cust.address,
          customerCity: cust.city, customerState: cust.state
        });
        this.history = (card.history || []).map(h => ({ ...h, source: 'B2B (JobCardScanner)' }));
        this.isOpen['history'] = this.history.length > 0;
        this.previousOdometer = card.previousOdometer ?? null;
        // Admin on "All Dealers": the vehicle's JobCardScanner dealer becomes the job card dealer
        if (this.isAdmin && !this.dealerCode && veh.dealerCode && this.dealers.some(d => (d.dmsDealerCode || '').toUpperCase() === veh.dealerCode!.toUpperCase())) {
          this.dealerCode = this.dealers.find(d => (d.dmsDealerCode || '').toUpperCase() === veh.dealerCode!.toUpperCase())!.dmsDealerCode!;
          this.staffKey = '';
          this.loadMasters();
        }
        this.openJobCardNumber = card.openJobCardNumber || '';
        const own = !!veh.dealerCode && !!this.dealerCode && veh.dealerCode.toUpperCase() === this.dealerCode.toUpperCase();
        this.vehicleLocked = own;
        this.vehicleSource = 'JobCardScanner';
        this.vehicleMessage = own ? 'Vehicle found in JobCardScanner for this dealer.'
          : `Vehicle found in JobCardScanner (dealer ${veh.dealerCode || '-'}); it is added to this dealer on save.`;
        this.searchTerm = this.f.chassisNo;
        this.loadOtherHistory(this.f.chassisNo);
        return;
      }
      const sale: any = await firstValueFrom(this.chassisSearch.getGlobalChassisDetails(v)).catch(() => null);
      this.f.chassisNo = v;
      if (sale) {
        Object.assign(this.f, {
          chassisNo: String(sale.chassisNumber || sale.chassisNo || v).toUpperCase(),
          regNo: sale.registerNo || null, model: sale.modelName || null, color: sale.colourName || null,
          batteryNo: sale.batteryNumber || null, motorNo: sale.motorNo || null, controllerNo: sale.controllerNo || null,
          converterNo: sale.converterNo || null, chargerNo: sale.chargerNumber || null,
          purchaseDate: sale.saleDate ? String(sale.saleDate).split('T')[0] : null,
          customerName: sale.customerName || null, customerMobile: sale.mobileNo || null
        });
        this.vehicleSource = 'DMS sale';
        this.vehicleMessage = 'Not in JobCardScanner yet - details from the DMS sale. Check them; the vehicle is created on save.';
      } else {
        this.vehicleSource = 'New';
        this.vehicleMessage = 'Vehicle not found. Enter the vehicle and customer details; they are created on save.';
      }
      this.searchTerm = this.f.chassisNo;
      this.loadOtherHistory(this.f.chassisNo);
    } catch (e) {
      this.vehicleMessage = B2BJobcardService.errorText(e, 'Could not look the vehicle up.');
    } finally {
      this.vehicleLoading = false;
    }
  }

  /**
   * Service Card History for every dealer login (not only admin): the B2B JobCardScanner job cards (already in
   * this.history) + DMS job cards of the chassis + imported service history (all dealers), newest first.
   * Previous Kms = the highest reading of all of them.
   */
  private loadOtherHistory(chassisNo: string): void {
    const chassis = (chassisNo || '').trim().toUpperCase();
    if (chassis.length < 5) return;
    this.historyChassis = chassis;
    const today = new Date();
    const dms$ = this.jobCardService.getJobCardList({
      dealerCode: this.isAdmin ? null : this.storage.getDealerCode(), fromDate: '2000-01-01', toDate: this.ymd(today), chassisNo: chassis
    }).pipe(catchError(() => of([])));
    const imported$ = this.shLookup.vehicle(chassis, 'all').pipe(catchError(() => of(null)));
    forkJoin([dms$, imported$]).subscribe(([dms, imported]: [any, any]) => {
      if (this.historyChassis !== chassis) return;
      const extra: B2BHistoryRow[] = [];
      const dmsList: any[] = Array.isArray(dms) ? dms : (dms?.data || []);
      for (const it of dmsList) {
        const h = it?.jobCardHeader || {};
        if (String(it?.jobCardCustomer?.chassisNo || h.chassisno || '').trim().toUpperCase() !== chassis) continue;
        extra.push({
          id: 'dms-' + (h.id ?? h.jobNo), jobCardNumber: String(h.jobNo ?? ''), createdAt: h.jobinDate || h.createdDate || '',
          regNo: it?.jobCardCustomer?.registerNo || '', odometerAtCheckIn: Number(h.vehiclekms) || 0, jobType: it?.jobtype || '',
          serviceHead: [it?.serviceHead, it?.serviceType].filter(Boolean).join(' / '), serviceLocation: it?.location || '',
          status: h.jobStatus || '', dealerCode: h.dealerCode || '', complaints: it?.complaint || '', source: 'DMS job card'
        });
      }
      for (const v of (imported?.vehicles || [])) {
        if (String(v?.chassisNo || '').trim().toUpperCase() !== chassis) continue;
        for (const j of (v.jobs || [])) {
          const kms = Number(j['KMS']);
          extra.push({
            id: 'sh-' + (j['Id'] ?? j['JobNo'] ?? extra.length), jobCardNumber: String(j['JobNo'] ?? ''), createdAt: j['JobDate'] || '',
            regNo: j['RegNo'] || v.regNo || '', odometerAtCheckIn: isNaN(kms) ? 0 : kms, jobType: j['JobType'] || '',
            serviceHead: j['ServiceHead'] || '', serviceLocation: j['Location'] || '', status: j['JobStatus'] || j['Status'] || '',
            dealerName: j['CompName'] || '', dealerCode: j['DealerCode'] || '', complaints: '', source: 'Service history'
          });
        }
      }
      const time = (r: B2BHistoryRow) => { const t = new Date(this.utc(r.createdAt) || 0).getTime(); return isNaN(t) ? 0 : t; };
      const own = this.history.filter(h => h.source === 'B2B (JobCardScanner)' || !h.source);
      this.history = [...own, ...extra].sort((a, b) => time(b) - time(a));
      if (this.history.length) this.isOpen['history'] = true;
      const maxKms = Math.max(0, ...this.history.map(h => Number(h.odometerAtCheckIn) || 0));
      if (maxKms > (this.previousOdometer || 0)) this.previousOdometer = maxKms;
    });
  }

  // =========================================================== "Search Chassis Across All Dealers" popup
  openGlobalSearch(tpl: any): void {
    this.globalTerm = (this.searchTerm || '').toUpperCase();
    this.globalResult = null;
    this.globalNotFound = false;
    this.globalSuggestions = [];
    this.globalModalRef = this.modalService.open(tpl, { size: 'lg', centered: true, backdrop: 'static' });
    if (this.globalTerm.replace(/[^A-Z0-9]/g, '').length >= 5) this.runGlobalSearch();
  }

  closeGlobalSearch(): void {
    clearTimeout(this.globalTimer);
    this.globalModalRef?.dismiss();
    this.globalModalRef = null;
  }

  onGlobalInput(): void {
    clearTimeout(this.globalTimer);
    this.globalResult = null;
    this.globalNotFound = false;
    const t = (this.globalTerm || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (t.length < 2) { this.globalSuggestions = []; return; }
    this.globalTimer = setTimeout(() => {
      // admin "All Dealers" -> every dealer; a dealer login -> its own first, then every dealer
      this.api.suggestVehicles(t, this.dealerCode).subscribe({
        next: (r) => (this.globalSuggestions = r?.items || []),
        error: () => (this.globalSuggestions = [])
      });
    }, 250);
  }

  pickGlobalSuggestion(s: B2BVehicleSuggestion): void {
    this.globalTerm = s.chassisNo || s.regNo || '';
    this.globalSuggestions = [];
    this.runGlobalSearch();
  }

  /** exact Chassis No / Reg No in any dealer: JobCardScanner vehicle -> DMS sale -> imported service history */
  async runGlobalSearch(): Promise<void> {
    const v = (this.globalTerm || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length < 3) return;
    this.globalSuggestions = [];
    this.globalSearching = true;
    this.globalResult = null;
    this.globalNotFound = false;
    try {
      const card = await firstValueFrom(this.api.getVehicle(v, null)).catch(() => null);
      if (card?.found && card.vehicle) {
        this.globalResult = {
          source: 'JobCardScanner', chassisNo: card.vehicle.chassisNo || v, regNo: card.vehicle.regNo, customerName: card.customer?.name,
          mobile: card.customer?.mobile, model: card.vehicle.model, dealerCode: card.vehicle.dealerCode, saleDate: card.vehicle.purchaseDate
        };
        return;
      }
      const sale: any = await firstValueFrom(this.chassisSearch.getGlobalChassisDetails(v)).catch(() => null);
      if (sale) {
        this.globalResult = {
          source: 'DMS sale', chassisNo: String(sale.chassisNumber || sale.chassisNo || v).toUpperCase(), regNo: sale.registerNo,
          customerName: sale.customerName, mobile: sale.mobileNo, model: sale.modelName, dealerCode: sale.dealerCode, saleDate: sale.saleDate
        };
        return;
      }
      const hist: any = await firstValueFrom(this.shLookup.vehicle(v, 'all')).catch(() => null);
      const hv = (hist?.vehicles || []).find((x: any) => !!x.chassisNo);
      if (hv) {
        this.globalResult = {
          source: 'Service history', chassisNo: hv.chassisNo, regNo: hv.regNo, customerName: hv.jobs?.[0]?.['PartyName'],
          mobile: hv.jobs?.[0]?.['MobileNumber'], model: hv.model, dealerCode: hv.jobs?.[0]?.['DealerCode'], saleDate: hv.saleDate
        };
        return;
      }
      this.globalNotFound = true;
    } finally {
      this.globalSearching = false;
    }
  }

  useGlobalChassis(): void {
    if (!this.globalResult) return;
    const chassis = this.globalResult.chassisNo;
    this.closeGlobalSearch();
    this.searchTerm = chassis;
    this.lookupVehicle(chassis);
  }

  // =========================================================== complaints
  get buttonComplaints(): B2BComplaint[] { return this.complaintMaster.slice(0, this.COMPLAINT_BUTTON_LIMIT); }

  get overflowMatches(): B2BComplaint[] {
    const q = (this.complaintSearch || '').trim().toLowerCase();
    return this.complaintMaster.slice(this.COMPLAINT_BUTTON_LIMIT).filter(c => !q || c.complaintText.toLowerCase().includes(q)).slice(0, 50);
  }

  isPicked(text: string): boolean { return this.selectedComplaints.some(c => c.toLowerCase() === text.toLowerCase()); }

  toggleComplaint(text: string): void {
    if (this.ro) return;
    if (this.isPicked(text)) this.removeComplaint(text);
    else this.selectedComplaints = [...this.selectedComplaints, text];
  }

  addOverflow(text: string): void {
    if (!this.isPicked(text)) this.selectedComplaints = [...this.selectedComplaints, text];
    this.complaintSearch = '';
  }

  addManualComplaint(): void {
    const t = (this.manualComplaint || '').trim();
    if (!t) return;
    if (!this.isPicked(t)) this.selectedComplaints = [...this.selectedComplaints, t.slice(0, 500)];
    this.manualComplaint = '';
  }

  removeComplaint(text: string): void {
    if (this.ro) return;
    this.selectedComplaints = this.selectedComplaints.filter(c => c.toLowerCase() !== text.toLowerCase());
  }

  // =========================================================== photos
  onPhotosPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.photoError = JobcardPhotoService.addFiles(this.pendingPhotos, input.files, this.savedPhotos.length);
    input.value = '';
  }

  removePendingPhoto(i: number): void {
    const [p] = this.pendingPhotos.splice(i, 1);
    if (p) JobcardPhotoService.release([p]);
  }

  // =========================================================== validation + save
  get odometerError(): string {
    const o = this.f.odometerAtCheckIn;
    if (this.ro) return '';
    if (o === null || o === undefined || (o as any) === '') return this.submitted ? 'Odometer (km) is required.' : '';
    if (Number(o) < 0) return 'Odometer cannot be negative.';
    if (this.previousOdometer && Number(o) <= this.previousOdometer) return `Must be greater than the last job card odometer (${this.previousOdometer} km).`;
    return '';
  }

  private validate(): string {
    if (this.isAdmin && !this.dealerCode) return 'Select the dealer.';
    if (!this.dealerName) return this.dealerMessage || 'This dealer is not set up in JobCardScanner.';
    if ((this.f.chassisNo || '').replace(/[^A-Za-z0-9]/g, '').length < 5) return 'Search and select the vehicle (Chassis No / Reg No).';
    if (this.openJobCardNumber) return `This chassis already has an open job card (${this.openJobCardNumber}).`;
    if (!this.f.jobTypeId) return 'Job Type is required.';
    if (!this.f.serviceHeadId) return 'Service Head is required.';
    if (!this.f.priority) return 'Priority is required.';
    if (!this.f.serviceLocationCode) return 'Service Location (workshop) is required.';
    if (this.f.odometerAtCheckIn === null || (this.f.odometerAtCheckIn as any) === '') return 'Odometer (km) is required.';
    if (this.odometerError) return this.odometerError;
    if (!this.vehicleLocked) {
      if (!(this.f.model || '').trim()) return 'Model Name is required.';
      if (!(this.f.customerName || '').trim()) return 'Customer Name is required.';
      if ((this.f.customerMobile || '').replace(/\D/g, '').length !== 10) return 'Mobile No. must have 10 digits.';
    }
    if (!this.f.customerState?.trim()) return 'Customer State is required for tax calculation.';
    const b = this.f.batteryLevelAtCheckIn;
    if (b !== null && b !== undefined && (b as any) !== '' && (Number(b) < 0 || Number(b) > 100)) return 'Battery level must be 0 to 100 %.';
    if (!this.estDelDate || !this.estDelTime) return 'Est. Delivery Date and Time are required.';
    if (this.selectedComplaints.length === 0) return 'Add at least one complaint (Customer Voice).';
    if (this.pendingPhotos.length === 0) return 'At least one photo is required (Photos).';
    return '';
  }

  async save(): Promise<void> {
    if (this.saving) return;
    this.submitted = true;
    this.formError = this.validate();
    if (this.formError) {
      if (this.formError.includes('photo')) this.isOpen['photos'] = true;
      if (this.formError.includes('complaint')) this.isOpen['voice'] = true;
      this.toaster.show(this.formError, { classname: 'bg-danger text-white', delay: 5000 });
      return;
    }
    const src = this.jobSources.find(s => s.jobSourceId == this.f.jobSourceId);
    const ws = this.workshops.find(w => w.locCode === this.f.serviceLocationCode);
    const battery = this.f.batteryLevelAtCheckIn;
    const req: B2BJobCardCreateRequest = {
      ...this.f,
      dealerCode: this.isAdmin ? this.dealerCode : null,
      chassisNo: (this.f.chassisNo || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      customerMobile: (this.f.customerMobile || '').replace(/\D/g, '') || null,
      jobSourceId: this.f.jobSourceId ? Number(this.f.jobSourceId) : null,
      jobSourceName: src?.jobSourceName || null,
      serviceLocationName: ws?.locName || null,
      odometerAtCheckIn: Number(this.f.odometerAtCheckIn),
      batteryLevelAtCheckIn: battery === null || battery === undefined || (battery as any) === '' ? null : Number(battery),
      expectedDeliveryAt: new Date(`${this.estDelDate}T${this.estDelTime}`).toISOString(),
      complaints: [...this.selectedComplaints]
    };
    this.saving = true;
    this.loader.show();
    try {
      const res = await firstValueFrom(this.api.create(req));
      try {
        // photos are stored against the new job card (same folder layout as JobCardScanner)
        await firstValueFrom(this.api.addPhotos(res.id, this.pendingPhotos));
        JobcardPhotoService.release(this.pendingPhotos.splice(0));
      } catch (pe) {
        this.toaster.show(`${res.jobCardNumber} saved, but the photos could not be uploaded: ${B2BJobcardService.errorText(pe)} - open the job card and add them again.`,
          { classname: 'bg-warning text-dark', delay: 8000 });
      }
      this.toaster.show(res?.message || 'B2B Job Card created.', { classname: 'bg-success text-white', delay: 5000 });
      this.router.navigate(['/b2bjobcards']);
    } catch (e: any) {
      this.formError = e instanceof Error && !(e as any).status ? e.message : B2BJobcardService.errorText(e, 'Could not save the B2B job card.');
      this.toaster.show(this.formError, { classname: 'bg-danger text-white', delay: 6000 });
    } finally {
      this.saving = false;
      this.loader.hide();
    }
  }

  // =========================================================== view / edit
  loadDetail(): void {
    this.loader.show();
    this.api.getById(this.jobCardId).subscribe({
      next: (d) => {
        this.loader.hide();
        this.detail = d;
        this.dealerCode = d.dealerCode || null;
        this.dealerName = d.dealerName ? `${d.dealerName} (${d.dealerCode})` : '';
        const created = new Date(this.utc(d.createdAt) as string);
        const exp = d.expectedDeliveryAt ? new Date(this.utc(d.expectedDeliveryAt) as string) : null;
        this.jobInDate = this.ymd(created);
        this.jobInTime = this.hm(created);
        this.estDelDate = exp ? this.ymd(exp) : '';
        this.estDelTime = exp ? this.hm(exp) : '';
        const v = d.vehicle || ({} as any);
        const c = d.customer || ({} as any);
        this.f = {
          ...this.emptyForm(),
          chassisNo: v.chassisNo || '', regNo: v.regNo, model: v.model, variant: v.variant, color: v.color, batteryNo: v.batteryNo,
          motorNo: v.motorNo, controllerNo: v.controllerNo, converterNo: v.converterNo, chargerNo: v.chargerNo, purchaseDate: v.purchaseDate || null,
          customerName: c.name, customerMobile: c.mobile, customerEmail: c.email, customerAddress: c.address, customerCity: c.city, customerState: c.state,
          jobTypeId: d.jobTypeId ?? null, serviceHeadId: d.serviceHeadId ?? null, priority: d.priority,
          serviceLocationCode: d.serviceLocationCode || '', jobSourceId: d.jobSourceId ?? null, manualJobNo: d.manualJobNo,
          couponNo: d.couponNo, supervisorName: d.supervisorName, technicianName: d.technicianName,
          odometerAtCheckIn: d.odometerAtCheckIn, batteryLevelAtCheckIn: d.batteryLevelAtCheckIn ?? null, customerVoice: d.customerVoice
        };
        this.searchTerm = v.chassisNo || '';
        this.selectedComplaints = [...(d.complaints || [])];
        this.savedPhotos = d.photos || [];
        this.edit = { priority: d.priority, assignedTechnicianName: d.assignedTechnicianName || '' };
        // workshop / job type names of this card, even when the master row is gone
        this.workshops = d.serviceLocationCode ? [{ locCode: d.serviceLocationCode, locName: d.serviceLocationName || d.serviceLocationCode }] : [];
        this.staffKey = '';
        this.api.getMasters(this.isAdmin ? this.dealerCode : null).subscribe({
          next: (m) => {
            this.serviceMenu = m.serviceMenu || [];
            this.complaintMaster = m.complaints || [];
            if (this.editable) this.loadStaff();
          },
          error: () => (this.serviceMenu = [])
        });
        if (v.chassisNo) {
          this.api.getVehicle(v.chassisNo, this.isAdmin ? this.dealerCode : null).subscribe({
            next: (card) => {
              this.history = (card?.history || []).filter(h => h.id !== d.id).map(h => ({ ...h, source: 'B2B (JobCardScanner)' }));
              this.loadOtherHistory(v.chassisNo!);
            },
            error: () => (this.history = [])
          });
        }
      },
      error: (e) => {
        this.loader.hide();
        this.toaster.show(B2BJobcardService.errorText(e, 'Could not load the B2B job card.'), { classname: 'bg-danger text-white', delay: 5000 });
        this.router.navigate(['/b2bjobcards']);
      }
    });
  }

  get jobTypeLabel(): string {
    return this.jobTypes.find(j => j.value === this.f.jobTypeId)?.label || this.detail?.jobTypeName || '';
  }

  get editable(): boolean {
    return this.ro && !!this.detail?.canEdit && this.canEdit;
  }

  async saveEdit(): Promise<void> {
    if (!this.detail || !this.editable || this.saving) return;
    if (!this.f.customerState?.trim()) {
      this.toaster.show('Customer State is required for tax calculation.', { classname: 'bg-danger text-white', delay: 4000 });
      return;
    }
    if (!this.estDelDate || !this.estDelTime) {
      this.toaster.show('Est. Delivery Date and Time are required.', { classname: 'bg-danger text-white', delay: 4000 });
      return;
    }
    this.saving = true;
    this.loader.show();
    try {
      if (this.pendingPhotos.length) {
        this.savedPhotos = await firstValueFrom(this.api.addPhotos(this.detail.id, this.pendingPhotos));
        JobcardPhotoService.release(this.pendingPhotos.splice(0));
      }
      const res = await firstValueFrom(this.api.update(this.detail.id, {
        priority: this.edit.priority || null,
        expectedDeliveryAt: new Date(`${this.estDelDate}T${this.estDelTime}`).toISOString(),
        assignedTechnicianName: this.edit.assignedTechnicianName ?? '',
        customerState: this.f.customerState.trim()
      }));
      this.toaster.show(res?.message || 'B2B Job Card updated.', { classname: 'bg-success text-white', delay: 4000 });
      this.loadDetail();
    } catch (e: any) {
      const msg = e instanceof Error && !(e as any).status ? e.message : B2BJobcardService.errorText(e, 'Could not update the B2B job card.');
      this.toaster.show(msg, { classname: 'bg-danger text-white', delay: 6000 });
    } finally {
      this.saving = false;
      this.loader.hide();
    }
  }

  cancel(): void {
    this.router.navigate(['/b2bjobcards']);
  }
}
