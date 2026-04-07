import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobType } from '../../../../constant';
import { StorageService } from '../../../../core/services/storage';
import { ReceiptEntryService } from '../../../../core/services/receipt-entry-service';
import { LocationName } from '../../../../ViewModels/ReceiptEntryModel';
import { JobCardService } from '../../../../core/services/job-card-service';

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
  serviceHeadList: any[] = [];
  serviceTypeList: any[] = [];

  selectedJobtype: any;
  selectedServiceHead: any;
  selectedServiceType: any;

  isOpen: any = {
    job: true,
    battery: false,
    voice: false,
    comments: false,
    labour: false,
    affectedparts: false,
    insurance: false
  };

  locations: LocationName[];
  selectedLocation: string = '';

  constructor(private storageService: StorageService,
    private receiptEntryService: ReceiptEntryService,
    private jobCardService: JobCardService) { }

  ngOnInit(): void {
    this.fetchLocations();
    this.loadJobTypes();
  }

  //Fetech Dealer Location
  fetchLocations(): void {
    const dealerCode = this.storageService.getDealerCode();
    this.receiptEntryService.getLocationList(dealerCode).subscribe({
      next: (data: LocationName[]) => {
        this.locations = data;
        // console.log("location data",data)
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  // load job type 
  loadJobTypes() {
    this.selectedJobtype='';
    this.jobCardService.getJobType().subscribe({
      next: (res) => {
        console.log(res);

        this.jobTypeList = res.map((x: any) => ({
          jobTypeId: x.jobTypeId, //  ID add karo
          jobtypeName: (x.jobtypeName || '').trim() //  name clean
        }));

      },
      error: (err) => {
        console.error('Error fetching job types', err);
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
  onJobType(event: any) {
    const jobTypeId = this.selectedJobtype;

    this.jobCardService.getServiceHead(jobTypeId).subscribe(res => {
      this.serviceHeadList = res;

      // reset next dropdowns
      
      this.selectedServiceHead = '';
      this.serviceTypeList = [];
    });
  }
  onServiceHeadChange() {
    const serviceHeadId = this.selectedServiceHead;

    this.jobCardService.getServiceType(serviceHeadId).subscribe(res => {
      this.serviceTypeList = res;

      this.selectedServiceType = '';
    });
  }
  onServiceTypeChange(){
    this.selectedServiceType='';
  }
}

