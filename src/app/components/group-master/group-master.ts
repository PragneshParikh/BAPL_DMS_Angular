import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { GroupMasterService } from '../../core/services/group-master-service';
import Swal from 'sweetalert2';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-group-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPagination
  ],
  templateUrl: './group-master.html',
  styleUrl: './group-master.scss'
})
export class GroupMaster implements OnInit {

  @ViewChild('groupAdd') groupAdd!: TemplateRef<any>;
  @ViewChild('groupUpdate') groupUpdate!: TemplateRef<any>;

  groupForm!: FormGroup;

  groupNameList: any[] = [];
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
    private groupMasterService: GroupMasterService
  ) { }

  ngOnInit(): void {

    this.groupForm = this.fb.group({
      groupId: [0],
      groupName: ['', Validators.required]
    });

    this.getGroupMasterList();
  }

  //#region Get List

  getGroupMasterList(): void {

    this.groupMasterService.getGroupMasterList().subscribe({
      next: (response: any) => {

        this.groupNameList = response || [];
        console.log(this.groupNameList)
          this.filteredList = [...this.groupNameList];

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

    this.groupForm.reset({
      groupId: 0,
      groupName: ''
    });

    this.modalService.open(this.groupAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  saveGroup(modal: any): void {

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const model = {
      groupName: this.groupForm.value.groupName
    };

    this.groupMasterService.insertGroupMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('Group added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getGroupMasterList();

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

    this.groupForm.patchValue({
      groupId: item.id,
      groupName: item.groupName
    });

    this.modalService.open(this.groupUpdate, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  updateGroup(modal: any): void {

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const model = {
      id: this.groupForm.value.groupId,
      groupName: this.groupForm.value.groupName
    };

    console.log('Update Payload:', model);

    this.groupMasterService.updateGroupMaster(model)
      .subscribe({
        next: () => {

          this.toaster.show('Group updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getGroupMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  //#endregion

  //#region Delete

  deleteGroup(groupId: number, event: Event): void {

    event.stopPropagation();

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this group.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {

      if (result.isConfirmed) {

        this.groupMasterService.deleteGroupMaster(groupId)
          .subscribe({
            next: () => {

              this.toaster.show('Group deleted successfully!', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getGroupMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete group!', {
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

   applySearch(): void {

  const search = this.searchText.toLowerCase().trim();

  if (!search) {
    this.filteredList = [...this.groupNameList];
  } else {
    this.filteredList = this.groupNameList.filter(x =>
      x.groupName?.toLowerCase().includes(search)
    );
  }

  this.page = 1;
  this.refreshGrid();
}

  //#region Pagination

  pageChange(page: number): void {

    this.page = page;

    this.refreshGrid();
  }
 refreshGrid(): void {

  this.collectionSize = this.filteredList.length;

  this.pagedData = this.filteredList.slice(
    (this.page - 1) * this.pageSize,
    (this.page - 1) * this.pageSize + this.pageSize
  );
}

  //#endregion

  //#region Excel

  downloadGroupMasterExcel(): void {

    this.groupMasterService.getGroupMasterExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'GroupMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }

  //#endregion
}