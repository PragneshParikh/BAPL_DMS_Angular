import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import { SharedModule } from '../../shared/shared.module';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-job-search',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, NgbPaginationModule],
  templateUrl: './job-search.html',
  styleUrl: './job-search.scss',
})
export class JobSearch {
  @Input() sourceType: string;

  jobList: any[] = [];

  formData = {
    jobNo: null,
    manualJobNo: null,
    dateFrom: null,
    dateTo: null,
    registerNo: '',
    chassisNo: ''
  };

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean = false;
  dealerCode: string = '';

  constructor(
    private activeModal: NgbActiveModal,
    private loader: LoaderService,
    private toast: ToastService,
    private jobCardService: JobCardService,
    private storageService: StorageService
  ) {

    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }

    this.formData = {
      jobNo: null,
      manualJobNo: null,
      dateFrom: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      registerNo: '',
      chassisNo: ''
    };
  }

  onSubmit(form: any) {
    // Logic to handle job search form submission 
  }

  close(result: any) {
    this.activeModal.dismiss("closed");
  }

  backToList() {
    // Logic to navigate back to the job list or previous page
  }

  onPageChange(page: number) {
    this.page = page;
    this.onSearchJob();
  }

  onSearchJob() {
    const fromDate = this.formData.dateFrom;
    const toDate = this.formData.dateTo;
    const jobNo = this.formData.jobNo;
    const manualJobNo = this.formData.manualJobNo;
    const pageIndex = this.page;
    const pageSize = this.pageSize;

    this.loader.show();

    if (this.sourceType === 'material-transfer') {
      this.jobCardService.getOpenJobCardDataByPaged(fromDate, toDate, jobNo, manualJobNo, pageIndex, pageSize, false, this.dealerCode).subscribe({
        next: (res) => {
          this.jobList = res.data;
          this.collectionSize = res.totalRecords;
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    } else {
      this.jobCardService.getFilterdDataByPaged(fromDate, toDate, jobNo, manualJobNo, pageIndex, pageSize).subscribe({
        next: (res) => {
          this.jobList = res.data;
          this.collectionSize = res.totalRecords;
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    }
  }

  onSelectJobType(selectedRow: any) {
    this.activeModal.close({ isAccepted: true, 'jobDetail': selectedRow });
  }

  reset() {
    this.formData = {
      jobNo: null,
      manualJobNo: null,
      dateFrom: null,
      dateTo: null,
      registerNo: '',
      chassisNo: ''
    };
  }

}