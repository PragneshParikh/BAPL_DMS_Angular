import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType, locationAreaMaster } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { ReceiptEntryService } from '../../../../core/services/receipt-entry-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../../../core/services/job-card-service';
import { selectLeadData } from '../../../../store/CRM/crm_selector';

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


  selectedJobtype: any;
  selectedJobSources: any;
  selectedServiceHead: any;
  selectedServiceType: any;
  selectedLocation: string = '';
  selectedChassis: string = '';
  invoiceNo: string = '';
  couponNo: string = '';
  batteryNumber: string = '';
  batteryCapacity: string = '';
  batteryChemestry: string = '';
  batteryMake: string = '';
  chargerNumber: string = '';
  controllerNo: string = '';
  converterNo : string = '';
  motorNo : string = '';



  isOpen: any = {
    job: true,
    battery: false,
    voice: false,
    comments: false,
    labour: false,
    affectedparts: false,
    insurance: false
  };

  constructor(private storageService: StorageService,
    private receiptEntryService: ReceiptEntryService,
    private jobCardService: JobCardService) { }

  ngOnInit(): void {
    this.fetchLocations();
    this.loadJobTypes();
    this.loadChassisList();
    this.loadJobSorces();
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
      this.batteryCapacity='';
      this.batteryChemestry='';
      this.batteryMake='';
      this.batteryNumber='';
      this.chargerNumber='',
      this.controllerNo='',
      this.converterNo='',
      this.motorNo=''
      return;
    }
    const selected = this.chassisList.find(
      x => x.chassisNumber === this.selectedChassis
    );
    if (selected) {
      this.invoiceNo = selected.invoiceNo;
      this.couponNo = this.selectedChassis.slice(-13);
      this.batteryCapacity = selected.batteryCapacity;
      this.batteryMake=selected.batteryMake
      this.batteryChemestry=selected.batteryChemestry
      this.batteryNumber=selected.batteryNumber
      this.motorNo=selected.motorNo
      this.controllerNo=selected.controllerNo
      this.converterNo=selected.converterNo
      this.chargerNumber=selected.chargerNumber
    }
  }

  onJobSource() {
    this.selectedJobSources = '';
  }
}

