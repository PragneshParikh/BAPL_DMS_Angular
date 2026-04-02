import { Component } from '@angular/core';
import { publicDecrypt } from 'crypto';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobType,JobSource } from '../../constant';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router,RouterModule } from '@angular/router';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule,NgbPaginationModule, NgbTooltipModule],
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

  //Pagination
  page = 1;
  pageSize = 10;
  collectionSize: number = 0;
  pagedData: any[] = [];
  filteredData: any[] = [];


  constructor(private receiptEntryService: ReceiptEntryService,
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchLocations();
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
    debugger
    this.router.navigate(['/job-card-addForm', 'test']);
  }
}
