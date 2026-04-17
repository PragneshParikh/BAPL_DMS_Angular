import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType, locationAreaMaster } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { ReceiptEntryService } from '../../../../core/services/receipt-entry-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../../../core/services/job-card-service';
import { selectLeadData } from '../../../../store/CRM/crm_selector';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { icons } from '../../../../core/data';
import { Console, info } from 'console';
import { title } from 'process';
import { text } from 'stream/consumers';

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
  jobPrefix: '';
  jobInDate: '';
  jobInTime: '';
  jobNo: number = 0;
  manualJobNo: number = 0;
  estDelDate: '';
  estDelTime: '';
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
  odoReading: number=0.0;
  duration : number=0.0;
  durationType: string='';
  expireWarrentyDate:string='';
   

  chargerMake: string = '';
  batteryVoltage: string = '';
  capacityAH: string = '';
  batteryDischarge: string = '';
  batteryCCV: string = '';
  batteryOCV: string = '';
  isPdiModalOpen = false;



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
    complaint: ''
  };
  isPdiSaved = false;



  constructor(private storageService: StorageService,
    private receiptEntryService: ReceiptEntryService,
    private jobCardService: JobCardService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.fetchLocations();
    this.loadJobTypes();
    this.loadChassisList();
    this.loadJobSorces();
    this.loadPdiData();
  }

  //Fetech Dealer Location
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: any[]) => {
        // only Workshop (id = 2)
        this.locations = data.filter(x => x.locareadidNo === 2);
        //console.log("Workshop Locations", this.locations);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  // load job type 
  loadJobTypes() {
    this.selectedJobtype = '';
    this.jobCardService.getJobType().subscribe({
      next: (res) => {
        console.log(res);

        this.jobTypeList = res.map((x: any) => ({
          jobTypeId: x.jobTypeId,
          jobtypeName: (x.jobtypeName || '').trim()
        }));

      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }
  //load job Source 
  loadJobSorces() {
    this.selectedJobSources = '';
    this.jobCardService.getJobSource().subscribe({
      next: (res) => {
        console.log(res);

        this.jobSourceList = res.map((x: any) => ({
          jobSourceId: x.jobSourceId,
          jobSourceName: (x.jobSourceName || '').trim()
        }));

      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }
  // load Chassis number
  loadChassisList() {
    const dealerCode = this.storageService.getDealerCode();
    this.jobCardService.getAllInspectedChassis(dealerCode).subscribe({
      next: (res: any) => {
        console.log(res);

        // a duplicate chassis no remove (optional)
        this.chassisList = res;
      },
      error: (err) => {
        console.error('Error fetching chassis', err);
      }
    });
  }

  // load pdi checklist
  loadPdiData() {
    this.jobCardService.getPdiChecklist().subscribe({
      next: (res) => {
        this.pdiCheckList = res;   //  HERE
        console.log(this.pdiCheckList);
      },
      error: (err) => {
        console.error(err);
      }
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

    console.log('Selected Location:', this.selectedLocation);
  }
  onJobType() {

    const jobTypeId = this.selectedJobtype;

    this.jobCardService.getServiceHead(jobTypeId).subscribe(res => {
      this.serviceHeadList = res;

      // Reset
      this.selectedServiceHead = '';
      this.serviceTypeList = [];
      this.selectedServiceType = '';

      //  AUTO SELECT if only 1
      if (this.serviceHeadList.length === 1) {
        this.selectedServiceHead = this.serviceHeadList[0].serviceHeadId;

        // directly load service type
        this.loadServiceType(this.selectedServiceHead);
      }
    });
  }
  onServiceHeadChange() {
    this.loadServiceType(this.selectedServiceHead);
  }
  loadServiceType(serviceHeadId: number) {
    this.jobCardService.getServiceType(serviceHeadId).subscribe(res => {
      this.serviceTypeList = res;

      this.selectedServiceType = '';

      //  AUTO SELECT if only 1
      if (this.serviceTypeList.length === 1) {
        this.selectedServiceType = this.serviceTypeList[0].serviceTypeId;
      }
    });
  }
  onServiceTypeChange() {
    this.selectedServiceType = '';
  }

  onChassisChange() {
    if (!this.selectedChassis || this.selectedChassis === '') {
      this.invoiceNo = '';
      this.couponNo = '';
      this.customerObj.customerName = '';
      this.customerObj.customerMobile = '';
      this.customerObj.customerAltMobile = '';
      this.modelName = '';
      this.registerNo = '';
      this.batteryCapacity = '';
      this.batteryChemestry = '';
      this.batteryMake = '';
      this.batteryNumber = '';
      this.chargerNumber = '',
        this.controllerNo = '',
        this.converterNo = '',
        this.motorNo = '',
        this.odoReading =0.00,
        this.duration =0.00,
        this.durationType='',
        this.expireWarrentyDate = ''
      return;
    }
    const selected = this.chassisList.find(
      x => x.chassisNumber === this.selectedChassis
    );
    if (selected) {
      this.invoiceNo = selected.invoiceNo;
      this.couponNo = this.selectedChassis.slice(-13);
      this.customerObj.customerName = selected.customerName;
      this.customerObj.customerMobile = selected.customerMobile;
      this.customerObj.customerAltMobile = selected.customerAltMobile;
      this.modelName = selected.modelName;
      this.registerNo = selected.registerNo;
      this.batteryCapacity = selected.batteryCapacity;
      this.batteryMake = selected.batteryMake
      this.batteryChemestry = selected.batteryChemestry
      this.batteryNumber = selected.batteryNumber
      this.motorNo = selected.motorNo
      this.controllerNo = selected.controllerNo
      this.converterNo = selected.converterNo
      this.chargerNumber = selected.chargerNumber
      this.odoReading = selected.odoReading
      this.duration = selected.duration
      this.durationType =selected.durationType
      this.expireWarrentyDate=selected.expireWarrentyDate
    }
  }

  // onJobSource() {
  //   const jobSourceId=this.selectedJobSources
  //   this.selectedJobSources = '';
  // }

  // PDiChecklist popup
  openPdiModal(content: any) {

    if (!this.selectedChassis || this.selectedChassis.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: '',
        text: 'Please select chassis number before opening PDI checklist',
        width: '300px'
      });
      return;
    }

    this.pdiCheckList = this.pdiCheckList.map(x => ({
      ...x,
      isStatus: true,
      remarks: ''
    }));

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
    if (!this.validatePdi()) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Checklist',
        text: 'Please complete all PDI items before closing',
        width: '300px'
      });
      return;
    }

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

    this.complaintList.push({ ...this.complaintObj });

    // Reset fields
    this.complaintObj = {
      customerVoice: '',
      complaintCode: '',
      complaint: ''
    };
  }
  deleteComplaint(index: number) {
    this.complaintList.splice(index, 1);
  }
  savePdi() {
    debugger;
    console.log("pdiCheckList", this.pdiCheckList)
    this.pdiCheckList = this.pdiCheckList.map(x => ({
      ...x,
      isStatus: x.isStatus === true,   // normalize
      remarks: x.remarks || ''
    }));

    console.log("PDI Stored Locally", this.pdiCheckList);

    this.isPdiSaved = true; // optional flag

    this.modalService.dismissAll();
  }
  saveJobCard() {

    //  VALIDATION (recommended)
    if (!this.isPdiSaved) {
      Swal.fire('Error', 'Please complete PDI first', 'error');
      return;
    }
const dealerCode = this.storageService.getDealerCode();
    //  HEADER
    const jobCardHeader = {
      jobtype: this.selectedJobtype || 0,
      dealerCode : dealerCode,
      invoiceNo:this.invoiceNo,
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
      createdBy: 'Admin'
    };

    // BATTERY
    const jobCardBattery = {
      dealerCode : dealerCode,
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
      createdBy: 'Admin'
    };

    //  CUSTOMER
    const jobCardCustomer = {
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

      createdBy: 'Admin'
    };

    //  COMPLAINT
    const jobCardComplaint = this.complaintList.map(x => ({
      dealerCode : dealerCode,
      customerVoice: x.customerVoice,
      complaintCode: x.complaintCode,
      complaint: x.complaint,
      createdBy: 'Admin'
    }));

    //  PDI (USE STORED DATA )

    const JobCardpdiChecklist = this.pdiCheckList.map(x => ({

      pdichecklistMasterId: x.id,
      isStatus: x.isStatus,   // use normalized value
      remarks: x.remarks,
      createdBy: 'Admin'
    }));
    console.log("in save methodthis.pdiCheckList", JobCardpdiChecklist)
    //  FINAL PAYLOAD
    const payload = {
      
        jobCardHeader,
        jobCardBattery,
        jobCardCustomer,
        jobCardComplaint,
        pdiChecklistChassiWise : JobCardpdiChecklist
    };

    console.log("FINAL PAYLOAD", payload);

    //  API CALL
    this.jobCardService.insertJobCard(payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Saved Successfully',
          text: 'Job Card Created',
          width: '500px'
        });

        console.log("Inserted JobCard ID:", res);

        this.resetForm();
      },
      error: (err) => {
        console.error("ERROR", err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Something went wrong',
          width: '300px'
        });
      }
    });
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
    complaint: ''
  };

  // PDI
  this.isPdiSaved = false;

  // IMPORTANT: reload PDI checklist (not empty)
  this.loadPdiData();
  }
}

