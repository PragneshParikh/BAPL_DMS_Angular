import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { TermConditionService } from '../../core/services/term-condition-service';
import { conditionModule } from '../../constant';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-term-condition-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbPagination],
  templateUrl: './term-condition-master.html',
  styleUrl: './term-condition-master.scss',
})




export class TermConditionMaster implements OnInit {
  @ViewChild('termandConditionAdd') termandConditionAdd!: TemplateRef<any>;
  @ViewChild('termandConditionUpdate') termandConditionUpdate!: TemplateRef<any>;

  termandConditionForm!: FormGroup;

  conditionList: any[] = [];
  pagedData: any[] = [];

  moduleList: any[] = conditionModule;
  selectedCondition: any = {};

  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private termConditionService: TermConditionService,
    private loader: LoaderService,
    private toaster: ToastService
  ) { }

  ngOnInit(): void {

    this.termandConditionForm = this.fb.group({
      conditionId: [0],
      termCondition: ['', Validators.required],
      conditionModule: ['', Validators.required],
      conditionEffectiveDate: ['', Validators.required]
    });

    this.getConditionList();
  }

  getConditionList(): void {

    this.loader.show();
    this.termConditionService.getTermConditionMasterList().subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.conditionList = (res || []).map((x: any) => ({
          ...x,
          conditionModuleName:
            this.moduleList.find(m => m.Id == x.conditionModule)
              ?.ConditionName || ''
        }));

        console.log(this.conditionList);

        this.refreshGrid();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
      }
    });
  }

  openAddDetails(): void {

    this.termandConditionForm.reset({
      conditionId: 0,
      termCondition: '',
      conditionModule: '',
      conditionEffectiveDate: ''
    });

    this.modalService.open(this.termandConditionAdd, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  openEditPopup(item: any): void {
    console.log("item", item);

    this.selectedCondition = {
      ...item,
      conditionEffectiveDate: item.conditionEffectiveDate
        ? new Date(item.conditionEffectiveDate).toISOString().split('T')[0]
        : ''
    };

    this.modalService.open(this.termandConditionUpdate, {
      size: 'xl',
      backdrop: 'static'
    });
  }

  saveCondition(modal: any): void {

    if (this.termandConditionForm.invalid) {
      this.termandConditionForm.markAllAsTouched();
      return;
    }

    this.termConditionService
      .insertTermConditionMaster(this.termandConditionForm.value)
      .subscribe({
        next: () => {
          this.getConditionList();
          modal.close();
        }
      });
  }

  updateCondition(modal: any): void {

    const payload = {
      conditionId: this.selectedCondition.id,
      conditionModule: Number(this.selectedCondition.conditionModule),
      termCondition: this.selectedCondition.termCondition,
      conditionEffectiveDate: this.selectedCondition.conditionEffectiveDate
    };

    console.log(payload);

    this.termConditionService
      .updateTermConditionMaster(payload)
      .subscribe({
        next: () => {
          this.getConditionList();
          modal.close();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

 deleteCondition(conditionId: number, event: Event): void {

  event.stopPropagation();

  Swal.fire({
    title: 'Delete Condition?',
    text: 'Are you sure you want to delete this condition?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel'
  }).then((result) => {

    if (!result.isConfirmed) {
      return;
    }

    this.termConditionService.deleteTermConditionMaster(conditionId)
      .subscribe({
        next: () => {

         this.toaster.show('TermCondition Deleted successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.getConditionList();
        },
        error: () => {

          this.toaster.show('Failed to Deleting', {
            classname: 'bg-success text-white',
            delay: 5000
          });
        }
      });
  });
}

  refreshGrid(): void {

    this.collectionSize = this.conditionList.length;

    this.pagedData = this.conditionList.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  sort(column: string): void {

    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.conditionList.sort((a, b) => {

      const valueA = (a[column] ?? '').toString().toLowerCase();
      const valueB = (b[column] ?? '').toString().toLowerCase();

      return this.sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

    this.refreshGrid();
  }

  pageChange(page: number): void {

    this.page = page;

    this.refreshGrid();
  }

  downloadTermConditionMasterExcel(): void {

    this.termConditionService.getTermConditionMasterExcel()
      .subscribe((response: Blob) => {

        const blob = new Blob(
          [response],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'TermConditionMaster.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      });
  }
}
