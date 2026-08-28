// src\app\components\job-type-master\job-type-master.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toaster/toast-service';
import Swal from 'sweetalert2';
import { JobTypeService } from '../../core/services/job-type-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-job-type-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './job-type-master.html',
  styleUrl: './job-type-master.scss',
})
export class JobTypeMaster implements OnInit {
  readonly SUBMENU_ID = 68;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canDownload = false;

  @ViewChild('jobTypeAdd') jobTypeAdd!: TemplateRef<any>;
  @ViewChild('jobTypeUpdate') jobtypeUpdate!: TemplateRef<any>;

  jobTypeForm!: FormGroup;

  JobTypeNameList: any[] = [];
  filteredList: any[] = [];
  pagedData: any[] = [];
  searchText: string = '';

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private toaster: ToastService,
    private jobTypeMasterService: JobTypeService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {

    this.jobTypeForm = this.fb.group({
      jobTypeId: [0],
      JobTypeName: ['', Validators.required]
    });

    this.getjobtypeMasterList();
  }

  //#region Get List

  getjobtypeMasterList(): void {

    this.jobTypeMasterService.getJobTypepMasterList().subscribe({
      next: (response: any) => {

        this.JobTypeNameList = response || [];
        this.filteredList = [...this.JobTypeNameList];

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

    this.jobTypeForm.reset({
      jobTypeId: 0,
      JobTypeName: ''
    });

    this.modalService.open(this.jobTypeAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  saveJobType(modal: any): void {

    if (this.jobTypeForm.invalid) {
      this.jobTypeForm.markAllAsTouched();
      return;
    }

    const model = {
      JobTypeName: this.jobTypeForm.value.JobTypeName
    };

    this.jobTypeMasterService.insertJobtypeMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('JobTypeName added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getjobtypeMasterList();

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
    this.jobTypeForm.patchValue({
      jobTypeId: item.id,
      JobTypeName: item.jobTypeName
    });

    this.modalService.open(this.jobtypeUpdate, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  updateJobType(modal: any): void {

    if (this.jobTypeForm.invalid) {
      this.jobTypeForm.markAllAsTouched();
      return;
    }

    const model = {
      id: this.jobTypeForm.value.jobTypeId,
      JobTypeName: this.jobTypeForm.value.JobTypeName
    };

    this.jobTypeMasterService.updateJobTypeMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('JobTypeName updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getjobtypeMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Delete

  deleteJobType(jobTypeId: number, event: Event): void {

    event.stopPropagation();

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this jobtype.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.jobTypeMasterService.deleteJobTypeMaster(jobTypeId)
          .subscribe({
            next: () => {

              this.toaster.show('JobTypeName deleted successfully!', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getjobtypeMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete jobtype!', {
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
      this.filteredList = [...this.JobTypeNameList];
    } else {
      this.filteredList = this.JobTypeNameList.filter(x =>
        x.jobTypeName?.toLowerCase().includes(search)
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

  downloadJobTypeMasterExcel(): void {

    this.jobTypeMasterService.getJobTypeMasterExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'JobTypeMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }

  //#endregion

}
