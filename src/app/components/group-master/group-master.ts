import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { GroupMasterService } from '../../core/services/group-master-service';
import Swal from 'sweetalert2';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-group-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbPagination
  ],
  templateUrl: './group-master.html',
  styleUrl: './group-master.scss'
})
export class GroupMaster implements OnInit {

  @ViewChild('groupAdd') groupAdd!: TemplateRef<any>;

  groupForm!: FormGroup;

  groupNameList: any[] = [];
  pagedData: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  toastr: any;

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

  getGroupMasterList(): void {

    this.groupMasterService.getGroupMasterList().subscribe({
      next: (response: any) => {

        this.groupNameList = response || [];
        console.log(this.groupNameList)

        this.refreshGrid();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

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

  openEditPopup(item: any): void {

    this.groupForm.patchValue({
      groupId: item.groupId,
      groupName: item.groupName
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

    const model = this.groupForm.value;

    if (model.groupId > 0) {

      this.groupMasterService.updateGroupMaster(model).subscribe({
        next: () => {

          this.getGroupMasterList();
          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });

    } else {

      this.groupMasterService.insertGroupMaster(model).subscribe({
        next: () => {

          this.getGroupMasterList();
          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  deleteGroup(groupId: number, event: Event): void {
    debugger;
    
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

              this.toaster.show('GroupName deleted.', {
                classname: 'bg-success text-white',
                delay: 5000
              });

              this.getGroupMasterList();
            },
            error: () => {

              this.toaster.show('Failed to delete.', {
                classname: 'bg-success text-white',
                delay: 5000
              });
            }
          });

      }

    });
  }


  sort(column: string): void {

    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.groupNameList.sort((a, b) => {

      const valueA = (a[column] ?? '').toString().toLowerCase();
      const valueB = (b[column] ?? '').toString().toLowerCase();

      const comparison = valueA.localeCompare(valueB);

      return this.sortDirection === 'asc'
        ? comparison
        : -comparison;
    });

    this.refreshGrid();
  }
  pageChange(event: number): void {

    this.page = event;
    this.refreshGrid();
  }

  downloadGroupMasterExcel(): void {

    this.groupMasterService.getGroupMasterExcel().subscribe((response: Blob) => {

      const blob = new Blob([response], {
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

  refreshGrid(): void {

    this.collectionSize = this.groupNameList.length;

    this.pagedData = this.groupNameList.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }
}