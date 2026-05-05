import { Component } from '@angular/core';
import { publicDecrypt } from 'crypto';
import { ReceiptEntryService } from '../../core/services/receipt-entry-service';
import { StorageService } from '../../core/services/storage';
import { LocationName } from '../../ViewModels/ReceiptEntryModel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobType, JobSource, userRole } from '../../constant';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { JobCardService } from '../../core/services/job-card-service';
import Swal from 'sweetalert2';
import { JobCardSearchModel } from '../../ViewModels/JobCardViewModel';

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


  constructor(private receiptEntryService: ReceiptEntryService,
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

    this.setUserRole();
    this.fetchLocations();
    this.loadChassisList();
    this.loadJobCardList();
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


  // load Chassis number
  loadChassisList() {
    const dealerCode = this.storageService.getDealerCode();
    this.jobTypeId = this.selectedJobtype;
    this.jobCardService.getAllInspectedChassis(dealerCode,this.jobTypeId).subscribe({
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

  loadJobCardList() {
    // this.lodder = true;
    const dealerCode = this.storageService.getDealerCode();

    this.jobCardService.getJobCardList(dealerCode).subscribe({
      next: (res) => {
        this.jobCardList = res;
        console.log("listing : ", res)
        // this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching job cards', err);
        // this.loading = false;
      }
    });
  }

  onEdit(row: any) {
    this.router.navigate(['/job-card-addForm/job-card-add-form'], {
      state: { data: row }
    });
  }

  deleteJobCard(id: number) {

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

    const payload = {
      dealerCode: this.storageService.getDealerCode(),
      fromDate: this.searchModel.fromDate || null,
      toDate: this.searchModel.toDate || null,
      serviceLocation: this.searchModel.serviceLocation || null,
      jobNo: this.searchModel.jobNo ? Number(this.searchModel.jobNo) : null,
      customerName: this.searchModel.customerName || null,
      chassisNo: this.searchModel.chassisNo || null
    };

    this.jobCardService.searchJobCard(payload).subscribe(res => {
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

  //Navigate Job Card Add form
  onNavigate() {
    this.router.navigate(['/job-card-addForm', 'test']);
  }
}
