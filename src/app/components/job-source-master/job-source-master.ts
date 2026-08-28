// src\app\components\job-source-master\job-source-master.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toaster/toast-service';
import { JobsourceMasterService } from '../../core/services/jobsource-master-service';
import Swal from 'sweetalert2';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-job-source-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './job-source-master.html',
  styleUrl: './job-source-master.scss',
})
export class JobSourceMaster implements OnInit {

  @ViewChild('jobSourceAdd') jobSourceAdd!: TemplateRef<any>;
  @ViewChild('jobSourceUpdate') jobSourceUpdate!: TemplateRef<any>;

  jobSourceForm!: FormGroup;

  JobSourceNameList: any[] = [];
  filteredList: any[] = [];
  pagedData: any[] = [];
  searchText: string = '';
  readonly SUBMENU_ID = 71;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canDownload = false;
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private toaster: ToastService,
    private jobSourceMasterService: JobsourceMasterService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {

    this.jobSourceForm = this.fb.group({
      jobSourceId: [0],
      JobSourceName: ['', Validators.required]
    });

    this.getjobSourceMasterList();
  }

  //#region Get List

  getjobSourceMasterList(): void {

    this.jobSourceMasterService.getJobSourceMasterList().subscribe({
      next: (response: any) => {

        this.JobSourceNameList = response || [];
        this.filteredList = [...this.JobSourceNameList];

        this.refreshGrid();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  //#endregion

  //#region Add

  openAddDetails(): void {

    this.jobSourceForm.reset({
      jobSourceId: 0,
      JobSourceName: ''
    });

    this.modalService.open(this.jobSourceAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  saveJobSource(modal: any): void {

    if (this.jobSourceForm.invalid) {
      this.jobSourceForm.markAllAsTouched();
      return;
    }

    const model = {
      JobSourceName: this.jobSourceForm.value.JobSourceName
    };

    this.jobSourceMasterService.insertJobSourceMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('JobSourceName added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getjobSourceMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Edit

  openEditPopup(item: any): void {
    this.jobSourceForm.patchValue({
      jobSourceId: item.id,
      JobSourceName: item.jobSourceName
    });

    this.modalService.open(this.jobSourceUpdate, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  updateJobSource(modal: any): void {

    if (this.jobSourceForm.invalid) {
      this.jobSourceForm.markAllAsTouched();
      return;
    }

    const model = {
      id: this.jobSourceForm.value.jobTypeId,
      JobSourceName: this.jobSourceForm.value.JobSourceName
    };

    this.jobSourceMasterService.updateJobSourceMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('JobSourceName updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getjobSourceMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Delete

  deleteJobSource(jobSourceId: number, event: Event): void {

    event.stopPropagation();

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this jobsource.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.jobSourceMasterService.deleteJobSourceMaster(jobSourceId)
          .subscribe({
            next: () => {

              this.toaster.show('JobSourceName deleted successfully!', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getjobSourceMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete jobsource!', {
                classname: 'bg-danger text-white',
                delay: 5000
              });
            }
          });
      }
    });
  }

  //#endregion

  //#region Sorting

  sort(column: string): void {

    if (this.sortColumn === column) {

      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';

    } else {

      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredList.sort((a, b) => {

      const valueA = (a[column] ?? '').toString().toLowerCase();
      const valueB = (b[column] ?? '').toString().toLowerCase();

      const comparison = valueA.localeCompare(valueB);

      return this.sortDirection === 'asc'
        ? comparison
        : -comparison;
    });

    this.refreshGrid();
  }

  //#endregion

  //#region Pagination

  pageChange(page: number): void {

    this.page = page;

    this.refreshGrid();
  }

  //search method
  applySearch(): void {

    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      this.filteredList = [...this.JobSourceNameList];
    } else {
      this.filteredList = this.JobSourceNameList.filter(x =>
        x.jobSourceName?.toLowerCase().includes(search)
      );
    }

    this.page = 1;
    this.refreshGrid();
  }
  //end

  refreshGrid(): void {

    this.collectionSize = this.filteredList.length;

    this.pagedData = this.filteredList.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }


  //#endregion

  //#region Excel

  downloadJobSourceMasterExcel(): void {

    this.jobSourceMasterService.getJobSourceMasterExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'JobSourceMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }
  //#endregion
}
