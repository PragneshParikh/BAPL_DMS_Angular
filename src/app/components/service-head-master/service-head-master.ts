// src\app\components\service-head-master\service-head-master.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toaster/toast-service';
import { ServiceHeadService } from '../../core/services/service-head-service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { JobTypeService } from '../../core/services/job-type-service';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-service-head-master',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './service-head-master.html',
  styleUrl: './service-head-master.scss',
})
export class ServiceHeadMaster implements OnInit {
  readonly SUBMENU_ID = 69;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canDownload = false;

  @ViewChild('serviceHeadAdd') serviceHeadAdd!: TemplateRef<any>;
  @ViewChild('serviceHeadUpdate') serviceHeadUpdate!: TemplateRef<any>;

  serviceHeadForm!: FormGroup;

  jobTypeList: any[] = [];
  selectedJobTypeId: number = 0;

  serviceHeadNameList: any[] = [];
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
    private ServiceHeadMasterService: ServiceHeadService,
    private jobTypeMasterService: JobTypeService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {

    this.serviceHeadForm = this.fb.group({
      serviceHeadId: [0],
      jobtypeId: [0, Validators.required],
      ServiceHeadName: ['', Validators.required]
    });
    this.loadJobTypes();
    this.getServiceHeadMasterList();
  }

  loadJobTypes(): void {
    this.jobTypeMasterService.getJobTypepMasterList().subscribe({
      next: (res: any) => {
        this.jobTypeList = res || [];
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  //#region Get List

  getServiceHeadMasterList(): void {

    this.ServiceHeadMasterService.getServiceHeadMasterList().subscribe({
      next: (response: any) => {

        this.serviceHeadNameList = response || [];
        this.filteredList = [...this.serviceHeadNameList];

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

    this.serviceHeadForm.reset({
      jobSourceId: 0,
      JobSourceName: ''
    });

    this.modalService.open(this.serviceHeadAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  saveServiceHead(modal: any): void {

    if (this.serviceHeadForm.invalid) {
      this.serviceHeadForm.markAllAsTouched();
      return;
    }

    const model = {
      jobtypeId: this.serviceHeadForm.value.jobtypeId,
      ServiceHeadName: this.serviceHeadForm.value.ServiceHeadName
    };

    this.ServiceHeadMasterService.insertServiceHeadMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('ServiceHeadName added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getServiceHeadMasterList();

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

    this.serviceHeadForm.patchValue({
      jobtypeId: item.jobtypeId,
      serviceHeadId: item.id,
      ServiceHeadName: item.serviceHeadName
    });

    this.modalService.open(this.serviceHeadUpdate, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  updateServiceHead(modal: any): void {

    if (this.serviceHeadForm.invalid) {
      this.serviceHeadForm.markAllAsTouched();
      return;
    }

    const model = {
      id: this.serviceHeadForm.value.serviceHeadId,
      jobtypeId: this.serviceHeadForm.value.jobtypeId,
      ServiceHeadName: this.serviceHeadForm.value.ServiceHeadName
    };


    this.ServiceHeadMasterService.updateServiceHeadMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('ServiceHeadName updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getServiceHeadMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Delete

  deleteServiceHead(serviceHeadId: number, event: Event): void {

    event.stopPropagation();

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this ServiceHead.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.ServiceHeadMasterService.deleteServiceHeadMaster(serviceHeadId)
          .subscribe({
            next: () => {

              this.toaster.show('ServiceHeadName deleted successfully!', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getServiceHeadMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete ServiceHeadName!', {
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
      this.filteredList = [...this.serviceHeadNameList];

    } else {
      this.filteredList = this.serviceHeadNameList.filter(x =>
        x.serviceHeadName?.toLowerCase().includes(search) ||
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

  downloadServiceHeadMasterExcel(): void {

    this.ServiceHeadMasterService.getServiceHeadExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'ServiceHeadMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }
  //#endregion


}
