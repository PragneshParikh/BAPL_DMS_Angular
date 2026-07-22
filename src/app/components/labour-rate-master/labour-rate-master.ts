import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LabourMasterService } from '../../core/services/labourmaaster-service';
import Swal from 'sweetalert2';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { Form22MasterService } from '../../core/services/form22masterservice';
import { StorageService } from '../../core/services/storage';
import { JobCardService } from '../../core/services/job-card-service';
import { debug } from 'console';

@Component({
  selector: 'app-labour-rate-master',
  imports: [FormsModule, CommonModule],
  templateUrl: './labour-rate-master.html',
  styleUrl: './labour-rate-master.scss',
})
export class LabourRateMaster implements OnInit {
  sortColumn: string;
  sortDirection: string;
  page: number;
  pagedData: any;

  constructor(private LabourMasterService: LabourMasterService,
    private storageService: StorageService,
    private jobCardService: JobCardService,
    private form22service: Form22MasterService,
    private loader: LoaderService
  ) { }

  showEditPopup = false;
  showPartwiseEditPopup = false;
  rateType: string = '';
  oemModels: any[] = [];
  modelWiseLabourList: any[] = [];
  selectedLabour: any = {};
  selectedPartwiseLabour: any = {};
  pagedModelWiseLabourList: any[] = [];
  partWiseLabourList: any[] = [];
  pagedPartWiseLabourList: any[] = [];

  pageSize = 10;
  currentPage = 1;
  totalPages = 0;

  selectedJobtype: any = '';
  jobTypeList: any[] = [];
  serviceHeadList: any[] = [];
  serviceTypeList: any[] = [];
  selectedServiceHead: any;
  selectedServiceType: string;
  searchText: string = '';

