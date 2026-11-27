import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobCardService } from '../../core/services/job-card-service';
import { SharedModule } from '../../shared/shared.module';
import { StorageService } from '../../core/services/storage';
import { B2BJobcardService } from '../../components/b2b-jobcard/services/b2b-jobcard.service';
import { B2BJobCardFilter, B2BJobCardListRow } from '../../components/b2b-jobcard/models/b2b-jobcard.model';

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
    private storageService: StorageService,
    private b2bJobcardService: B2BJobcardService
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

    this.loader.show();

    if (this.sourceType === 'material-transfer') {
      this.searchMaterialTransferJobs(fromDate, toDate, jobNo);
    } else {
      this.jobCardService.getFilterdDataByPaged(fromDate, toDate, jobNo, manualJobNo, this.page, this.pageSize).subscribe({
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

  private searchMaterialTransferJobs(fromDate: any, toDate: any, jobNo: any): void {
    const requiredRows = this.page * this.pageSize;
    const b2bPageSize = Math.min(requiredRows, 500);
    const b2bPageCount = Math.ceil(requiredRows / 500);
    const b2bFilter: Omit<B2BJobCardFilter, 'pageIndex' | 'pageSize'> = {
      dealerCode: this.dealerCode || null,
      fromDate,
      toDate,
      jobNo: jobNo === null || jobNo === '' ? null : String(jobNo),
      regNo: this.formData.registerNo || null,
      chassisNo: this.formData.chassisNo || null
    };
    const b2bPages = Array.from({ length: b2bPageCount }, (_, index) =>
      this.b2bJobcardService.getList({
        ...b2bFilter,
        pageIndex: index + 1,
        pageSize: b2bPageCount > 1 ? 500 : b2bPageSize
      })
    );
    const numericJobNo = this.toOptionalNumber(jobNo);

    forkJoin({
      b2c: this.jobCardService.getJobCardList({
        dealerCode: this.dealerCode || null,
        fromDate,
        toDate,
        jobNo: numericJobNo,
        registerNo: this.formData.registerNo || null,
        chassisNo: this.formData.chassisNo || null
      }),
      b2b: forkJoin(b2bPages)
    }).subscribe({
      next: ({ b2c, b2b }) => {
        const b2cRecords = Array.isArray(b2c) ? b2c : b2c?.data || [];
        const b2cRows = b2cRecords.map((row: any) => {
          const header = row.jobCardHeader || {};
          const customer = row.jobCardCustomer || {};
          const repairBillStatus = String(row.repairBillStatus ?? '').trim().toLowerCase();

          return {
            id: header.id,
            dealerCode: header.dealerCode,
            jobNo: header.jobNo,
            jobDate: header.jobinDate,
            locationName: row.location,
            jobType: row.serviceHead || row.jobtype,
            serviceType: row.serviceType,
            customerName: row.partyName || customer.customerName,
            registerNo: customer.registerNo,
            chasisNo: customer.chassisNo || header.chassisno,
            modelName: customer.modelName,
            recordType: 'B2C',
            canSelect: !repairBillStatus || repairBillStatus === 'performa created'
          };
        });
        const b2bRows = b2b.flatMap((page) => page?.data || []).map((row: B2BJobCardListRow) => ({
          id: row.id,
          dealerCode: row.dealerCode,
          jobNo: row.jobCardNumber,
          jobDate: row.createdAt,
          locationName: row.serviceLocation,
          jobType: row.jobType,
          serviceType: row.serviceHead,
          customerName: row.customerName,
          registerNo: row.regNo,
          chasisNo: row.chassisNo,
          modelName: row.model,
          recordType: 'B2B',
          canSelect: true
        }));
        const mergedRows = [...b2cRows, ...b2bRows].sort(
          (left, right) => new Date(right.jobDate).getTime() - new Date(left.jobDate).getTime()
        );

        this.jobList = mergedRows.slice((this.page - 1) * this.pageSize, requiredRows);
        this.collectionSize = b2cRows.length + (b2b[0]?.totalRecords || 0);
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Could not load B2B and B2C job cards.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  private toOptionalNumber(value: any): number | null {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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