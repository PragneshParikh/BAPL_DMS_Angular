import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { HsnCodeMasterService } from '../../core/services/hsn-code-master-service';
import { HsnCodeMasterViewModel } from '../../ViewModels/HSNCodeMaster/HSNCodeMaterViewModel';
import { ToastService } from '../../shared/toaster/toast-service';
import { HsnCodeMasterAddEditModel } from '../../ViewModels/HSNCodeMaster/HsnCodeMasterAddEditModel';

@Component({
  selector: 'app-hsn-code-master',
  standalone: true,
  imports: [CommonModule, NgbModule, FormsModule],
  templateUrl: './hsn-code-master.html',
  styleUrl: './hsn-code-master.scss'
})
export class HsnCodeMaster implements OnInit {

  @ViewChild('hsnModal') hsnModal!: TemplateRef<unknown>;

  modalRef!: NgbModalRef;

  hsnCodeList: HsnCodeMasterViewModel[] = [];
  paginatedHsnCodes: HsnCodeMasterViewModel[] = [];

  selectedHSNCodeId: number | null = null;

  page = 1;
  pageSize = 10;

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchTerm = '';

  isAddMode = false;
  isViewMode = false;

  formHsn: HsnCodeMasterAddEditModel = {
    hsncode: '',
    description: '',
    type: 'HSN'
  };

  originalFormHsn!: HsnCodeMasterAddEditModel;

  private searchSubject = new Subject<string>();
  isDuplicateHSN = false;


  constructor(
    private hsnService: HsnCodeMasterService,
    private modalService: NgbModal,
    public toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadHsnCodes();
    this.setupSearch();
  }

  // ================= LOAD =================
  loadHsnCodes(search?: string) {
    this.hsnService.getHSNCodeMasterList(search).subscribe({
      next: (data) => {
        this.hsnCodeList = data || [];
        this.page = 1;
        this.refreshPage();
      },
      error: () => {
        this.toastService.show('Failed to load data', {
          classname: 'bg-danger text-white',
          delay: 4000
        });
      }
    });
  }

  // ================= PAGINATION =================
  refreshPage() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedHsnCodes = this.hsnCodeList.slice(start, end);
  }


  onSort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.hsnCodeList.sort((a, b) => {

      let valueA = '';
      let valueB = '';


      switch (column) {

        case 'hsncode':
          valueA = a.hsncode ?? '';
          valueB = b.hsncode ?? '';

          // NUMBER + TEXT SORT
          const splitA = valueA.toString().match(/^(\d+)(.*)$/);
          const splitB = valueB.toString().match(/^(\d+)(.*)$/);

          const numA = splitA ? parseInt(splitA[1], 10) : 0;
          const numB = splitB ? parseInt(splitB[1], 10) : 0;

          const textA = splitA ? splitA[2] : valueA.toString();
          const textB = splitB ? splitB[2] : valueB.toString();

          if (numA !== numB) {
            return this.sortDirection === 'asc' ? numA - numB : numB - numA;
          }

          return this.sortDirection === 'asc'
            ? textA.localeCompare(textB)
            : textB.localeCompare(textA);

        case 'description':
          valueA = a.description ?? '';
          valueB = b.description ?? '';
          break;

        case 'type':
          valueA = a.type ?? '';
          valueB = b.type ?? '';
          break;

        default:
          return 0;
      }

      //  NORMAL STRING SORT
      const strA = valueA.toLowerCase();
      const strB = valueB.toLowerCase();

      if (strA < strB) return this.sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;

    });

    this.refreshPage();
  }

  // ================= SEARCH =================
  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search =>
        this.hsnService.getHSNCodeMasterList(search || '')
      )
    ).subscribe({
      next: (data) => {
        this.hsnCodeList = data || [];
        this.page = 1;
        this.refreshPage();
      }
    });
  }

  onSearchChange() {
    if (!this.searchTerm.trim()) {
      this.loadHsnCodes();
      return;
    }
    this.searchSubject.next(this.searchTerm);
  }

  // ================= ADD =================
  openAddModal() {
    this.isDuplicateHSN = false;

    this.isAddMode = true;
    this.isViewMode = false;

    this.selectedHSNCodeId = null;

    this.formHsn = {
      hsncode: '',
      description: '',
      type: ''
    };

    this.originalFormHsn = { ...this.formHsn };

    this.modalRef = this.modalService.open(this.hsnModal, {
      size: 'lg',
      centered: true
    });
  }



  // ================= SAVE =================
  saveHsn() {

    if (!this.formHsn.hsncode || !this.formHsn.type) {
      this.toastService.show('HSN Code and Type are required', {
        classname: 'bg-danger text-white',
        delay: 4000
      });
      return;
    }

    this.hsnService.addHSNCodeMaster(this.formHsn).subscribe({

      next: () => {
        this.toastService.show('HSN Code added successfully!', {
          classname: 'bg-success text-white',
          delay: 5000
        });

        this.modalRef.close();
        this.loadHsnCodes();
      },

      error: (err) => {

        console.log(err);

        let message = 'Something went wrong';

        if (err?.error) {
          if (typeof err.error === 'string') {
            message = err.error;
          } else if (err.error.message) {
            message = err.error.message;
          }
        }

        this.toastService.show(message, {
          classname: 'bg-warning text-white',
          delay: 5000
        });

      }

    });
  }

  onSubmit(form: any) {
    if (form.invalid) {
      Object.values(form.controls).forEach((control: any) => {
        control.markAsTouched();
      });
      return;
    }

    this.saveHsn();
  }
  downloadHSNCodeMasterExcel() {

    this.hsnService.downloadHSNCodeMasterExcel().subscribe((data: Blob) => {

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const downloadURL = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'HSNCodeMasterList.xlsx';

      link.click();

      window.URL.revokeObjectURL(downloadURL);

    });

  }
  // ================= EDIT =================
  openEditModal(hsn: HsnCodeMasterViewModel) {
    this.isDuplicateHSN = false;

    this.isAddMode = false;
    this.isViewMode = true;

    this.selectedHSNCodeId = hsn.id;

    this.formHsn = {
      hsncode: hsn.hsncode,
      description: hsn.description,
      type: hsn.type
    };

    this.originalFormHsn = { ...this.formHsn };

    this.modalRef = this.modalService.open(this.hsnModal, {
      size: 'lg',
      centered: true
    });
  }


}