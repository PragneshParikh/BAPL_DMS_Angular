import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { GroupMasterService } from '../../core/services/group-master-service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-group-master',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule,NgbPagination],
  templateUrl: './group-master.html',
  styleUrl: './group-master.scss',
})
export class GroupMaster implements OnInit {

  @ViewChild('groupAdd') groupAdd!: TemplateRef<any>;
  @ViewChild('groupModal') groupModal!: TemplateRef<any>;


  selectedGroup: any = {};


  groupForm!: FormGroup;

  groupNameList: string;
  pagedData: any[] = [];

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private groupMasterService : GroupMasterService
  ) { }
ngOnInit() {

  
}

 
  openAddDetails(): void {

    this.groupForm = this.fb.group({
    groupName: ['']
  });

    this.modalService.open(this.groupAdd, {
      size: 'xl',
      backdrop: 'static'
    });
  }

  openEditPopup(item: any): void {

    this.selectedGroup = { ...item };

    this.modalService.open(this.groupModal, {
      size: 'xl',
      backdrop: 'static'
    });
  }

  saveGroup(modal: any): void {

    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    const model = this.groupForm.value;
  }

  updateGroup(modal: any): void {

   
  }

  deleteGroup(complaintId: number): void {

    if (!confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    
  }

  refreshGrid(): void {

   
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

  

  this.refreshGrid();
}

  downloadGroupMasterExcel() {
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

  pageChange(event: any): void {

    this.page = Number(event);

    this.refreshGrid();
  }

}
