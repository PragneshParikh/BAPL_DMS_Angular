import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-job-search',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, NgbPaginationModule],
  templateUrl: './job-search.html',
  styleUrl: './job-search.scss',
})
export class JobSearch {
  jobList: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  constructor(
    private activeModal: NgbActiveModal,
    private loader: LoaderService,
    private toast: ToastService,
    private jobCardService: JobCardService
  ) { }

  formData = {
    jobNo: null,
    manualJobNo: null,
    dateFrom: null,
    dateTo: null,
  };

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

  onSelectJobType(selectedRow: any) {
    this.activeModal.close({ isAccepted: true, 'jobDetail': selectedRow });
  }

  reset() {
    this.formData = {
      jobNo: null,
      manualJobNo: null,
      dateFrom: null,
      dateTo: null,
    };
  }

}