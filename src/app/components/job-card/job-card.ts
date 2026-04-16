import { Component } from '@angular/core';
import { publicDecrypt } from 'crypto';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobType, JobSource } from '../../constant';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { JobCardService } from '../../core/services/job-card-service';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './job-card.html',
  styleUrl: './job-card.scss',
})
export class JobCard {
  JobType = JobType;
  JobSource = JobSource;
  locations: LocationName[];
  //dropdown changes
  selectedLocation: string = '';
  selectedJobtype: string = '';
  selectedJobSource: string = '';
  selectedComplaints: string = '';
  selectedViewJobs: string = '';
  selectedChassis: string = '';

  //Pagination
  page = 1;
  pageSize = 10;
  collectionSize: number = 0;
  pagedData: any[] = [];
  filteredData: any[] = [];
  serviceTypeList: any;
  selectedServiceType: string;
  chassisList: any[] = [];;
  

  constructor(private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private jobCardService : JobCardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchLocations();
    this.loadChassisList();
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

  //load chassis number
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
    this.selectedChassis ='';
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
  //Navigate Job Card Add form
  onNavigate() {
    this.router.navigate(['/job-card-addForm', 'test']);
  }
}
