import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../shared/toaster/toast-service';
import { ServiceHeadService } from '../../core/services/service-head-service';
import { ServiceTypeService } from '../../core/services/service-type-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-service-type-master',
  imports: [CommonModule,FormsModule,ReactiveFormsModule,NgbPagination],
  templateUrl: './service-type-master.html',
  styleUrl: './service-type-master.scss',
})
export class ServiceTypeMaster implements OnInit {

  
  @ViewChild('serviceTypeAdd') serviceTypeAdd!: TemplateRef<any>;
  @ViewChild('serviceTypeUpdate') serviceTypeUpdate!: TemplateRef<any>;

  serviceTypeForm!: FormGroup;

  serviceTypeList: any[] = [];
selectedserviceHeadId: number = 0;

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
    private ServiceTypeMasterService : ServiceTypeService,
    private ServiceHeadMasterService : ServiceHeadService,
  ) { }

  ngOnInit(): void {

    this.serviceTypeForm = this.fb.group({
      serviceTypeId: [0],
      serviceHeadId: [0, Validators.required],
      ServiceTypeName: ['', Validators.required]
    });
    this.loadServiceHead();
    this.getServiceTypeMasterList();
  }

  loadServiceHead(): void {
  this.ServiceHeadMasterService.getServiceHeadMasterList().subscribe({
    next: (res: any) => {
      this.serviceHeadNameList = res || [];
    },
    error: (err) => {
      console.error(err);
    }
  });
}
  //#region Get List

  getServiceTypeMasterList(): void {

    this.ServiceTypeMasterService.getServiceTypeMasterList().subscribe({
      next: (response: any) => {

        this.serviceTypeList = response || [];
        this.filteredList = [...this.serviceTypeList];
        console.log(this.serviceTypeList)

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

    this.serviceTypeForm.reset({
      serviceTypeId: 0,
      ServiceTypeName: ''
    });

    this.modalService.open(this.serviceTypeAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  saveServiceType(modal: any): void {

    if (this.serviceTypeForm.invalid) {
      this.serviceTypeForm.markAllAsTouched();
      return;
    }

    const model = {
      serviceHeadId : this.serviceTypeForm.value.serviceHeadId,
      ServiceTypeName: this.serviceTypeForm.value.ServiceTypeName
    };

    this.ServiceTypeMasterService.insertServiceTypeMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('ServiceTypeName added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getServiceTypeMasterList();

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
    console.log("edit item",item)

    this.serviceTypeForm.patchValue({
      serviceHeadId: item.serviceHeadId,
      serviceTypeId: item.id,
      ServiceTypeName: item.serviceTypeName
    });

    this.modalService.open(this.serviceTypeUpdate, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  updateServiceType(modal: any): void {

    if (this.serviceTypeForm.invalid) {
      this.serviceTypeForm.markAllAsTouched();
      return;
    }

    const model = {
      id: this.serviceTypeForm.value.serviceTypeId,
      serviceHeadId : this.serviceTypeForm.value.serviceHeadId,
      ServiceTypeName: this.serviceTypeForm.value.ServiceTypeName
    };

    console.log('Update Payload:', model);

    this.ServiceTypeMasterService.updateServiceTypeMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('ServiceTypeName updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getServiceTypeMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Delete

  deleteServiceType(serviceTypeId: number, event: Event): void {

    event.stopPropagation();

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this ServiceType.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.ServiceTypeMasterService.deleteServiceTypeMaster(serviceTypeId)
          .subscribe({
            next: () => {

              this.toaster.show('ServiceTypeName deleted successfully!', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getServiceTypeMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete ServiceTypeName!', {
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
    this.filteredList = [...this.serviceTypeList];
  } else {
    this.filteredList = this.serviceTypeList.filter(x =>
      x.serviceTypeName?.toLowerCase().includes(search)
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

  downloadServiceTypeMasterExcel(): void {

    this.ServiceTypeMasterService.getServiceTypeMasterExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'ServiceTypeMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }
  //#endregion

}
