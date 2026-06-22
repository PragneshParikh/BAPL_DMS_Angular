import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType, locationAreaMaster } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../../../core/services/job-card-service';
import { selectLeadData } from '../../../../store/CRM/crm_selector';
import { NgbModal, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { icons } from '../../../../core/data';
import { Console, error, info } from 'console';
import { constrainedMemory, title } from 'process';
import { text } from 'stream/consumers';
import { Route, Router } from '@angular/router';
import { ToastService } from '../../../../shared/toaster/toast-service';
import { delay } from 'lodash';
import { LoaderService } from '../../../../core/services/loader';
import { LocationMasterService } from '../../../../core/services/location-master-service';
import { ComplaintmasterService } from '../../../../core/services/complaintmaster-service';
import { PrefixService } from '../../../../core/services/prefix';

@Component({
  selector: 'app-job-card-add-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-card-add-form.html',
  styleUrl: './job-card-add-form.scss',
})
export class JobCardAddForm {
  // job related dropdown binding
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

  selectedJobtype: any;
  selectedJobSources: any;
  selectedServiceHead: any;
  selectedServiceType: any;
  selectedLocation: string = '';
  selectedChassis: string = '';
  invoiceNo: string = '';
  couponNo: string = '';
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


  constructor(private storageService: StorageService,
    private locationService: LocationMasterService,
    private router: Router,
    private jobCardService: JobCardService,
    private complaintMasterService: ComplaintmasterService,
    private prefixService: PrefixService,
    public toastr: ToastService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toaster: ToastService) { }

  ngOnInit(): void {
    console.log('Date :', new Date().toISOString().split('T')[0]);
    this.dealerCode = this.storageService.getDealerCode();
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
        this.jobNo = Number(res.split('/').pop());
      }, error: (err) => {
        this.loader.hide();
        console.log(err);

      }
    })
  }
  get isBatteryReadOnly(): boolean {
    return this.selectedJobtype == 1;
  }
  //Fetech Dealer Location
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.locationService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop (id = 2)
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
    console.log("complaintmaster", item)
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

          //  IMPORTANT FIX
          this.onJobType(true);
        }
      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }
  loadServiceHistory(chassisNo: string) {

    this.jobCardService.getJobCardServiceHistory(chassisNo).subscribe({
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
    //debugger
    const dealerCode = this.storageService.getDealerCode();
    this.jobTypeId = this.selectedJobtype

    this.jobCardService.getAllInspectedChassis(dealerCode, this.jobTypeId).subscribe(res => {
      this.chassisList = res;
      console.log("AddloadingChassisdetails", this.chassisList)
      if (this.isEditMode && this.chassiseditData) {
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
      console.log("pdichecklist", this.pdiCheckList)
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


  onJobType(isEdit = false) {

    if (!this.selectedJobtype) return;

    const dealerCode = this.storageService.getDealerCode();

    // Load chassis
    this.jobCardService
      .getAllInspectedChassis(dealerCode, this.selectedJobtype)
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

        // ADD MODE
        if (this.serviceHeadList.length > 0) {

          // auto select first service head
          this.selectedServiceHead =
            this.serviceHeadList[0].serviceHeadId;

          // auto load service type
          this.loadServiceType(this.selectedServiceHead);

        }
        else {

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

    if (!this.selectedChassis) return;
    this.loadServiceHistory(this.selectedChassis);

    const selected = this.chassisList.find(
      x => x.chassisNumber == this.selectedChassis
      //  use ==
    );

    if (!selected) return;

    // ALWAYS FILL (EDIT + ADD)
    this.invoiceNo = selected.invoiceNo;
    this.couponNo = this.selectedChassis.slice(-13);
    this.customerObj.customerLedgerId = selected.customerLedgerId;
    this.customerObj.customerName = selected.customerName;
    this.customerObj.customerMobile = selected.customerMobile;
    this.customerObj.customerAltMobile = selected.customerAltMobile;

    this.modelName = selected.modelName;
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
  savePdi() {

    this.pdiCheckList = this.pdiCheckList.map(x => ({
      ...x,
      isStatus: x.isStatus === true,
      remarks: x.remarks || ''
    }));

    console.log("Save PDIChecklist", this.pdiCheckList)
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
  saveJobCard() {
    debugger
    //  VALIDATION (recommended)
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

    //  HEADER
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
      jobprefix: this.jobPrefix,
      jobinDate: this.jobInDate || null,
      jobinTime: this.jobInTime || null,
      jobNo: Number(this.jobNo) || 0,
      manualjobNo: Number(this.manualJobNo) || 0,
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

    // BATTERY
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

    //  CUSTOMER
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

    //  COMPLAINT
    const jobCardComplaint = this.complaintList.map(x => ({
      id: x.id || 0,
      dealerCode: dealerCode,
      customerVoice: x.customerVoice,
      complaintCode: x.complaintCode,
      complaint: x.complaint,
      createdBy: userId,
      updatedBy: userId
    }));

    //  PDI (USE STORED DATA )

    const JobCardpdiChecklist = this.pdiCheckList.map(x => ({

      pdichecklistMasterId: x.id,
      oemModelId: x.oemModelId,
      isStatus: x.isStatus,   // use normalized value
      remarks: x.remarks,
      createdBy: userId,
      updatedBy: userId
    }));
    //  FINAL PAYLOAD
    const payload = {
      jobCardHeader,
      jobCardBattery,
      jobCardCustomer,
      jobCardComplaint,
      pdiChecklistChassiWise: JobCardpdiChecklist
    };

    //  API CALL
    const apiCall = this.isEditMode
      ? this.jobCardService.updateJobCard(payload)
      : this.jobCardService.insertJobCard(payload);

    this.loader.show();
    apiCall.subscribe({
      next: (res: any) => {
        this.toastr.show(`${this.isEditMode ? 'Updated' : 'Saved'} Successfully`, { classname: 'bg-success text-white', delay: 5000 });
        this.resetForm();
        this.router.navigate(['/job-card']);
        this.isEditMode = false;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toastr.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  // edit jobcard
  patchEditData(data: any) {

    // ================= HEADER =================
    this.selectedJobtype = data.jobCardHeader.jobtype;
    this.selectedServiceHead = data.jobCardHeader.servicehead;
    this.selectedServiceType = data.jobCardHeader.servicetype;
    this.selectedJobSources = data.jobCardHeader.jobSource;

    this.selectedChassis = data.jobCardHeader.chassisno;
    this.vehicleKms = data.jobCardHeader.vehiclekms;
    this.selectedLocation = data.jobCardHeader.serviceloc;

    this.couponNo = data.jobCardHeader.couponno;
    this.jobPrefix = data.jobCardHeader.jobprefix;
    this.jobInDate = data.jobCardHeader.jobinDate;
    this.jobInTime = data.jobCardHeader.jobinTime;
    this.jobNo = data.jobCardHeader.jobNo;
    this.manualJobNo = data.jobCardHeader.manualjobNo;
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
    this.vehicleKms = 0;
    this.jobPrefix = '';
    this.jobInDate = '';
    this.jobInTime = '';
    this.jobNo = 0;
    this.manualJobNo = 0;
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

}