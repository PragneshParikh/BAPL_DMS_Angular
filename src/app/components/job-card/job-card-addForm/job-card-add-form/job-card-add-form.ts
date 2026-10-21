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
import { PrefixService } from '../../../../core/services/prefix';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { MenuAccessService } from '../../../../core/services/menu-access.service';
import { ChassisSearchService } from '../../../../core/services/chassis-search-service';
@Component({
  selector: 'app-job-card-add-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDropdownModule],
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
  inwardType: string = '';
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

  // ===== Global chassis search (modal) — logic reused from ebw-invoice.ts,
  // presented as a modal via NgbModal rather than an inline collapsible box =====
  globalChassisSearchTerm: string = '';
  globalSaleData: any = null;
  globalSearchNotFound: boolean = false;
  globalSearching: boolean = false;
  private globalSearchModalRef: any = null;

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
    insurance: false
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
    private http: HttpClient,
    private prefixService: PrefixService,
    public toastr: ToastService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private ebwInvoiceService: EbwInvoiceService,
    private menuAccess: MenuAccessService,
    private chassisSearchService: ChassisSearchService,
    private toaster: ToastService) { }

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
        this.complaintMasterList = res;

      }
    });
  }

  filterChassis() {
    const value = (this.selectedChassis || '').toLowerCase();

    this.filteredChassisList = this.chassisList
      .filter(x =>
        x.chassisNumber?.toLowerCase().includes(value)
      )
      .slice(0, 10);
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

  openGlobalChassisSearch(content: any) {
    this.globalChassisSearchTerm = this.selectedChassis || '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;

    this.globalSearchModalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  closeGlobalSearchModal() {
    this.globalSearchModalRef?.dismiss();
    this.globalSearchModalRef = null;
    this.globalChassisSearchTerm = '';
    this.globalSaleData = null;
    this.globalSearchNotFound = false;
  }

  searchGlobalChassis() {
    if (!this.globalChassisSearchTerm) {
      this.toaster.show('Enter a Chassis No to search.', { classname: 'bg-warning text-white', delay: 4000 });
      return;
    }

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
    this.inwardType = data.inwardType || '';
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

    const value = event.target.value?.trim().toLowerCase();

    // User ne typing start ki -> previous selection invalid
    this.complaintObj.complaintId = 0;

    if (!value) {
      this.filteredComplaints = [];
      this.showComplaintDropdown = false;
      return;
    }

    this.filteredComplaints = this.complaintMasterList.filter(x =>
      x.complaintName?.toLowerCase().includes(value)
    );

    this.showComplaintDropdown = this.filteredComplaints.length > 0;
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

  loadChassisList() {

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }
    this.jobTypeId = this.selectedJobtype

    this.jobCardService.getAllInspectedChassis(this.dealerCode, this.jobTypeId).subscribe(res => {
      this.chassisList = res;
      //console.log("Chassislist bind", this.chassisList);

      if (this.isEditMode && this.chassiseditData) {
        this.customerObj.saleDate = this.chassisList[0].saleDate?.split('T')[0];
        this.customerObj.insuranceExpDate = this.chassisList[0].insuranceExpDate?.split('T')[0];
        this.customerObj.nextServiceDueDate = this.chassisList[0].nextserviceDueDate?.split('T')[0];
        this.selectedChassis = this.chassiseditData.jobCardHeader.chassisno;

        setTimeout(() => {
          this.onChassisChange();
        }, 0);
      }

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


  onJobType(isEdit = false, isFromEstimate: boolean = false) {
    if (!this.selectedJobtype) return;

    // FIXED: this method never branched on isSuperAdmin like every other
    // chassis/location loader in this component does (fetchLocations,
    // loadChassisList). It always sent the logged-in user's own dealerCode,
    // so even a true SuperAdmin session got scoped to their own dealer and
    // never saw other dealers' chassis (e.g. isSuperAdmin bypass in
    // GetAllInspectedLotChassisAsync's "isSuperAdmin || v.DealerId == dealerCode"
    // check never actually triggered because dealerCode was never null here).
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }

    // Load chassis
    this.jobCardService
      .getAllInspectedChassis(this.dealerCode, this.selectedJobtype)
      .subscribe(res => {
        this.chassisList = res;
      });

    // Load service heads
    this.jobCardService
      .getServiceHead(this.selectedJobtype)
      .subscribe((res: any[]) => {

        this.serviceHeadList = res;

        // EDIT MODE
        if (isEdit) {

          this.selectedServiceHead =
            this.chassiseditData.jobCardHeader.servicehead;

          this.loadServiceType(this.selectedServiceHead, true);

          return;
        }

        // FIXED: same missing branch here — this second dealerCode
        // assignment (used for the chassis reload just below) also ignored
        // isSuperAdmin.
        if (!this.isSuperAdmin) {
          this.dealerCode = this.storageService.getDealerCode();
        } else {
          this.dealerCode = null;
        }

        // Load chassis
        this.jobCardService
          .getAllInspectedChassis(this.dealerCode, this.selectedJobtype)
          .subscribe(res => {
            this.chassisList = res;

            if (isFromEstimate && this.fromEstimateData?.chassisNo) {
              const match = this.chassisList.find(
                x => x.chassisNumber == this.fromEstimateData.chassisNo
              );

              if (match) {
                // Found in the inspected-lot list — reuse the normal path so we
                // get full battery/motor/warranty data, same as edit mode.
                this.selectedChassis = this.fromEstimateData.chassisNo;
                this.onChassisChange();
              } else {
                // Estimate chassis isn't in this dealer's inspected-lot list
                // (e.g. a walk-in) — fall back to what Estimate already resolved.
                this.applyEstimateVehicleFallback();
              }
            }
          });

        // Load service heads
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
    this.inwardType = selected.inwardType;
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

    if (!this.complaintObj.customerVoice || !this.complaintObj.complaint) {
      Swal.fire({
        icon: 'error',
        title: 'Validation',
        text: 'Please fill required fields',
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

    this.complaintList.push({ ...this.complaintObj });

    // Reset fields
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
    if (!this.isSuperAdmin && this.vehicleKms < this.vehiclePrevkms) {
        this.kmsError =
          `Vehicle KM cannot be less than Previous KM (${this.vehiclePrevkms})`;
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
      this.complaintObj.complaint?.trim()
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
    apiCall.subscribe({
      next: (res: any) => {
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
    this.selectedLocation = data.jobCardHeader.serviceloc;

    this.couponNo = data.jobCardHeader.couponno;
    this.inwardType = data.jobCardHeader.inwardType;
    this.inwardType = data.jobCardHeader.inwardType;
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

    if (!this.isSuperAdmin && this.vehicleKms && this.vehiclePrevkms &&
      this.vehicleKms < this.vehiclePrevkms) {

      this.kmsError = `Vehicle KM cannot be less than Previous KM (${this.vehiclePrevkms})`;
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
    this.inwardType = '';
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
  onCancelClick() {
    this.router.navigate(['/job-card']);
  }

}