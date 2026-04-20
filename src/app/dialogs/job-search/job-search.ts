import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-job-search',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './job-search.html',
  styleUrl: './job-search.scss',
})
export class JobSearch {
  jobList: any[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private loader: LoaderService,
    private toast: ToastService,

  ) { }

  formData = {
    jobNo: '',
    manualJobNo: '',
    dateFrom: new Date(),
    dateTo: new Date(),
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

  onSearchJob() {
  }

}