  ngOnInit(): void {
    this.loadOemModels();
    this.onSearch();
    this.loadJobTypes();
  }
  // =========================
  // Load OEM Models
  // =========================
  loadOemModels() {

    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        this.oemModels = res;
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }
  onSearch(): void {
    this.loadModelWiseLabourRateList(this.searchText);
    this.loadPartWiseLabourRateList(this.searchText);
  }
  loadModelWiseLabourRateList(searchText: string): void {
    this.loader.show();

    this.LabourMasterService.getLabourMasterModelwiseListApi(searchText).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.modelWiseLabourList = res.data || res;
        console.log(this.modelWiseLabourList);
        this.totalPages = Math.ceil(
          this.modelWiseLabourList.length /
          this.pageSize
        );
        this.setPage(1);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load labour list'
        });
      }
    });
  }

  loadPartWiseLabourRateList(searchText: string): void {
    this.loader.show();

    this.LabourMasterService.getLabourMasterPartwiseListApi(searchText).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.partWiseLabourList = res.data || res;
        this.totalPages = Math.ceil(
          this.partWiseLabourList.length /
          this.pageSize
        );
        this.setPage(1);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load labour list'
        });
      }
    });
  }

  setPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedModelWiseLabourList = this.modelWiseLabourList.slice(start, end);
    this.pagedPartWiseLabourList = this.partWiseLabourList.slice(start, end);
  }

  openEditPopup(item: any): void {
    debugger;
    this.selectedLabour = {
      ...item
    };
    console.log(this.selectedLabour)
    if (this.selectedLabour.jobType) {
      this.jobCardService.getServiceHead(
        this.selectedLabour.jobType
      ).subscribe({
        next: (res: any) => {
          this.serviceHeadList = res;
          if (this.selectedLabour.serviceHead) {
            this.jobCardService.getServiceType(this.selectedLabour.serviceHead)
              .subscribe({
                next: (typeRes: any) => {
                  this.serviceTypeList = typeRes;
                }
              });
          }
        }
      });
    }
    this.showEditPopup = true;
  }
  openPartwiseEditPopup(item: any): void {
    this.selectedPartwiseLabour = {
      ...item
    };
    if (this.selectedPartwiseLabour.jobType) {
      this.jobCardService.getServiceHead(
        this.selectedPartwiseLabour.jobType
      ).subscribe({
        next: (res: any) => {
          this.serviceHeadList = res;
          if (this.selectedPartwiseLabour.serviceHead) {
            this.jobCardService.getServiceType(this.selectedPartwiseLabour.serviceHead)
              .subscribe({
                next: (typeRes: any) => {
                  this.serviceTypeList = typeRes;
                }
              });
          }
        }
      });
    }
    this.showPartwiseEditPopup = true;
  }
  closePopup(): void {
    this.showEditPopup = false;
    this.showPartwiseEditPopup = false;
  }

  loadJobTypes() {
    this.jobCardService.getJobType().subscribe({
      next: (res) => {
        this.jobTypeList = res;
      },
      error: (err) => {
        console.error('Error fetching job types', err);
      }
    });
  }

  onJobType(type: 'model' | 'part'): void {
    debugger;

    if (type === 'model') {
      debugger
      if (!this.selectedLabour.jobType) {
        return;
      }

      this.jobCardService
        .getServiceHead(
          this.selectedLabour.jobType
        )
        .subscribe({
          next: (res: any) => {

            this.serviceHeadList = res;

          }
        });

    }

    else {

      if (!this.selectedPartwiseLabour.jobType) {
        return;
      }

      this.jobCardService
        .getServiceHead(
          this.selectedPartwiseLabour.jobType
        )
        .subscribe({
          next: (res: any) => {
            this.serviceHeadList = res;
          }
        });

    }

  }


  // =========================================
  // SERVICE HEAD CHANGE
  // =========================================

  onServiceHeadChange(type: 'model' | 'part'): void {
    this.serviceTypeList = [];

    // MODELWISE

    if (type === 'model') {

      this.selectedLabour.servicetype = '';

      this.jobCardService
        .getServiceType(
          this.selectedLabour.serviceHead
        )
        .subscribe({

          next: (res: any) => {

            this.serviceTypeList = res;

            // AUTO SELECT SINGLE

            if (
              this.serviceTypeList.length === 1
            ) {

              this.selectedLabour.servicetype =
                this.serviceTypeList[0].id;

            }

          }

        });

    }

    // PARTWISE

    else {

      this.selectedPartwiseLabour.servicetype = '';

      this.jobCardService
        .getServiceType(
          this.selectedPartwiseLabour.serviceHead
        )
        .subscribe({

          next: (res: any) => {

            this.serviceTypeList = res;

            // AUTO SELECT SINGLE

            if (
              this.serviceTypeList.length === 1
            ) {

              this.selectedPartwiseLabour.servicetype =
                this.serviceTypeList[0].id;

            }

          }

        });

    }

  }

  loadServiceType(serviceHeadId: number, isEdit = false) {

    this.jobCardService
      .getServiceType(serviceHeadId)
      .subscribe((res: any[]) => {

        this.serviceTypeList = res;

        // EDIT MODE
        if (isEdit) {

          this.selectedServiceType = '';

          return;
        }

        // SINGLE VALUE AUTO SELECT
        if (this.serviceTypeList.length === 1) {

          this.selectedServiceType =
            this.serviceTypeList[0].id;

        }
        else {

          this.selectedServiceType = '';

        }

      });
  }

  updateLabour(): void {
    this.loader.show();
    this.LabourMasterService.updateLabourMasterDataApi(this.selectedLabour).subscribe({
      next: (res: any) => {
        this.loader.hide();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Updated Successfully'
        });
        this.showEditPopup = false;
        this.loadModelWiseLabourRateList(this.searchText);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            'Update Failed'
        });
      }
    });
  }

  updatePartwiseLabour(): void {
    this.loader.show();
    this.LabourMasterService.updatePartWiseLabourMasterDataApi(this.selectedPartwiseLabour).subscribe({
      next: (res: any) => {
        this.loader.hide();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Updated Successfully'
        });
        this.showPartwiseEditPopup = false;
        this.loadPartWiseLabourRateList(this.searchText);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            'Update Failed'
        });
      }
    });
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.rateType === 'Modelwise Labour Rate') {

      this.pagedModelWiseLabourList.sort((a, b) => {
        let valueA = a[column] ?? '';
        let valueB = b[column] ?? '';

        if (column === 'isLabourRateActive') {
          valueA = valueA ? 1 : 0;
          valueB = valueB ? 1 : 0;
        }

        const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        return this.sortDirection === 'asc' ? result : -result;
      });

    } else {

      this.pagedPartWiseLabourList.sort((a, b) => {
        let valueA = a[column] ?? '';
        let valueB = b[column] ?? '';

        if (column === 'isActive') {
          valueA = valueA ? 1 : 0;
          valueB = valueB ? 1 : 0;
        }

        const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        return this.sortDirection === 'asc' ? result : -result;
      });

    }

    this.refreshTable();
  }

  refreshTable() {

    if (!Array.isArray(this.pagedModelWiseLabourList)) {
      this.pagedModelWiseLabourList = [];
    }

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.pagedModelWiseLabourList.slice(start, end);
  }
}
