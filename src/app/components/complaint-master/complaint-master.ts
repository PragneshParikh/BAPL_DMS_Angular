import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComplaintMasterModel } from '../../ViewModels/ComplaintMasterModel';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ComplaintmasterService } from '../../core/services/complaintmaster-service';
import { GroupMasterService } from '../../core/services/group-master-service';


@Component({
  selector: 'app-complaint-master',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './complaint-master.html',
  styleUrl: './complaint-master.scss',
})
export class ComplaintMaster implements OnInit {

  @ViewChild('complaintAdd') complaintAdd!: TemplateRef<any>;
  @ViewChild('complaintitemModal') complaintitemModal!: TemplateRef<any>;


  selectedComplaint: any = {};

  complaintForm!: FormGroup;

  complaintMasterModelList: ComplaintMasterModel[] = [];
  pagedData: ComplaintMasterModel[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;
  groupNameList: any;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private complaintService: ComplaintmasterService,
     private groupMasterService: GroupMasterService
  ) { }

  ngOnInit(): void {

    this.complaintForm = this.fb.group({
      complaintId: [0],
      complaintName: ['', Validators.required],
      groupName: [0, Validators.required],
      isActive: [true]
    });

    this.getComplaintMasterList();
    this.getGroupMasterList();
  }

  getGroupMasterList(): void {

    this.groupMasterService.getGroupMasterList().subscribe({
      next: (response: any) => {

        this.groupNameList = response || [];

        this.refreshGrid();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  getComplaintMasterList(): void {

    this.complaintService.getComplaintMasterList().subscribe({
      next: (response: any) => {

        this.complaintMasterModelList = response || [];
        

        this.refreshGrid();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  openAddDetails(): void {

    this.complaintForm.reset({
      complaintId: 0,
      complaintName: '',
      groupName: 0,
      isActive: true
    });

    this.modalService.open(this.complaintAdd, {
      size: 'xl',
      backdrop: 'static'
    });
  }

  openEditPopup(item: any): void {

    this.selectedComplaint = { ...item };
    this.modalService.open(this.complaintitemModal, {
      size: 'xl',
      backdrop: 'static'
    });
  }

  saveComplaint(modal: any): void {

    if (this.complaintForm.invalid) {
      this.complaintForm.markAllAsTouched();
      return;
    }

    const model = this.complaintForm.value;

    this.complaintService.insertComplaintMaster(model).subscribe({
      next: (res) => {

        this.getComplaintMasterList();

        modal.close();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  updateComplaint(modal: any): void {

    this.complaintService
      .updateComplaintMaster(this.selectedComplaint)
      .subscribe({
        next: () => {

          this.getComplaintMasterList();

          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  deleteComplaint(complaintId: number): void {

    if (!confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    this.complaintService.deleteComplaintMaster(complaintId).subscribe({
      next: () => {
        this.getComplaintMasterList();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  refreshGrid(): void {

    this.collectionSize = this.complaintMasterModelList.length;

    this.pagedData = this.complaintMasterModelList.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

sort(column: string): void {

  if (this.sortColumn === column) {
    this.sortDirection =
      this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  this.complaintMasterModelList.sort((a: any, b: any) => {

    const valueA = a[column];
    const valueB = b[column];

    if (valueA == null) return 1;
    if (valueB == null) return -1;

    if (typeof valueA === 'string') {

      return this.sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return this.sortDirection === 'asc'
      ? valueA > valueB ? 1 : -1
      : valueA < valueB ? 1 : -1;
  });

  this.refreshGrid();
}

  downloadComplaintMasterExcel() {
    this.complaintService.getComplaintMasterExcel().subscribe((response: Blob) => {

      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'ComplaintMaster.xlsx';

      link.click();
      window.URL.revokeObjectURL(url);

    });
  }

  pageChange(event: any): void {

    this.page = Number(event);

    this.refreshGrid();
  }
}
