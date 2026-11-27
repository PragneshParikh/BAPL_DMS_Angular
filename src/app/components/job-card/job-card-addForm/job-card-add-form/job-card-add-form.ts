//src\app\components\job-card\job-card-addForm\job-card-add-form\job-card-add-form.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType, locationAreaMaster } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../../../core/services/job-card-service';
import { selectLeadData } from '../../../../store/CRM/crm_selector';
import { NgbDropdownModule, NgbModal, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { icons } from '../../../../core/data';
import { Console, error, info } from 'console';
import { constrainedMemory, title } from 'process';
import { text } from 'stream/consumers';
import { Route, Router } from '@angular/router';
import { ToastService } from '../../../../shared/toaster/toast-service';
import { delay } from 'lodash';
import { LoaderService } from '../../../../core/services/loader';
import { EbwInvoiceService } from '../../../../core/services/ebw-invoice-service';
import { LocationMasterService } from '../../../../core/services/location-master-service';
import { ComplaintmasterService } from '../../../../core/services/complaintmaster-service';
import { GroupMasterService } from '../../../../core/services/group-master-service';
import { PrefixService } from '../../../../core/services/prefix';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { MenuAccessService } from '../../../../core/services/menu-access.service';
import { ChassisSearchService } from '../../../../core/services/chassis-search-service';
import { NgSelectModule } from '@ng-select/ng-select';
// Service history lookup + OCR scan (added 18.11.2026)
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { JobcardPhotoService, JobCardPhotoRow, PendingPhoto } from '../../../../core/services/jobcard-photo.service';
import { JobcardServiceHistoryLookupService, ShHistoryCard, ShScope, ShSuggestion, ShVehicle } from '../../../../core/services/jobcard-service-history-lookup.service';
// import { VehicleOcrService, OcrCandidate, extractCandidates, editDistance, isConfident, VoteTracker } from '../../../../core/services/vehicle-ocr.service';   // 24.11.2026 OCR disabled
@Component({
  selector: 'app-job-card-add-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule, NgSelectModule],
  templateUrl: './job-card-add-form.html',
  styleUrl: './job-card-add-form.scss',
})
export class JobCardAddForm {
  // job related dropdown binding
  readonly SUBMENU_ID = 23;
  canCreate = false;
  canEdit = false;
  jobTypeList: any[] = [];
  jobSourceList: any[] = [];
  serviceHeadList: any[] = [];
  serviceTypeList: any[] = [];
  locations: LocationName[];
  chassisList: any[] = [];
  pdiCheckList: any[] = [];
  complaintList: any[] = [];
  jobCardDetailsView: any[] = []
  serviceHistoryList: any[] = []
  filteredChassisList: any[] = [];
  jobTypeId: number = 0
  hasEbw = false;
  ebwSchemeName: string = '';
  ebwExpiryDate: string = '';
  ebwInvoiceId: number | null = null;   // NEW
  ebwBillNo: any = null;                // NEW
  selectedJobtype: any;
  selectedJobSources: any;
  selectedServiceHead: any;
  selectedServiceType: any;
  selectedLocation: string = '';
  selectedChassis: string = '';
  invoiceNo: string = '';
  couponNo: string = '';
  inwardType: string = 'B2C';   // Job Category - B2C by default
  modelName = '';
  registerNo = '';
  vehicleKms: number = 0;
  jobPrefix: string = '';
  jobInDate: any = new Date().toISOString().split('T')[0];
  jobInTime: any = this.getCurrentTime();
  jobNo: number = 0;
  manualJobNo: number = 0;
  estDelDate: any = new Date().toISOString().split('T')[0];
  estDelTime: string = this.getCurrentTime();
  supervisor: '';
  technician: '';
  jobEstimate: number = 0;
  airPressureRear: number = 0;
  airPressureFront: number = 0;
  observation: '';
  supervisorComment: '';
  batteryNumber: string = '';
  batteryCapacity: string = '';
  batteryChemestry: string = '';
  batteryMake: string = '';
  chargerNumber: string = '';
  controllerNo: string = '';
  converterNo: string = '';
  motorNo: string = '';
  odoReading: number = 0.0;
  duration: number = 0.0;
  durationType: string = '';
  expireWarrentyDate: string = '';
  chassiseditData: any = null;
  repairBillStatus: string;
  fromEstimateData: any = null;
  chassisLoading = false;

  // ===== Global chassis search (modal) — logic reused from ebw-invoice.ts,
  // presented as a modal via NgbModal rather than an inline collapsible box =====
  globalChassisSearchTerm: string = '';
  globalChassisSuggestions: any[] = [];
  globalSuggestLoading = false;
  private globalSuggestTimer: any;
  globalSaleData: any = null;
  globalSearchNotFound: boolean = false;
  globalSearching: boolean = false;
  private globalSearchModalRef: any = null;

  // ===== Find vehicle: service history (My dealer / All dealers) + live scan — 18.11.2026 / 21.11.2026 =====
  /** false = "My dealer" (default), true = "All dealers"; SuperAdmin has no dealer → always all */
  shAllDealers = false;
  /** number read by the live scan - shown as "✓ found" while it is looked up */
  shFound = '';
  shLiveGuess = '';
  shLiveHint = false;
  /** chassis the "Vehicle details fetched" card belongs to, and where its data came from */
  shDetailsChassis = '';
  shDetailsSource = '';
  private shLoopId = 0;
  shSearchTerm = '';
  shSuggestions: (ShSuggestion & { ocrDistance?: number })[] = [];
  shSuggestLoading = false;
  shLoading = false;
  shCard: ShHistoryCard | null = null;
  shNotFound = false;
  shError = '';
  shScanMode = false;
  shCameraOn = false;
  shOcrBusy = false;
  shOcrError = '';
  shOcrText = '';
  shOcrCandidates: { value: string; kind: string }[] = [];   // OCR disabled 24.11.2026 (stays empty)
  shPreviewUrl: string | null = null;
  /** past jobs of the vehicle filled from service history (shown only while that chassis is selected) */
  shPastJobs: Record<string, any>[] = [];
  shPastJobsChassis = '';
  shLastKms: number | null = null;
  /** 24.11.2026 Service Card History (B2C only): DMS B2C job cards of the chassis + imported service history (all dealers), newest first */
  serviceCardHistory: { source: string; jobNo: string; jobDate: string | null; regNo: string; kms: number | null; jobType: string;
    serviceHead: string; complaint: string; location: string; status: string; dealer: string }[] = [];
  serviceCardHistoryLoading = false;
  showServiceCardHistory = true;
  private serviceCardHistoryChassis = '';

  /** 25.11.2026 Photos tab (required for a new job card): picked photos waiting for upload + photos already saved (edit) */
  pendingPhotos: PendingPhoto[] = [];
  savedPhotos: JobCardPhotoRow[] = [];
  photoError = '';
  private shTimer: any;
  private shStream: MediaStream | null = null;
  private shModalRef: any = null;

  chargerMake: string = '';
  batteryVoltage: string = '';
  capacityAH: string = '';
  batteryDischarge: string = '';
  batteryCCV: string = '';
  batteryOCV: string = '';
  isPdiModalOpen = false;
  isEditMode = false;
  editId: number = 0;

  isOpen: any = {
    job: true,
    battery: false,
    voice: false,
    comments: false,
    labour: false,
    affectedparts: false,
    insurance: false,
    photos: false
  };

  customerObj = {
    customerLedgerId: 0,
    customerName: '',
    customerMobile: '',
    customerAltMobile: '',
    modelName: '',
    chassisNo: '',
    registerNo: '',
    motorNo: '',
    batteryNo: '',
    saleDate: "",
    insuranceExpDate: "",
    nextServiceDueDate: "",
    rsaRenewalDate: "",
    remarks: ''
  };

  complaintObj = {
    customerVoice: '',
    complaintCode: '',
    complaint: '',
    complaintId: 0
  };
  isPdiSaved = false;

  dealerCode: string = '';
  groupMasterList: any[] = [];
  selectedComplaintGroupId: number | null = null;
  complaintMasterList: any[] = [];
  filteredComplaints: any[] = [];
  showComplaintDropdown = false;
  oemModelId: any;
  showComplaintValidation: boolean;
  isSuperAdmin: boolean;
  estNo: string;
  vehiclePrevkms: any;
  kmsError: string;


  constructor(private storageService: StorageService,
    private locationService: LocationMasterService,
    private router: Router,
    private jobCardService: JobCardService,
    private complaintMasterService: ComplaintmasterService,
    private groupMasterService: GroupMasterService,
    private http: HttpClient,
    private prefixService: PrefixService,
    public toastr: ToastService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private ebwInvoiceService: EbwInvoiceService,
    private menuAccess: MenuAccessService,
    private chassisSearchService: ChassisSearchService,
    private toaster: ToastService,
    private shLookup: JobcardServiceHistoryLookupService,
    private photoService: JobcardPhotoService
    /* , private vehicleOcr: VehicleOcrService   24.11.2026 OCR disabled */) { }

  ngOnInit(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }

    if (history.state?.fromEstimate) {
      this.fromEstimateData = history.state;
      this.vehicleKms = Number(this.fromEstimateData.vehiclekms) || 0;
      this.jobEstimate = Number(this.fromEstimateData.estimateId) || 0;
      this.estNo = this.fromEstimateData.estimationNo || '';
    }
    this.loadPrefix();
    this.fetchLocations();
    this.loadJobTypes();
    this.loadChassisList();
    this.loadJobSorces();
    this.loadGroupMaster();
    this.loadComplaintMaster();

    const data = history.state.data;

    if (data) {
      this.isEditMode = true;
      this.chassiseditData = data;
      this.patchEditData(data);
    }

    //this.loadPdiData(this.oemModelId);
    if (!this.isEditMode) {
      this.getJobNo();
    }
  }

    loadPrefix(): void {
      this.loader.show();
      const dealerCode = this.storageService.getDealerCode();
      const module = 'job_card';
      this.prefixService.getPrefixByDealerByModule(dealerCode, module).subscribe({
        next: (res: string) => {
          this.loader.hide();
          this.jobPrefix = res;
          // FIXED: this used to also do
          //   const parts = res.split('/');
          //   this.jobNo = parseInt(parts[parts.length - 1], 10);
          // which raced against getJobNo() (a different endpoint reading a
          // different source of truth) to set the same field. jobNo is now
          // only ever set by getJobNo().
        }, error: (err) => {
          this.loader.hide();
          console.error(err);
        }
      })
    }
  get isBatteryReadOnly(): boolean {
    return !!this.selectedJobtype;
  }
  //Fetech Dealer Location
  fetchLocations(): void {
    // FIXED: removed the redundant `this.loadPrefix();` call that used to
    // be here — ngOnInit already calls loadPrefix() once. Calling it again
    // here fired a second, unnecessary HTTP request on every page load.
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
 
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }
    this.locationService.getLocationList(this.dealerCode).subscribe({
      next: (data: any[]) => {
 
        // only Workshop (id = 2)
        this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
 
        if (!this.isSuperAdmin) {
          this.dealerCode = this.storageService.getDealerCode();
        } else {
          this.dealerCode = null;
        }
        this.locations = data.filter(x => x.locareadidNo === 2);
        // EDIT MODE FIX
        if (this.isEditMode && this.chassiseditData) {
          // backend value assign
          this.selectedLocation = this.chassiseditData.jobCardHeader.serviceloc;
          // OPTIONAL (safe match)
          const match = this.locations.find(
            x => x.locCode === this.selectedLocation
          );
          if (match) {
            this.selectedLocation = match.locCode;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }

  loadComplaintMaster(): void {
    this.complaintMasterService.getComplaintMasterList().subscribe({
      next: (res: any) => {
        this.complaintMasterList = res || [];
        this.complaintList = this.complaintList.map((complaint: any) => {
          const master = this.complaintMasterList.find((item: any) =>
            item.complaintName?.toLowerCase() === complaint.complaintCode?.toLowerCase()
          );
          const groupId = Number(master?.groupName ?? master?.GroupName) || null;
          const group = this.groupMasterList.find((item: any) => Number(item.id) === groupId);

          return {
            ...complaint,
            groupId,
            groupName: group?.groupName ?? master?.complaintGroupName ?? master?.ComplaintGroupName ?? ''
          };
        });
      },
      error: (err) => {
        console.error('Error fetching complaint master', err);
        this.toastr.show('Failed to load Complaint Master.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  loadGroupMaster(): void {
    this.groupMasterService.getGroupMasterList().subscribe({
      next: (res: any) => {
        this.groupMasterList = res || [];
      },
      error: (err) => {
        console.error('Error fetching group master', err);
        this.toastr.show('Failed to load Group Master.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // filterChassis() {
  //   const value = (this.selectedChassis || '').toLowerCase();

  //   this.filteredChassisList = this.chassisList
  //     .filter(x =>
  //       x.chassisNumber?.toLowerCase().includes(value)
  //     )
  //     .slice(0, 10);
  // }


filterChassis() {
  const value = (this.selectedChassis || '').toLowerCase().trim();

  this.filteredChassisList = this.chassisList
    .filter(x =>
      x.chassisNumber?.toLowerCase().includes(value) ||
      x.registerNo?.toLowerCase().includes(value))
    .sort((a, b) => a.chassisNumber.localeCompare(b.chassisNumber));
}

  selectChassis(item: any) {
    this.selectedChassis = item.chassisNumber;
    this.filteredChassisList = [];

    this.onChassisChange(); // existing method call
  }

  hideChassisDropdown() {
    setTimeout(() => {
      this.filteredChassisList = [];
    }, 200);
  }

  // ===== Global chassis search (modal) =====================================
  // Opens a modal (same NgbModal pattern this file already uses for the PDI
  // Checklist popup) so the user can look up a chassis that isn't in this
  // dealer's own inspected-lot list — e.g. a vehicle sold by another dealer.

  // openGlobalChassisSearch(content: any) {
  //   this.globalChassisSearchTerm = this.selectedChassis || '';
  //   this.globalSaleData = null;
  //   this.globalSearchNotFound = false;

  //   this.globalSearchModalRef = this.modalService.open(content, {
  //     size: 'lg',
  //     centered: true,
  //     backdrop: 'static'
  //   });
  // }

  // closeGlobalSearchModal() {
  //   this.globalSearchModalRef?.dismiss();
  //   this.globalSearchModalRef = null;
  //   this.globalChassisSearchTerm = '';
  //   this.globalSaleData = null;
  //   this.globalSearchNotFound = false;
  // }

  // searchGlobalChassis() {
  //   if (!this.globalChassisSearchTerm) {
  //     this.toaster.show('Enter a Chassis No to search.', { classname: 'bg-warning text-white', delay: 4000 });
  //     return;
  //   }
  //   this.globalSearching = true;
  //   this.globalSaleData = null;
  //   this.globalSearchNotFound = false;

  //   this.chassisSearchService.getGlobalChassisDetails(this.globalChassisSearchTerm).subscribe({
  //     next: (res: any) => {
  //       this.globalSearching = false;
  //       this.globalSaleData = res;
  //     },
  //     error: (err) => {
  //       this.globalSearching = false;
  //       console.error(err);
  //       this.globalSearchNotFound = true;
  //     },
  //   });
  // }
  
    openGlobalChassisSearch(content: any) {
    this.globalChassisSearchTerm = this.selectedChassis || '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
    this.globalChassisSuggestions = [];

    this.globalSearchModalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  closeGlobalSearchModal() {
    clearTimeout(this.globalSuggestTimer);
    this.globalChassisSuggestions = [];
    this.globalSearchModalRef?.dismiss();
    this.globalSearchModalRef = null;
    this.globalChassisSearchTerm = '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
  }

  onGlobalChassisInput() {
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
    clearTimeout(this.globalSuggestTimer);

    const term = (this.globalChassisSearchTerm || '').trim();
    if (term.length < 3) {
      this.globalChassisSuggestions = [];
      return;
    }

    this.globalSuggestTimer = setTimeout(() => {
      this.globalSuggestLoading = true;
      this.chassisSearchService.searchGlobalChassisList(term).subscribe({
        next: (res: any) => {
          this.globalChassisSuggestions = res || [];
          this.globalSuggestLoading = false;
        },
        error: () => {
          this.globalChassisSuggestions = [];
          this.globalSuggestLoading = false;
        }
      });
    }, 300);
  }

  selectGlobalChassis(item: any) {
    this.globalChassisSearchTerm = item.chassisNo;
    this.globalChassisSuggestions = [];
    this.searchGlobalChassis();
  }

  searchGlobalChassis() {
    if (!this.globalChassisSearchTerm) {
      this.toaster.show('Enter a Chassis No to search.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

    this.globalChassisSuggestions = [];
    this.globalSearching = true;
    this.globalSaleData = null;
    this.globalSearchNotFound = false;

    this.chassisSearchService.getGlobalChassisDetails(this.globalChassisSearchTerm).subscribe({
      next: (res: any) => {
        this.globalSearching = false;
        this.globalSaleData = res;
      },
      error: (err) => {
        this.globalSearching = false;
        console.error(err);
        this.globalSearchNotFound = true;
      },
    });
  }

  // Applies the globally-found chassis into this form and closes the modal.
  // This chassis isn't in the dealer's own inspected-lot list (chassisList
  // only ever holds this dealer's own vehicles), so onChassisChange()'s local
  // find() would never match it. This method now mirrors onChassisChange()
  // field-for-field instead of only filling customer/basic info — the backend
  // (GetGlobalChassisDataAsync) has been extended to also return battery
  // details, OemModelId and warranty (OdoReading/Duration/DurationType/
  // ExpireWarrentyDate), so "Valid till", "In Warranty Expired on", PDI
  // checklist and EBW lookup all populate exactly like a normal dropdown pick.
  applyGlobalChassisResult() {
    if (!this.globalSaleData) return;

    const data = this.globalSaleData;

    this.selectedChassis = this.globalChassisSearchTerm;
    this.filteredChassisList = [];

    // ===== Same field set as onChassisChange() =====
    this.invoiceNo = data.invoiceNo || '';
    this.couponNo = this.selectedChassis.slice(-13);
    this.inwardType = data.inwardType || 'B2C';
    this.vehiclePrevkms = data.vehiclePrevKms || 0;

    this.customerObj.customerLedgerId = data.customerLedgerId || 0;
    this.customerObj.customerName = data.customerName || '';
    this.customerObj.customerMobile = data.mobileNo || '';
    this.customerObj.customerAltMobile = data.customerAltMobile || '';
    this.customerObj.saleDate = data.saleDate ? String(data.saleDate).split('T')[0] : '';
    this.customerObj.nextServiceDueDate = data.nextserviceDueDate ? String(data.nextserviceDueDate).split('T')[0] : '';
    this.customerObj.insuranceExpDate = data.insuranceExpDate ? String(data.insuranceExpDate).split('T')[0] : '';

    this.modelName = data.modelName
      ? data.modelName + (data.colourName ? ` (${data.colourName})` : '')
      : (data.modelName || '');

    this.registerNo = data.registerNo || '';

    // Battery details — same fields onChassisChange() sets
    this.batteryCapacity = data.batteryCapacity || '';
    this.batteryMake = data.batteryMake || '';
    this.batteryChemestry = data.batteryChemestry || '';
    this.batteryNumber = data.batteryNumber || '';
    this.motorNo = data.motorNo || '';
    this.controllerNo = data.controllerNo || '';
    this.converterNo = data.converterNo || '';
    this.chargerNumber = data.chargerNumber || '';

    // Warranty — same fields onChassisChange() sets, driving "Valid till" /
    // "In Warranty Expired on" in the Job Basic Information header
    this.odoReading = data.odoReading || 0;
    this.duration = data.duration || 0;
    this.durationType = data.durationType || '';
    this.expireWarrentyDate = data.expireWarrentyDate || '';
    this.oemModelId = data.oemModelId || 0;

    if (this.oemModelId) {
      this.loadPdiData(this.oemModelId);
    }

    this.loadServiceHistory(this.selectedChassis);
    this.loadEbwInfo(this.selectedChassis);

    // /VehicleInfo fallback — only fills whatever the DMS query above didn't
    // already resolve (e.g. if battery/motor rows are missing from
    // ChassisBatteryDetails but exist in the separate VehicleInfo source).
    this.http.get<any>(`${environment.apiUrl}/VehicleInfo`, {
      params: { chassisNo: this.selectedChassis, regNo: this.selectedChassis }
    }).subscribe({
      next: (res) => {
        const vd = res?.vehicleDetails;
        if (!vd) return;

        if (!this.modelName) {
          this.modelName = vd.modelName
            ? vd.modelName + (vd.colorName ? ` (${vd.colorName})` : '')
            : this.modelName;
        }
        this.registerNo = this.registerNo || vd.regNo || '';

        this.batteryNumber = this.batteryNumber || vd.batteries?.[0]?.batteryNo || '';
        this.batteryMake = this.batteryMake || vd.batteries?.[0]?.batteryMake || '';
        this.batteryCapacity = this.batteryCapacity || vd.batteries?.[0]?.capacity || '';
        this.batteryChemestry = this.batteryChemestry || vd.batteries?.[0]?.chemicalType || '';

        this.motorNo = this.motorNo || vd.motors?.[0]?.componentNo || '';
        this.chargerNumber = this.chargerNumber || vd.chargers?.[0]?.componentNo || '';
        this.controllerNo = this.controllerNo || vd.controllers?.[0]?.componentNo || '';
        this.converterNo = this.converterNo || vd.converters?.[0]?.componentNo || '';
      },
      error: () => {
        // best-effort only — don't block job card creation if this lookup fails
      }
    });

    this.closeGlobalSearchModal();
  }

  allowOnlyNumbers(
    event: any,
    field: 'rear' | 'front' | 'altMobile' | 'manualno'
  ) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;

    switch (field) {
      case 'rear':
        this.airPressureRear = value;
        break;

      case 'front':
        this.airPressureFront = value;
        break;

      case 'altMobile':
        this.customerObj.customerAltMobile = value;
        break;

      case 'manualno':
        this.manualJobNo = value;
        break;
    }
  }


  onComplaintSearch(event: any): void {
    const value = String(event.target.value ?? '').trim().toLowerCase();

    // User ne typing start ki -> previous selection invalid
    this.complaintObj.complaintId = 0;
    this.complaintObj.complaint = '';
    this.filterComplaints(value);
  }

  onComplaintFocus(): void {
    this.filterComplaints('');
  }

  private filterComplaints(value: string): void {
    if (this.selectedComplaintGroupId === null) {
      this.filteredComplaints = [];
      this.showComplaintDropdown = false;
      return;
    }

    this.filteredComplaints = this.complaintMasterList.filter(x =>
      Number(x.groupName ?? x.GroupName) === this.selectedComplaintGroupId &&
      String(x.complaintName ?? x.ComplaintName ?? '').toLowerCase().includes(value)
    );

    this.showComplaintDropdown = this.filteredComplaints.length > 0;
  }

  onComplaintGroupChange(): void {
    this.complaintObj.complaintCode = '';
    this.complaintObj.complaint = '';
    this.complaintObj.complaintId = 0;
    this.filteredComplaints = [];
    this.showComplaintDropdown = false;
  }


  selectComplaint(item: any): void {
    this.complaintObj.complaintCode = item.complaintName;
    this.complaintObj.complaint = item.complaintName;
    this.complaintObj.complaintId = item.id;

    this.filteredComplaints = [];
    this.showComplaintDropdown = false;
  }

  loadJobTypes() {
    this.selectedJobtype = '';
    this.jobCardService.getJobType().subscribe({
      next: (res) => {
        this.jobTypeList = res;

        if (this.isEditMode) {
          this.selectedJobtype = this.chassiseditData.jobCardHeader.jobtype;
          this.onJobType(true);
        } else if (this.fromEstimateData?.jobtype) {
          this.selectedJobtype = this.fromEstimateData.jobtype;
          this.onJobType(false, true);
        }
      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }
  loadServiceHistory(chassisNo: string) {
    this.loadServiceCardHistory(chassisNo);   // 24.11.2026 full Service Card History + Previous Kms from the last job card
    let jobCardId: number | null = 0;

    if (this.chassiseditData?.jobCardHeader?.id) {
      jobCardId = this.chassiseditData.jobCardHeader.id;
    }
    this.jobCardService.getJobCardServiceHistory(chassisNo, jobCardId).subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          // this.toastr.show('This chassis number is not sold History not available', {
          //   classname: 'bg-danger text-white',
          //   delay: 2000
          // });
          this.serviceHistoryList = []; // clear table
          return;
        }
        this.serviceHistoryList = res;
      },
      error: (err) => {
        this.toastr.show("Something went wrong");
        console.error(err);
      }
    });
  }
  /**
   * 24.11.2026 - Service Card History of the selected chassis, B2C sources only (never the B2B / JobCardScanner data):
   *   1. DMS B2C job cards (api/JobCard/GetJobCardList, chassis filter, from 01.01.2000 to today)
   *   2. imported service history (api/jobcard-servicehistory-lookup/vehicle, all dealers)
   * Previous Kms (header) = the KMs of the latest of these job cards when that is higher than what the chassis data gave.
   * Not changed in edit mode, so editing an old job card is not blocked by later readings.
   */
  loadServiceCardHistory(chassisNo: string) {
    const chassis = (chassisNo || '').trim();
    this.serviceCardHistoryChassis = chassis;
    this.serviceCardHistory = [];
    if (!chassis) return;
    this.serviceCardHistoryLoading = true;
    const currentJobId = this.chassiseditData?.jobCardHeader?.id || 0;
    const today = new Date();
    const toDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dms$ = this.jobCardService.getJobCardList({ dealerCode: this.isSuperAdmin ? null : this.storageService.getDealerCode(), fromDate: '2000-01-01', toDate, chassisNo: chassis })
      .pipe(catchError(() => of([])));
    const imported$ = this.shLookup.vehicle(chassis, 'all').pipe(catchError(() => of(null)));
    forkJoin([dms$, imported$]).subscribe(([dms, imported]: [any, any]) => {
      if (this.serviceCardHistoryChassis !== chassis) return;   // another chassis was picked meanwhile
      const rows: typeof this.serviceCardHistory = [];
      const dmsList: any[] = Array.isArray(dms) ? dms : (dms?.data || []);
      for (const it of dmsList) {
        const h = it?.jobCardHeader || {};
        if (String(it?.jobCardCustomer?.chassisNo || h.chassisno || '').trim().toUpperCase() !== chassis.toUpperCase()) continue;
        if (currentJobId && h.id === currentJobId) continue;
        rows.push({
          source: 'DMS', jobNo: String(h.jobNo ?? ''), jobDate: h.jobinDate || h.createdDate || null,
          regNo: it?.jobCardCustomer?.registerNo || '', kms: h.vehiclekms != null && h.vehiclekms !== '' ? Number(h.vehiclekms) : null,
          jobType: it?.jobtype || '', serviceHead: [it?.serviceHead, it?.serviceType].filter(Boolean).join(' / '),
          complaint: it?.complaint || '', location: it?.location || '', status: h.jobStatus || '', dealer: h.dealerCode || ''
        });
      }
      for (const v of (imported?.vehicles || [])) {
        if (String(v?.chassisNo || '').trim().toUpperCase() !== chassis.toUpperCase()) continue;
        for (const j of (v.jobs || [])) {
          rows.push({
            source: 'Service history', jobNo: String(j['JobNo'] ?? ''), jobDate: j['JobDate'] || null, regNo: j['RegNo'] || v.regNo || '',
            kms: j['KMS'] != null && j['KMS'] !== '' && !isNaN(Number(j['KMS'])) ? Number(j['KMS']) : null,
            jobType: j['JobType'] || '', serviceHead: j['ServiceHead'] || '', complaint: '', location: j['Location'] || '',
            status: j['JobStatus'] || j['Status'] || '', dealer: j['CompName'] || j['DealerCode'] || ''
          });
        }
      }
      rows.sort((a, b) => (b.jobDate ? new Date(b.jobDate).getTime() : 0) - (a.jobDate ? new Date(a.jobDate).getTime() : 0));
      this.serviceCardHistory = rows;
      this.serviceCardHistoryLoading = false;
      const last = rows.find(r => r.kms !== null);
      if (!this.isEditMode && last && last.kms !== null && last.kms > (Number(this.vehiclePrevkms) || 0)) {
        this.vehiclePrevkms = last.kms;
        this.kmsError = this.vehicleKms !== null && this.vehicleKms !== undefined && String(this.vehicleKms).trim() !== '' && Number(this.vehicleKms) < last.kms
          ? `Odometer cannot be less than the last job card km (${last.kms} km).` : '';
      }
    }, () => { this.serviceCardHistoryLoading = false; });
  }

  loadJobSorces() {
    this.selectedJobSources = '';
    this.jobCardService.getJobSource().subscribe({
      next: (res) => {
        this.jobSourceList = res;

        this.selectedJobSources = this.isEditMode
          ? this.chassiseditData?.jobCardHeader?.jobSource
          : this.jobSourceList?.[0]?.jobSourceId;
      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }

  // loadChassisList() {

  //   this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

  //   if (!this.isSuperAdmin) {
  //     this.dealerCode = this.storageService.getDealerCode();
  //   } else {
  //     this.dealerCode = null;
  //   }
  //   this.jobTypeId = this.selectedJobtype

  //   this.jobCardService.getAllInspectedChassis(this.dealerCode, this.jobTypeId).subscribe(res => {
  //     this.chassisList = res;
  //     //console.log("Chassislist bind", this.chassisList);

  //     if (this.isEditMode && this.chassiseditData) {
  //       this.customerObj.saleDate = this.chassisList[0].saleDate?.split('T')[0];
  //       this.customerObj.insuranceExpDate = this.chassisList[0].insuranceExpDate?.split('T')[0];
  //       this.customerObj.nextServiceDueDate = this.chassisList[0].nextserviceDueDate?.split('T')[0];
  //       this.selectedChassis = this.chassiseditData.jobCardHeader.chassisno;

  //       setTimeout(() => {
  //         this.onChassisChange();
  //       }, 0);
  //     }

  //   });
  // }

  loadChassisList() {

  this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

  if (!this.isSuperAdmin) {
    this.dealerCode = this.storageService.getDealerCode();
  } else {
    this.dealerCode = null;
  }
  this.jobTypeId = this.selectedJobtype;

  this.chassisLoading = true;                                  
  this.jobCardService.getAllInspectedChassis(this.dealerCode, this.jobTypeId).subscribe({
    next: res => {
      this.chassisList = res;
      this.chassisLoading = false;                             

      if (this.isEditMode && this.chassiseditData) {
        this.customerObj.saleDate = this.chassisList[0].saleDate?.split('T')[0];
        this.customerObj.insuranceExpDate = this.chassisList[0].insuranceExpDate?.split('T')[0];
        this.customerObj.nextServiceDueDate = this.chassisList[0].nextserviceDueDate?.split('T')[0];
        this.selectedChassis = this.chassiseditData.jobCardHeader.chassisno;

        setTimeout(() => {
          this.onChassisChange();
        }, 0);
      }
    },
    error: () => { this.chassisLoading = false; }               
  });
}

  loadPdiData(oemModelId: number) {

    this.jobCardService.getPdiChecklist(oemModelId).subscribe(res => {
      this.pdiCheckList = res
    });
  }
  toggle(section: string) {
    Object.keys(this.isOpen).forEach(key => {
      this.isOpen[key] = false;
    });

    this.isOpen[section] = true;
  }

  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;
  }


//   onJobType(isEdit = false, isFromEstimate: boolean = false) {
//     if (!this.selectedJobtype) return;

//     // FIXED: this method never branched on isSuperAdmin like every other
//     // chassis/location loader in this component does (fetchLocations,
//     // loadChassisList). It always sent the logged-in user's own dealerCode,
//     // so even a true SuperAdmin session got scoped to their own dealer and
//     // never saw other dealers' chassis (e.g. isSuperAdmin bypass in
//     // GetAllInspectedLotChassisAsync's "isSuperAdmin || v.DealerId == dealerCode"
//     // check never actually triggered because dealerCode was never null here).
//     this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
//     if (!this.isSuperAdmin) {
//       this.dealerCode = this.storageService.getDealerCode();
//     } else {
//       this.dealerCode = null;
//     }

//     // Load chassis
//     this.jobCardService
//       .getAllInspectedChassis(this.dealerCode, this.selectedJobtype)
//       .subscribe(res => {
//         this.chassisList = res;
//       });

//     // Load service heads
//     this.jobCardService
//       .getServiceHead(this.selectedJobtype)
//       .subscribe((res: any[]) => {

//         this.serviceHeadList = res;

//         // EDIT MODE
//         if (isEdit) {

//           this.selectedServiceHead =
//             this.chassiseditData.jobCardHeader.servicehead;

//           this.loadServiceType(this.selectedServiceHead, true);

//           return;
//         }

//         // FIXED: same missing branch here — this second dealerCode
//         // assignment (used for the chassis reload just below) also ignored
//         // isSuperAdmin.
//         if (!this.isSuperAdmin) {
//           this.dealerCode = this.storageService.getDealerCode();
//         } else {
//           this.dealerCode = null;
//         }

//         // Load chassis
//         this.jobCardService
//           .getAllInspectedChassis(this.dealerCode, this.selectedJobtype)
//           .subscribe(res => {
//             this.chassisList = res;

//             if (isFromEstimate && this.fromEstimateData?.chassisNo) {
//               const match = this.chassisList.find(
//                 x => x.chassisNumber == this.fromEstimateData.chassisNo
//               );

//               if (match) {
//                 // Found in the inspected-lot list — reuse the normal path so we
//                 // get full battery/motor/warranty data, same as edit mode.
//                 this.selectedChassis = this.fromEstimateData.chassisNo;
//                 this.onChassisChange();
//               } else {
//                 // Estimate chassis isn't in this dealer's inspected-lot list
//                 // (e.g. a walk-in) — fall back to what Estimate already resolved.
//                 this.applyEstimateVehicleFallback();
//               }
//             }
//           });

//         // Load service heads
//         this.jobCardService
//           .getServiceHead(this.selectedJobtype)
//           .subscribe((res: any[]) => {
//             this.serviceHeadList = res;

//             if (isEdit) {
//               this.selectedServiceHead = this.chassiseditData.jobCardHeader.servicehead;
//               this.loadServiceType(this.selectedServiceHead, true);
//               return;
//             }

//             if (this.serviceHeadList.length > 0) {
//               this.selectedServiceHead = this.serviceHeadList[0].serviceHeadId;
//               this.loadServiceType(this.selectedServiceHead);
//             } else {
//               this.selectedServiceHead = '';
//               this.selectedServiceType = '';
//               this.serviceTypeList = [];
//             }
//           });
//       });
// }

onJobType(isEdit = false, isFromEstimate: boolean = false) {
  if (!this.selectedJobtype) return;

  this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
  this.dealerCode = this.isSuperAdmin ? null : this.storageService.getDealerCode();

  // ===== 1) Chassis load =====
  this.chassisLoading = true;
  this.jobCardService
    .getAllInspectedChassis(this.dealerCode, this.selectedJobtype)
    .subscribe({
      next: res => {
        this.chassisList = res || [];
        this.chassisLoading = false;
        this.filterChassis();   

        if (!isEdit && isFromEstimate && this.fromEstimateData?.chassisNo) {
          const match = this.chassisList.find(
            x => x.chassisNumber == this.fromEstimateData.chassisNo
          );

          if (match) {
            this.selectedChassis = this.fromEstimateData.chassisNo;
            this.onChassisChange();
          } else {
            this.applyEstimateVehicleFallback();
          }
        }
      },
      error: () => {
        this.chassisLoading = false;
      }
    });

  // ===== 2) Service heads =====
  this.jobCardService
    .getServiceHead(this.selectedJobtype)
    .subscribe((res: any[]) => {
      this.serviceHeadList = res;

      if (isEdit) {
        this.selectedServiceHead = this.chassiseditData.jobCardHeader.servicehead;
        this.loadServiceType(this.selectedServiceHead, true);
        return;
      }

      if (this.serviceHeadList.length > 0) {
        this.selectedServiceHead = this.serviceHeadList[0].serviceHeadId;
        this.loadServiceType(this.selectedServiceHead);
      } else {
        this.selectedServiceHead = '';
        this.selectedServiceType = '';
        this.serviceTypeList = [];
      }
    });
}
  onServiceHeadChange() {
    this.loadServiceType(this.selectedServiceHead);
  }

  loadServiceType(serviceHeadId: number, isEdit = false) {

    this.jobCardService
      .getServiceType(serviceHeadId)
      .subscribe((res: any[]) => {

        this.serviceTypeList = res;

        // EDIT MODE
        if (isEdit) {

          this.selectedServiceType =
            this.chassiseditData.jobCardHeader.servicetype;

          return;
        }

        // SINGLE VALUE AUTO SELECT
        if (this.serviceTypeList.length === 1) {

          this.selectedServiceType =
            this.serviceTypeList[0].serviceTypeId;

        }
        else {

          this.selectedServiceType = '';

        }

      });
  }

  onChassisChange() {
    //debugger;
    if (!this.selectedChassis) return;
    this.loadServiceHistory(this.selectedChassis);

    const selected = this.chassisList.find(
      x => x.chassisNumber == this.selectedChassis
    );

    if (!selected) return;

    this.invoiceNo = selected.invoiceNo;
    this.couponNo = this.selectedChassis.slice(-13);
    this.inwardType = selected.inwardType || 'B2C';
    this.vehiclePrevkms = selected.vehiclePrevkms;
    this.customerObj.customerLedgerId = selected.customerLedgerId;
    this.customerObj.customerName = selected.customerName;
    this.customerObj.customerMobile = selected.customerMobile;
    this.customerObj.customerAltMobile = selected.customerAltMobile;
    this.customerObj.saleDate = selected.saleDate?.split('T')[0];
    this.customerObj.nextServiceDueDate = selected.nextserviceDueDate?.split('T')[0];
    this.customerObj.insuranceExpDate = selected.insuranceExpDate?.split('T')[0];

    this.modelName = selected.modelName
      + (selected.colourName ? ' (' + selected.colourName + ')' : '');

    this.registerNo = selected.registerNo;
    this.batteryCapacity = selected.batteryCapacity;
    this.batteryMake = selected.batteryMake;
    this.batteryChemestry = selected.batteryChemestry;
    this.batteryNumber = selected.batteryNumber;
    this.motorNo = selected.motorNo;
    this.controllerNo = selected.controllerNo;
    this.converterNo = selected.converterNo;
    this.chargerNumber = selected.chargerNumber;
    this.odoReading = selected.odoReading;
    this.duration = selected.duration;
    this.durationType = selected.durationType;
    this.expireWarrentyDate = selected.expireWarrentyDate;
    this.oemModelId = selected.oemModelId;

    if (this.oemModelId) {
      this.loadPdiData(this.oemModelId);
    }

    this.loadEbwInfo(this.selectedChassis); // NEW
  }

  private loadEbwInfo(chassisNo: string): void {
    this.ebwExpiryDate = '';
    this.hasEbw = false;
    this.ebwInvoiceId = null;
    this.ebwBillNo = null;

    this.ebwInvoiceService.getByChassisNo(chassisNo).subscribe({
      next: (res: any) => {
        if (!res) return; // no EBW purchased — nothing to show, this is normal

        this.hasEbw = true;
        this.ebwExpiryDate = res.warrantyEndDate || '';
        this.ebwSchemeName = res.schemeName || '';
        this.ebwInvoiceId = res.id || null;
        this.ebwBillNo = res.billNo || null;

        // Only fill battery number if the inspected-lot list didn't already have one
        if (!this.batteryNumber && res.batteryNumber) {
          this.batteryNumber = res.batteryNumber;
        }
      },
      error: () => {
        // best-effort — don't block job card creation if this lookup fails
      }
    });
  }

  openEbwInvoice(): void {
    if (!this.ebwInvoiceId) return;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/ebw-invoice', this.ebwInvoiceId])
    );
    window.open(url, '_blank');
  }
  // PDiChecklist popup
  openPdiModal(content: any) {

    if (!this.selectedChassis || this.selectedChassis.trim() === '') {
      Swal.fire({
        icon: 'warning',
        text: 'Please select chassis number before opening PDI checklist',
        width: '300px'
      });
      return;
    }

    //  EDIT MODE → data preserve
    if (this.isEditMode && this.chassiseditData?.pdiChecklistChassiWise?.length) {

      const savedPdi = this.chassiseditData.pdiChecklistChassiWise;

      this.pdiCheckList = this.pdiCheckList.map(item => {

        const match = savedPdi.find(
          (x: any) => x.pdichecklistMasterId === item.id
        );

        return {
          ...item,
          isStatus: match ? match.isStatus : true,
          remarks: match ? match.remarks : ''
        };
      });

    } else {
      //  ADD MODE → default
      this.pdiCheckList = this.pdiCheckList.map(x => ({
        ...x,
        isStatus: false,
        remarks: ''
      }));
    }

    this.modalService.open(content, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
  }
  validatePdi(): boolean {
    return this.pdiCheckList.every(x =>
      x.isStatus !== null && x.isStatus !== undefined && x.remarks && x.remarks.trim() !== ''
    );
  }
  onClose(modal: any) {
    // if (!this.validatePdi()) {
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Incomplete Checklist',
    //     text: 'Please complete all PDI items before closing',
    //     width: '300px'
    //   });
    //   return;
    // }

    modal.dismiss();
  }


  // add complain section 
  addComplaint() {

    if (
      !this.complaintObj.customerVoice ||
      !this.complaintObj.complaint ||
      this.selectedComplaintGroupId === null
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Validation',
        text: 'Please fill Customer Voice, Group Master, and Complaint Name.',
        width: '300px'
      });
      return;
    }

    // Complaint Code Validation
    if (!this.complaintObj.complaintId) {
      this.toastr.show('Please select a valid Complaint Code from dropdown', {
        classname: 'bg-warning text-white',
        delay: 2000
      });
      return;
    }

    this.complaintList.push({
      ...this.complaintObj,
      groupId: this.selectedComplaintGroupId,
      groupName: this.groupMasterList.find(
        (group: any) => Number(group.id) === this.selectedComplaintGroupId
      )?.groupName ?? ''
    });

    // Reset fields
    this.selectedComplaintGroupId = null;
    this.filteredComplaints = [];
    this.showComplaintDropdown = false;
    this.complaintObj = {
      customerVoice: '',
      complaintCode: '',
      complaintId: 0,
      complaint: ''
    };
  }
  deleteComplaint(index: number) {
    this.complaintList.splice(index, 1);
  }
  calculateEstimatedDelivery() {

    if (!this.jobInDate || !this.jobInTime) {
      return;
    }

    const dateTime = new Date(`${this.jobInDate}T${this.jobInTime}`);

    // Add 30 minutes
    dateTime.setMinutes(dateTime.getMinutes() + 30);

    // Date
    this.estDelDate = dateTime.toISOString().split('T')[0];

    // Time
    this.estDelTime = dateTime.toTimeString().substring(0, 5);
  }

  savePdi() {

    if (this.pdiCheckList.length == 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please Add atleast one checklist for this model.',
        width: '300px'
      });
      return;
    }
    this.pdiCheckList = this.pdiCheckList.map(x => ({
      ...x,
      isStatus: x.isStatus === true,
      remarks: x.remarks || ''
    }));

    this.isPdiSaved = true;

    Swal.fire({
      icon: 'success',
      title: 'PDI Checklist has been done.',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      this.modalService.dismissAll();
    });
  }
  //insert jobcard
  isSubmitted = false;
  isSaving = false;
  saveJobCard() {
    // NEW: hard stop for re-entrant calls — double-click, a second (click)/(ngSubmit)
    // firing, or the user clicking again before the loader visually blocks input.
    if (this.isSaving) {
      return;
    }

    this.isSubmitted = true;

    if (this.selectedJobtype == 1 && this.pdiCheckList.length == 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please Add atleast one checklist for this model.',
        width: '300px'
      });
      return;
    }

    if (!this.supervisor) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please select Supervisor.',
        width: '300px'
      });
      return;
    }
    if (!this.technician) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please select Technician.',
        width: '300px'
      });
      return;
    }
    if (!this.selectedJobSources) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please select Job Source.',
        width: '300px'
      });
      return;
    }
    // 25.11.2026 Odometer (km) is required and can never be less than the last job card's reading (every user)
    const kmsEntered = this.vehicleKms !== null && this.vehicleKms !== undefined && String(this.vehicleKms).trim() !== '';
    const kms = Number(this.vehicleKms);
    const lastKms = Number(this.vehiclePrevkms) || 0;
    if (!kmsEntered || isNaN(kms) || kms < 0) {
      this.kmsError = 'Odometer (km) is required.';
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please enter Odometer (km).', width: '300px' });
      return;
    }
    if (kms < lastKms) {
      this.kmsError = `Odometer cannot be less than the last job card km (${lastKms} km).`;
      Swal.fire({ icon: 'warning', title: 'Validation', text: this.kmsError, width: '320px' });
      return;
    }

    // 25.11.2026 Photos tab: at least one photo for a new job card (and for an edited one that has none yet)
    if (this.pendingPhotos.length === 0 && this.savedPhotos.length === 0 && !this.isEditMode) {
      this.photoError = 'At least one photo is required.';
      this.isOpen.photos = true;
      Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please attach at least one photo (Photos tab).', width: '300px' });
      return;
    }

    const jobIn = new Date(`${this.jobInDate}T${this.jobInTime}`);
    const estDel = new Date(`${this.estDelDate}T${this.estDelTime}`);

    if (estDel <= jobIn) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Estimated Delivery Date & Time should be greater than Job In Date & Time.',
        width: '350px'
      });
      return;
    }
    if (!this.observation) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Observation required.',
        width: '350px'
      });
      return;
    }
    if (!this.supervisorComment) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Supervisor Comment required.',
        width: '350px'
      });
      return;
    }

    this.showComplaintValidation = false;

    if (
      this.complaintObj.customerVoice?.trim() ||
      this.complaintObj.complaint?.trim() ||
      this.selectedComplaintGroupId !== null
    ) {
      this.showComplaintValidation = true;
      this.isOpen.voice = true;
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please click Add to save the Customer Voice details.',
        width: '350px'
      });
      return;
    }

    if (this.complaintList.length === 0) {
      this.showComplaintValidation = true;
      this.isOpen.voice = true;
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Please add at least one Customer Voice.',
        width: '350px'
      });
      return;
    }

    if (this.selectedJobtype == 1 && !this.isPdiSaved) {
      Swal.fire('Error', 'Please complete PDI first', 'error');
      return;
    }

    if (!this.selectedChassis || this.selectedChassis.trim() === '') {
      this.toaster.show("Please select chassis number.", { classname: 'bg-warning text-white', delay: 5000 })
      return;
    } else if (!this.selectedJobtype || this.selectedJobtype === '') {
      this.toaster.show("Please select Job type.", { classname: 'bg-warning text-white', delay: 5000 })
      return;
    }

    const dealerCode = this.storageService.getDealerCode();
    const userId = this.storageService.getUserId();

    const jobCardHeader = {
      id: this.isEditMode ? this.editId : 0,
      jobtype: this.selectedJobtype || 0,
      dealerCode: dealerCode,
      invoiceNo: this.invoiceNo,
      chassisno: this.selectedChassis,
      vehiclekms: Number(this.vehicleKms) || 0,
      servicehead: this.selectedServiceHead || 0,
      servicetype: this.selectedServiceType || 0,
      serviceloc: this.selectedLocation || "",
      couponno: this.couponNo,
      inwardType: this.inwardType,
      jobprefix: this.jobPrefix,
      jobinDate: this.jobInDate || null,
      jobinTime: this.jobInTime || null,
      jobNo: Number(this.jobNo) || 0,
      manualjobNo: Number(this.manualJobNo) || 0,
      estNo: this.estNo || 0,
      estdelDate: this.estDelDate || null,
      estdelTime: this.estDelTime || null,
      jobSource: this.selectedJobSources || 0,
      supervisor: this.supervisor,
      technician: this.technician,
      jobestmate: Number(this.jobEstimate),
      airpressureRearTyre: Number(this.airPressureRear) || 0,
      airpressurefrontTyre: Number(this.airPressureFront) || 0,
      observation: this.observation || "",
      supervisorComment: this.supervisorComment || "",
      isPdiSuccess: true,
      createdBy: userId,
      updatedBy: userId
    };

    const jobCardBattery = {
      dealerCode: dealerCode,
      batteryMake: this.batteryMake,
      batterySerialNo: this.batteryNumber,
      batteryOcv: this.batteryOCV,
      batteryCcv: this.batteryCCV,
      batteryDischarge: this.batteryDischarge,
      batteryCapacityAh: this.capacityAH,
      batteryVoltage: this.batteryVoltage,
      motorDrawing: this.motorNo,
      chargerMake: this.chargerMake,
      chargerNo: this.chargerNumber,
      converterNo: this.converterNo,
      controllerNo: this.controllerNo,
      batteryChemical: this.batteryChemestry,
      batteryCapacity: this.batteryCapacity,
      createdBy: userId,
      updatedBy: userId
    };

    const jobCardCustomer = {
      customerLedgerId: this.customerObj.customerLedgerId || 0,
      customerName: this.customerObj.customerName || null,
      customerMobile: this.customerObj.customerMobile || null,
      customerAltMobile: this.customerObj.customerAltMobile || null,
      modelName: this.modelName || null,
      chassisNo: this.selectedChassis || null,
      registerNo: this.registerNo || null,
      motorNo: this.motorNo || null,
      batteryNo: this.batteryNumber || null,
      saleDate: this.customerObj.saleDate || null,
      insuranceExpDate: this.customerObj.insuranceExpDate || null,
      nextServiceDueDate: this.customerObj.nextServiceDueDate || null,
      rsaRenewalDate: this.customerObj.rsaRenewalDate || null,
      remarks: this.customerObj.remarks || null,
      createdBy: userId,
      updatedBy: userId
    };

    const jobCardComplaint = this.complaintList.map(x => ({
      id: x.id || 0,
      dealerCode: dealerCode,
      customerVoice: x.customerVoice,
      complaintCode: x.complaintCode,
      complaint: x.complaint,
      createdBy: userId,
      updatedBy: userId
    }));

    const JobCardpdiChecklist = this.pdiCheckList.map(x => ({
      pdichecklistMasterId: x.id,
      oemModelId: x.oemModelId,
      isStatus: x.isStatus,
      remarks: x.remarks,
      createdBy: userId,
      updatedBy: userId
    }));

    const payload = {
      jobCardHeader,
      jobCardBattery,
      jobCardCustomer,
      jobCardComplaint,
      pdiChecklistChassiWise: JobCardpdiChecklist
    };

    const apiCall = this.isEditMode
      ? this.jobCardService.updateJobCard(payload)
      : this.jobCardService.insertJobCard(payload);

    this.isSaving = true; // NEW: lock out further calls until this request settles
    this.loader.show();
    // 25.11.2026: the photos are uploaded right after the job card is saved (linkUploadedPhotos)
    Promise.resolve(this.pendingPhotos.slice()).then(uploaded => {
    apiCall.subscribe({
      next: (res: any) => {
        const savedId = this.isEditMode ? this.chassiseditData?.jobCardHeader?.id : (res?.id ?? res?.Id);
        this.linkUploadedPhotos(savedId, uploaded);
        this.isSaving = false; // NEW
        this.toastr.show(`${this.isEditMode ? 'Updated' : 'Saved'} Successfully`, { classname: 'bg-success text-white', delay: 5000 });
        this.resetForm();
        this.router.navigate(['/job-card']);
        this.isEditMode = false;
        this.loader.hide();
      },
      error: (err) => {
        this.isSaving = false; // NEW
        console.error(err);
        this.loader.hide();

        const message =
          err?.error?.message ||
          err?.error ||
          'Something went wrong.';

        this.toastr.show(message, {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
    }).catch(err => {
      this.isSaving = false;
      this.loader.hide();
      this.photoError = err?.message || 'Photos could not be uploaded.';
      this.toastr.show(this.photoError + ' The job card was not saved.', { classname: 'bg-danger text-white', delay: 6000 });
    });
  }

  // ================= 25.11.2026 Photos tab =================
  onPhotosPicked(event: Event) {
    const input = event.target as HTMLInputElement;
    this.photoError = JobcardPhotoService.addFiles(this.pendingPhotos, input.files, this.savedPhotos.length);
    input.value = '';
  }

  removePendingPhoto(i: number) {
    const [p] = this.pendingPhotos.splice(i, 1);
    if (p) JobcardPhotoService.release([p]);
  }

  loadSavedPhotos(jobCardHeaderId: number) {
    this.photoService.getB2CPhotos(jobCardHeaderId).subscribe({
      next: (rows) => (this.savedPhotos = rows || []),
      error: () => (this.savedPhotos = [])
    });
  }

  deleteSavedPhoto(p: JobCardPhotoRow) {
    Swal.fire({ icon: 'question', title: 'Remove photo?', text: p.fileName, showCancelButton: true, confirmButtonText: 'Remove', width: '320px' })
      .then(r => {
        if (!r.isConfirmed) return;
        this.photoService.deleteB2CPhoto(p.id).subscribe({
          next: () => (this.savedPhotos = this.savedPhotos.filter(x => x.id !== p.id)),
          error: (e) => this.toastr.show(e?.error?.message || 'Photo could not be removed.', { classname: 'bg-danger text-white', delay: 5000 })
        });
      });
  }

  /** uploads the picked photos for the saved job card (stored by the API like JobCardScanner) */
  private linkUploadedPhotos(jobCardHeaderId: any, photos: PendingPhoto[]) {
    if (!photos?.length) return;
    const id = Number(jobCardHeaderId);
    if (!id) {
      this.toastr.show('Job card saved, but the photos could not be attached (the API did not return the job card id - rebuild the API).', { classname: 'bg-warning text-dark', delay: 8000 });
      return;
    }
    this.photoService.uploadB2CPhotos(id, photos).subscribe({
      next: () => JobcardPhotoService.release(photos),
      error: (e) => this.toastr.show('Job card saved, but the photos could not be uploaded: ' + (e?.error?.message || 'server error') + ' - edit the job card and add them again.', { classname: 'bg-warning text-dark', delay: 8000 })
    });
  }

  // edit jobcard
  patchEditData(data: any) {

    // ================= HEADER =================
    this.repairBillStatus = data.repairBillStatus;
    this.selectedJobtype = data.jobCardHeader.jobtype;
    this.selectedServiceHead = data.jobCardHeader.servicehead;
    this.selectedServiceType = data.jobCardHeader.servicetype;
    this.selectedJobSources = data.jobCardHeader.jobSource;


    this.selectedChassis = data.jobCardHeader.chassisno;
    this.vehicleKms = data.jobCardHeader.vehiclekms;
    if (this.selectedChassis) this.loadServiceCardHistory(this.selectedChassis);   // 24.11.2026 history only (Previous Kms untouched in edit mode)
    if (data.jobCardHeader?.id) this.loadSavedPhotos(data.jobCardHeader.id);   // 25.11.2026 Photos tab
    this.selectedLocation = data.jobCardHeader.serviceloc;

    this.couponNo = data.jobCardHeader.couponno;
    this.inwardType = data.jobCardHeader.inwardType || 'B2C';
    this.jobPrefix = data.jobCardHeader.jobprefix;
    this.jobInDate = data.jobCardHeader.jobinDate;
    this.jobInTime = data.jobCardHeader.jobinTime;
    this.jobNo = data.jobCardHeader.jobNo;
    this.manualJobNo = data.jobCardHeader.manualjobNo;
    this.estNo = data.jobCardHeader.estNo;
    this.estDelDate = data.jobCardHeader.estdelDate;
    this.estDelTime = data.jobCardHeader.estdelTime;

    this.supervisor = data.jobCardHeader.supervisor;
    this.technician = data.jobCardHeader.technician;
    this.jobEstimate = data.jobCardHeader.jobestmate;

    this.airPressureRear = data.jobCardHeader.airpressureRearTyre;
    this.airPressureFront = data.jobCardHeader.airpressurefrontTyre;

    this.observation = data.jobCardHeader.observation;
    this.supervisorComment = data.jobCardHeader.supervisorComment;

    // ================= CUSTOMER =================
    this.customerObj = {
      customerLedgerId: data.jobCardCustomer?.customerLedgerId || 0,
      customerName: data.jobCardCustomer?.customerName || '',
      customerMobile: data.jobCardCustomer?.customerMobile || '',
      customerAltMobile: data.jobCardCustomer?.customerAltMobile || '',
      modelName: data.jobCardCustomer?.modelName || '',
      chassisNo: data.jobCardCustomer?.chassisNo || '',
      registerNo: data.jobCardCustomer?.registerNo || '',
      motorNo: data.jobCardCustomer?.motorNo || '',
      batteryNo: data.jobCardCustomer?.batteryNo || '',
      saleDate: data.jobCardCustomer?.saleDate || '',
      insuranceExpDate: data.jobCardCustomer?.insuranceExpDate || '',
      nextServiceDueDate: data.jobCardCustomer?.nextserviceDueDate || '',
      rsaRenewalDate: data.jobCardCustomer?.rsarenewalDate || '',
      remarks: data.jobCardCustomer?.remarks || ''
    };

    // ================= BATTERY =================
    this.batteryMake = data.jobCardBattery?.batteryMake;
    this.batteryNumber = data.jobCardBattery?.batterySerialNo;
    this.batteryOCV = data.jobCardBattery?.batteryOcv;
    this.batteryCCV = data.jobCardBattery?.batteryCcv;
    this.batteryDischarge = data.jobCardBattery?.batteryDischarge;
    this.capacityAH = data.jobCardBattery?.batteryCapacityAh;
    this.batteryVoltage = data.jobCardBattery?.batteryVoltage;

    this.chargerMake = data.jobCardBattery?.chargerMake;
    this.chargerNumber = data.jobCardBattery?.chargerNo;
    this.converterNo = data.jobCardBattery?.converterNo;
    this.controllerNo = data.jobCardBattery?.controllerNo;

    this.batteryChemestry = data.jobCardBattery?.batteryChemical;
    this.batteryCapacity = data.jobCardBattery?.batteryCapacity;

    // ================= COMPLAINT =================
    this.complaintList = data.jobCardComplaint || [];

    // ================= PDI =================
    if (data.pdiChecklistChassiWise && data.pdiChecklistChassiWise !== null) {
      this.pdiCheckList = data.pdiChecklistChassiWise.map((x: any) => ({
        id: x.pdichecklistMasterId,
        isStatus: x.isStatus,
        remarks: x.remarks
      }));
    }


    this.isPdiSaved = true; // important
    this.isEditMode = true;
    this.editId = data.jobCardHeader.id;

    setTimeout(() => {
      this.onChassisChange();
    }, 300);
  }

validateWarranty(): boolean {

    if (this.vehicleKms !== null && this.vehicleKms !== undefined && String(this.vehicleKms).trim() !== '' &&
      Number(this.vehiclePrevkms) > 0 && Number(this.vehicleKms) < Number(this.vehiclePrevkms)) {

      this.kmsError = `Odometer cannot be less than the last job card km (${this.vehiclePrevkms} km).`;
    } else {
      this.kmsError = '';
    }

    if (!this.selectedJobtype || !this.vehicleKms || !this.odoReading) {
      return true; // skip validation (no error)
    }

    const isInWarranty = this.selectedJobtype == 3;

    if (isInWarranty && Number(this.vehicleKms) > Number(this.odoReading)) {

      Swal.fire({
        icon: 'warning',
        title: 'Invalid Selection',
        text: 'Vehicle KMS exceeds warranty limit. Please select Post Warranty jobType.',
        width: '350px'
      });

      this.selectedJobtype = '';

      return false;
    }

    return true;
  }
  resetForm() {
    // HEADER
    this.selectedJobtype = null;
    this.selectedJobSources = null;
    this.selectedServiceHead = null;
    this.selectedServiceType = null;
    this.selectedLocation = '';
    this.selectedChassis = '';

    this.invoiceNo = '';
    this.couponNo = '';
    this.inwardType = 'B2C';
    this.vehicleKms = 0;
    this.jobPrefix = '';
    this.jobInDate = '';
    this.jobInTime = '';
    this.jobNo = 0;
    this.manualJobNo = 0;
    this.estNo = '';
    this.estDelDate = '';
    this.estDelTime = '';
    this.supervisor = '';
    this.technician = '';
    this.jobEstimate = 0;
    this.airPressureRear = 0;
    this.airPressureFront = 0;
    this.observation = '';
    this.supervisorComment = '';

    // BATTERY
    this.batteryNumber = '';
    this.batteryCapacity = '';
    this.batteryChemestry = '';
    this.batteryMake = '';
    this.chargerNumber = '';
    this.controllerNo = '';
    this.converterNo = '';
    this.motorNo = '';
    this.chargerMake = '';
    this.batteryVoltage = '';
    this.capacityAH = '';
    this.batteryDischarge = '';
    this.batteryCCV = '';
    this.batteryOCV = '';

    // CUSTOMER
    this.customerObj = {
      customerLedgerId: 0,
      customerName: '',
      customerMobile: '',
      customerAltMobile: '',
      modelName: '',
      chassisNo: '',
      registerNo: '',
      motorNo: '',
      batteryNo: '',
      saleDate: "",
      insuranceExpDate: "",
      nextServiceDueDate: "",
      rsaRenewalDate: "",
      remarks: ''
    };

    // EBW
    this.hasEbw = false;
    this.ebwSchemeName = '';
    this.ebwExpiryDate = '';
    this.ebwInvoiceId = null;
    this.ebwBillNo = null;

    // COMPLAINT
    this.complaintList = [];
    this.selectedComplaintGroupId = null;
    this.filteredComplaints = [];
    this.showComplaintDropdown = false;
    this.complaintObj = {
      customerVoice: '',
      complaintCode: '',
      complaint: '',
      complaintId: 0
    };

    // PDI
    this.isPdiSaved = false;

    // IMPORTANT: reload PDI checklist (not empty)
    this.loadPdiData(0);
  }
  goToFFIR() {

    if (!this.isEditMode || !this.editId) {
      Swal.fire({
        icon: 'warning',
        text: 'Please save job card first before opening FFIR',
        width: '300px'
      });
      return;
    }

    this.router.navigate(['/ffir', this.editId]);
  }

  getCurrentTime(): string {
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  getJobNo() {
    this.loader.show();
    this.jobCardService.getJobNo(this.dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        this.jobNo = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  // Estimate already resolved model/battery/motor for this chassis via
  // /VehicleInfo when the user searched it there. If the chassis isn't part
  // of this dealer's inspected-lot list (so onChassisChange() has nothing to
  // match against), repeat that same lookup here rather than leaving those
  // fields blank.
  private applyEstimateVehicleFallback(): void {
    const est = this.fromEstimateData;
    if (!est?.chassisNo) return;

    this.selectedChassis = est.chassisNo;
    this.couponNo = est.chassisNo.slice(-13);
    this.registerNo = est.registerNo || '';
    this.customerObj.customerName = est.customerName || '';
    this.customerObj.customerMobile = est.customerMobile || '';

    this.loadServiceHistory(est.chassisNo);

    this.http.get<any>(`${environment.apiUrl}/VehicleInfo`, {
      params: { chassisNo: est.chassisNo, regNo: est.chassisNo }
    }).subscribe({
      next: (res) => {
        const vd = res?.vehicleDetails;
        if (!vd) return;

        this.modelName = vd.modelName
          ? vd.modelName + (vd.colorName ? ` (${vd.colorName})` : '')
          : this.modelName;
        this.registerNo = vd.regNo || this.registerNo;

        this.batteryNumber = vd.batteries?.[0]?.batteryNo || this.batteryNumber;
        this.motorNo = vd.motors?.[0]?.componentNo || this.motorNo;
        this.chargerNumber = vd.chargers?.[0]?.componentNo || this.chargerNumber;
      },
      error: () => {
        // Best-effort only — same pattern Estimate's own loadVehicleReferenceData uses.
      }
    });
  }
  // =====================================================================================
  // Job card: find the vehicle by Chassis No / Reg No (18.11.2026, live scan + dealer scope 21.11.2026)
  // Sources: the dealer's own chassis list, DMS sales of all dealers (api/chassis/global) and the imported service
  // history (JobCardServiceHistory) - "My dealer" (default) or "All dealers".
  // Scan: the webcam reads by itself (no capture button); only the part of the picture inside the guide box is read
  // (other numbers in view are ignored) and a number is accepted when it is the best reading in 2 of the last 3 frames.
  // A confident number is looked up AT ONCE and the job card filled; otherwise the list is shown to pick from.
  // Fill order: DMS data first (onChassisChange / applyGlobalChassisResult - unchanged), then service history fills
  // only the fields that are still empty.
  // =====================================================================================
  openServiceHistorySearch(content: any, scan = false) {
    this.shResetSearch();
    this.shScanMode = scan;
    this.shFound = '';
    this.shAllDealers = !!this.isSuperAdmin;   // "My dealer" by default; SuperAdmin has no dealer
    this.shSearchTerm = scan ? '' : (this.selectedChassis || '');
    this.shModalRef = this.modalService.open(content, { size: 'xl', centered: true, backdrop: 'static', scrollable: true });
    const cleanup = () => { this.stopCamera(); this.shModalRef = null; };
    this.shModalRef.result.then(cleanup, cleanup);
    if (this.shSearchTerm.replace(/[^A-Za-z0-9]/g, '').length >= 3) this.onShInput();
    // 24.11.2026 OCR disabled: the scan mode no longer starts the camera / OCR engine.
    // if (scan) {
    //   this.vehicleOcr.warmUp();
    //   // the modal is in the DOM on the next tick
    //   setTimeout(() => {
    //     const video = document.getElementById('sh-video') as HTMLVideoElement | null;
    //     if (video) this.startCamera(video);
    //   }, 50);
    // }
  }

  closeServiceHistorySearch() {
    this.stopCamera();
    this.shModalRef?.dismiss();
    this.shModalRef = null;
  }

  get shScope(): ShScope { return this.shAllDealers ? 'all' : 'dealer'; }

  setShScope(all: boolean) {
    if (this.isSuperAdmin && !all) return;
    this.shAllDealers = all;
    this.shCard = null;
    if ((this.shSearchTerm || '').replace(/[^A-Za-z0-9]/g, '').length >= 3) this.onShInput();
  }

  private shResetSearch() {
    clearTimeout(this.shTimer);
    this.shSuggestions = [];
    this.shCard = null;
    this.shNotFound = false;
    this.shError = '';
    this.shOcrError = '';
    this.shOcrText = '';
    this.shOcrCandidates = [];
    if (this.shPreviewUrl) { URL.revokeObjectURL(this.shPreviewUrl); this.shPreviewUrl = null; }
  }

  onShInput() {
    this.shCard = null;
    this.shNotFound = false;
    this.shError = '';
    clearTimeout(this.shTimer);
    const term = (this.shSearchTerm || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (term.length < 3) { this.shSuggestions = []; return; }
    this.shTimer = setTimeout(() => {
      this.shSuggestLoading = true;
      this.shLookup.suggest(term, this.shScope).subscribe({
        next: (res) => {
          this.shSuggestions = res || [];
          this.shSuggestLoading = false;
          this.shNotFound = this.shSuggestions.length === 0;
        },
        error: (err) => {
          this.shSuggestions = [];
          this.shSuggestLoading = false;
          this.shError = this.shHttpMessage(err);
        }
      });
    }, 300);
  }

  /** Enter in the search box: one suggestion → take it; otherwise look the typed number up directly. */
  onShEnter() {
    if (this.shSuggestions.length === 1) { this.pickShSuggestion(this.shSuggestions[0]); return; }
    const v = (this.shSearchTerm || '').trim();
    if (v.length >= 3) this.lookupScanned(v);
  }

  pickShSuggestion(s: ShSuggestion) {
    this.shSearchTerm = s.value;
    this.shSuggestions = [];
    this.loadShVehicle(s.value);
  }

  /** One vehicle → filled at once; several → shown to choose. */
  private loadShVehicle(value: string) {
    clearTimeout(this.shTimer);
    this.shLoading = true;
    this.shCard = null;
    this.shNotFound = false;
    this.shError = '';
    this.shLookup.vehicle(value, this.shScope).subscribe({
      next: (card) => {
        this.shLoading = false;
        const usable = (card?.vehicles || []).filter(v => !!v.chassisNo);
        if (usable.length === 1) { this.useServiceHistoryVehicle(usable[0]); return; }
        this.shCard = card;
        this.shNotFound = !card?.vehicles?.length;
      },
      error: (err) => {
        this.shLoading = false;
        this.shError = this.shHttpMessage(err);
      }
    });
  }

  /**
   * A scanned (or typed + Enter) number, looked up AT ONCE:
   *   1. the dealer's own chassis list (chassis or reg no.)  → onChassisChange()
   *   2. service history of this dealer (exact match)         → DMS data first, history fills the rest
   *   3. service history of all dealers                       → same
   *   4. DMS sale of any dealer (api/chassis/global)          → applyGlobalChassisResult()
   * Not found exactly → the list (all dealers) is shown with the number, to pick a close match or correct it.
   */
  async lookupScanned(raw: string) {
    const v = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length < 3) return;
    const norm = (x: any) => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.shSearchTerm = v;
    this.shLoading = true;
    try {
      const local = this.chassisList.find(x => norm(x.chassisNumber) === v || norm(x.registerNo) === v);
      if (local) {
        this.closeServiceHistorySearch();
        this.selectChassis(local);
        this.shDetailsSource = 'Your dealership – DMS';
        this.shDetailsChassis = this.selectedChassis;
        const hv = await this.exactHistory(v, 'dealer');
        if (hv) this.fillFromServiceHistory(hv);
        return;
      }
      const scopes: ShScope[] = this.isSuperAdmin ? ['all'] : ['dealer', 'all'];
      for (const scope of scopes) {
        const hv = await this.exactHistory(v, scope);
        if (hv) { this.useServiceHistoryVehicle(hv); return; }
      }
      const sale: any = await firstValueFrom(this.chassisSearchService.getGlobalChassisDetails(v)).catch(() => null);
      if (sale) {
        this.closeServiceHistorySearch();
        this.globalSaleData = sale;
        this.globalChassisSearchTerm = v;
        this.applyGlobalChassisResult();
        this.shDetailsSource = 'DMS – all dealers';
        this.shDetailsChassis = this.selectedChassis;
        return;
      }
      // not found exactly: show the list from every dealer with the number
      this.shFound = '';
      this.shAllDealers = true;
      this.onShInput();
      this.shOcrError = `"${v}" was not found exactly - pick the vehicle below or correct the number.`;
    } finally {
      this.shLoading = false;
    }
  }

  /** The one service-history vehicle whose chassis or reg no. is exactly v (null when none or several). */
  private async exactHistory(v: string, scope: ShScope): Promise<ShVehicle | null> {
    const norm = (x: any) => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const hits = await firstValueFrom(this.shLookup.suggest(v, scope)).catch(() => [] as ShSuggestion[]);
    const hit = (hits || []).find(h => norm(h.value) === v);
    if (!hit) return null;
    const card = await firstValueFrom(this.shLookup.vehicle(hit.value, scope)).catch(() => null);
    const usable = (card?.vehicles || []).filter(x => !!x.chassisNo);
    return usable.length === 1 ? usable[0] : null;
  }

  /** "Use this vehicle": fill the job card (DMS data first, then service history for empty fields). */
  useServiceHistoryVehicle(v: ShVehicle) {
    const chassis = (v?.chassisNo || '').trim();
    if (!chassis) {
      this.toaster.show('This service history record has no Chassis No, so it cannot be used for a job card.', { classname: 'bg-warning text-white', delay: 5000 });
      return;
    }
    this.closeServiceHistorySearch();
    this.selectedChassis = chassis;
    this.filteredChassisList = [];

    const local = this.chassisList.find(x => x.chassisNumber == chassis);
    if (local) {
      this.onChassisChange();
      this.shDetailsSource = 'Your dealership – DMS';
      this.fillFromServiceHistory(v);
      return;
    }

    this.loader.show();
    this.chassisSearchService.getGlobalChassisDetails(chassis).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res) {
          this.globalSaleData = res;
          this.globalChassisSearchTerm = chassis;
          this.applyGlobalChassisResult();
          this.shDetailsSource = 'DMS – all dealers';
        } else {
          this.applyHistoryOnlyVehicle(chassis);
          this.shDetailsSource = 'Service history only (not sold in DMS)';
        }
        this.fillFromServiceHistory(v);
      },
      error: () => {
        // no DMS sale record for this chassis (e.g. sold before DMS) → service history only
        this.loader.hide();
        this.applyHistoryOnlyVehicle(chassis);
        this.shDetailsSource = 'Service history only (not sold in DMS)';
        this.fillFromServiceHistory(v);
      }
    });
  }

  /** Vehicle not in DMS: clear what a previously selected vehicle left in the form, keep the usual lookups. */
  private applyHistoryOnlyVehicle(chassis: string) {
    this.invoiceNo = '';
    this.couponNo = chassis.slice(-13);
    this.inwardType = 'B2C';
    this.vehiclePrevkms = 0;
    this.customerObj.customerLedgerId = 0;
    this.customerObj.customerName = '';
    this.customerObj.customerMobile = '';
    this.customerObj.customerAltMobile = '';
    this.customerObj.saleDate = '';
    this.customerObj.nextServiceDueDate = '';
    this.customerObj.insuranceExpDate = '';
    this.modelName = '';
    this.registerNo = '';
    this.batteryCapacity = '';
    this.batteryMake = '';
    this.batteryChemestry = '';
    this.batteryNumber = '';
    this.motorNo = '';
    this.controllerNo = '';
    this.converterNo = '';
    this.chargerNumber = '';
    this.odoReading = 0;
    this.duration = 0;
    this.durationType = '';
    this.expireWarrentyDate = '';
    this.oemModelId = 0;
    this.loadServiceHistory(chassis);
    this.loadEbwInfo(chassis);
  }

  /** Fills only empty fields from the vehicle's service history (latest job with a value). */
  private fillFromServiceHistory(v: ShVehicle) {
    const jobs = v?.jobs || [];
    const pick = (key: string): string => {
      for (const j of jobs) {
        const x = j?.[key];
        if (x !== null && x !== undefined && String(x).trim() !== '') return String(x).trim();
      }
      return '';
    };
    const filled: string[] = [];
    const take = (current: any, value: string, label: string) => {
      if (current || !value) return current;
      filled.push(label);
      return value;
    };
    this.registerNo = take(this.registerNo, v.regNo || '', 'Reg No');
    this.modelName = take(this.modelName, v.model || pick('Model'), 'Model');
    this.customerObj.customerName = take(this.customerObj.customerName, pick('PartyName'), 'Customer');
    this.customerObj.customerMobile = take(this.customerObj.customerMobile, pick('MobileNumber'), 'Mobile');
    this.customerObj.saleDate = take(this.customerObj.saleDate, v.saleDate ? String(v.saleDate).split('T')[0] : '', 'Sale Date');
    this.batteryNumber = take(this.batteryNumber, pick('BatterySerialNo1'), 'Battery No');

    this.shPastJobs = jobs;
    this.shPastJobsChassis = this.selectedChassis;
    this.shDetailsChassis = this.selectedChassis;
    const kms = jobs.length ? Number(jobs[0]?.['KMS']) : NaN;
    this.shLastKms = isNaN(kms) ? null : kms;

    const msg = jobs.length
      ? `Service history: ${jobs.length} past job(s) found.` + (filled.length ? ` Filled: ${filled.join(', ')}.` : '') + ' Please verify before saving.'
      : 'Vehicle selected. No past jobs in service history.';
    this.toaster.show(msg, { classname: 'bg-success text-white', delay: 5000 });
  }

  get showShPastJobs(): boolean {
    return this.shPastJobs.length > 0 && !!this.selectedChassis && this.shPastJobsChassis === this.selectedChassis;
  }

  /** "Vehicle details fetched" card: shown while the vehicle that was scanned / searched is the selected one. */
  get showShDetails(): boolean {
    return !!this.selectedChassis && this.shDetailsChassis === this.selectedChassis;
  }

  // ---------------- live webcam scan ----------------
  // 24.11.2026 OCR disabled (startCamera) - kept commented for reference.
//   async startCamera(video: HTMLVideoElement) {
//     this.shOcrError = '';
//     if (!navigator?.mediaDevices?.getUserMedia) {
//       this.shOcrError = 'Camera is not available in this browser. Use "Upload / take photo" instead.';
//       return;
//     }
//     try {
//       this.stopCamera();
//       this.shStream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
//         audio: false
//       });
//       video.srcObject = this.shStream;
//       await video.play();
//       this.shCameraOn = true;
//       this.shScanMode = true;
//       this.runLiveLoop(video);
//     } catch (e) {
//       console.error(e);
//       this.stopCamera();
//       this.shOcrError = 'Camera permission denied or no camera found (camera needs HTTPS). Use "Upload / take photo" instead.';
//     }
//   }

  stopCamera() {
    this.shLoopId++;
    this.shStream?.getTracks().forEach(t => t.stop());
    this.shStream = null;
    this.shCameraOn = false;
    this.shLiveGuess = '';
  }

  // 24.11.2026 OCR disabled (live camera loop) - kept commented for reference.
//   /** Reads the guide-box part of the video about every 0.7 s until one number is read in 2 of the last 3 frames. */
//   private async runLiveLoop(video: HTMLVideoElement) {
//     const loopId = ++this.shLoopId;
//     const tracker = new VoteTracker(2, 3);
//     const started = Date.now();
//     this.shLiveHint = false;
//     while (loopId === this.shLoopId && this.shCameraOn) {
//       try {
//         const guide = document.getElementById('sh-guide');
//         const vr = video.getBoundingClientRect();
//         const gr = guide?.getBoundingClientRect();
//         const box = gr ? { left: gr.left - vr.left, top: gr.top - vr.top, width: gr.width, height: gr.height }
//                        : { left: 0, top: 0, width: video.clientWidth, height: video.clientHeight };
//         const canvas = this.vehicleOcr.cropVideo(video, box);
//         if (canvas) {
//           this.shOcrBusy = true;
//           const text = await this.vehicleOcr.recognizeCanvas(canvas);
//           if (loopId !== this.shLoopId) return;
//           const found = extractCandidates(text);
//           this.shLiveGuess = found[0]?.value || '';
//           const accepted = tracker.push(found);
//           if (accepted) {
//             this.shOcrBusy = false;
//             this.stopCamera();
//             if (isConfident(accepted)) {
//               // detected and read automatically → look it up and fill the job card
//               this.shFound = accepted.value;
//               await new Promise(r => setTimeout(r, 600));
//               await this.lookupScanned(accepted.value);
//             } else {
//               this.shOcrCandidates = found;
//               this.shSearchTerm = accepted.value;
//               this.shOcrError = 'Please check the number read, then press Search.';
//               this.onShInput();
//             }
//             return;
//           }
//         }
//       } catch (e) {
//         console.error(e);
//         this.shOcrError = 'OCR could not run (engine download blocked or offline). Type the number instead.';
//         this.stopCamera();
//         return;
//       } finally {
//         this.shOcrBusy = false;
//       }
//       if (Date.now() - started > 8000) this.shLiveHint = true;
//       if (Date.now() - started > 40000) {
//         this.stopCamera();
//         this.shOcrError = 'No chassis or registration number could be read. Scan again - closer, in good light - or type it.';
//         return;
//       }
//       await new Promise(r => setTimeout(r, 700));
//     }
//   }

  // 24.11.2026 OCR disabled (photo upload / runOcr / matchOcrCandidates) - kept commented for reference.
//   // ---------------- photo (upload / phone camera app) ----------------
//   onShPhoto(event: Event) {
//     const input = event.target as HTMLInputElement;
//     const file = input.files?.[0];
//     input.value = '';
//     if (!file) return;
//     if (!file.type.startsWith('image/')) {
//       this.shOcrError = 'Please choose an image (photo of the number plate, chassis sticker or RC).';
//       return;
//     }
//     this.runOcr(file);
//   }

//   private async runOcr(image: Blob) {
//     this.stopCamera();
//     this.shResetSearch();
//     this.shOcrBusy = true;
//     this.shPreviewUrl = URL.createObjectURL(image);
//     try {
//       const text = await this.vehicleOcr.recognize(image);
//       this.shOcrText = (text || '').trim();
//       this.shOcrCandidates = extractCandidates(text);
//       if (!this.shOcrCandidates.length) {
//         this.shOcrError = 'No Chassis No / Reg No could be read. Retake the photo closer and straight, in good light, or type the number.';
//         return;
//       }
//       const best = this.shOcrCandidates[0];
//       if (isConfident(best)) { await this.lookupScanned(best.value); return; }
//       await this.matchOcrCandidates();
//     } catch (e) {
//       console.error(e);
//       this.shOcrError = 'OCR could not run (engine download blocked or offline). Type the number instead.';
//     } finally {
//       this.shOcrBusy = false;
//     }
//   }

//   /**
//    * An unsure photo read can have a wrong character, so each read is matched against the service history by prefix
//    * (full read, then first 10 / 7 characters) and ranked by how many characters differ.
//    */
//   private async matchOcrCandidates() {
//     const best = new Map<string, ShSuggestion & { ocrDistance?: number }>();
//     for (const c of this.shOcrCandidates.slice(0, 3)) {
//       const lens = [...new Set([c.value.length, 10, 7])].filter(l => l >= 5 && l <= c.value.length);
//       const allowed = Math.max(1, Math.floor(c.value.length * 0.2));
//       for (const len of lens) {
//         let res: ShSuggestion[] = [];
//         try { res = await firstValueFrom(this.shLookup.suggest(c.value.slice(0, len), 'all')); } catch { res = []; }
//         let hit = false;
//         for (const s of res || []) {
//           const d = editDistance((s.value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), c.value);
//           if (d > allowed) continue;
//           hit = true;
//           const prev = best.get(s.value);
//           if (!prev || (prev.ocrDistance ?? 99) > d) best.set(s.value, { ...s, ocrDistance: d });
//         }
//         if (hit) break;
//       }
//     }
//     const list = [...best.values()].sort((a, b) => (a.ocrDistance! - b.ocrDistance!) || (b.jobs - a.jobs));
//     this.shSearchTerm = list[0]?.value || this.shOcrCandidates[0].value;
//     this.shSuggestions = list;
//     if (!list.length) {
//       this.shOcrError = `Read "${this.shOcrCandidates.map(x => x.value).join('", "')}" but no such vehicle is in service history. Correct the number below if it was misread.`;
//     }
//   }

  private shHttpMessage(err: any): string {
    if (err?.status === 0) return 'Server not reachable. Check the network.';
    if (err?.status === 401) return 'Session expired. Please log in again.';
    return err?.error?.message || 'Could not read service history. Please try again.';
  }

  ngOnDestroy(): void {
    clearTimeout(this.shTimer);
    this.stopCamera();
    if (this.shPreviewUrl) URL.revokeObjectURL(this.shPreviewUrl);
    JobcardPhotoService.release(this.pendingPhotos);   // 25.11.2026
    // this.vehicleOcr.dispose();   // 24.11.2026 OCR disabled
  }
  onCancelClick() {
    this.router.navigate(['/job-card']);
  }

}