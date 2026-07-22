import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbModal, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { PdiChecklistMasterService } from '../../core/services/pdi-checklistmaster-service';
import Swal from 'sweetalert2';
import { LoaderService } from '../../core/services/loader';
import { Form22MasterService } from '../../core/services/form22masterservice';
import * as bootstrap from 'bootstrap';
import { StorageService } from '../../core/services/storage';


@Component({
  selector: 'app-pdi-checklistmaster',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbModule, NgbPagination],
  templateUrl: './pdi-checklistmaster.html',
  styleUrl: './pdi-checklistmaster.scss',
})
export class PdiChecklistmaster implements OnInit {
  checklistList: any[] = [];
  searchText: string = '';
  isEditMode: boolean = false;
  isLoading: boolean = false;
  oemModelList: any[] = [];
  selectedOemModelId: number | null = null;


  PdiChecklistmastermodel: any = {
    oemmodelId: 0,
    checklistName: '',
    description: '',
    isActive: true,
    createdBy: 'Admin'
  };
  sortColumn: string;
  sortDirection: string;
  filteredData: any;
  pagedData: any;
  userRole: string = '';


  constructor(private Pdichecklistmasterservice: PdiChecklistMasterService,
    private form22service: Form22MasterService,
    private storageService : StorageService,
    private modalService: NgbModal,
    private loader: LoaderService
  ) { }
  ngOnInit() {
     this.userRole = this.storageService.getRole();
      console.log("userRole",this.userRole)
    this.loadPdiChecklistList();
    this.loadOemModels();
  }
  //pagination
  page = 1;
  pageSize = 10;
  collectionSize = 1;

  openAddpdiChecklist() {
    this.isEditMode = false;

    this.PdiChecklistmastermodel = {
      oemmodelId: 0,
      checklistName: '',
      isActive: true
    };

  }
  openEdit(item: any) {

    this.isEditMode = true;

    this.PdiChecklistmastermodel = {
      ...item
    };

    const modal = document.getElementById('pdiChecklistmasterModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  loadOemModels() {
    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        //  Direct assign (API already gives ID + Name)
        this.oemModelList = res;
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }

  loadPdiChecklistList() {
    this.loader.show();
    this.Pdichecklistmasterservice.getPdiChecklistMasterList(this.searchText)
      .subscribe({
        next: (res: any[]) => {
          this.loader.hide();
          this.checklistList = res;
        },
        error: (err) => {
          this.loader.hide();
          console.error('Error loading list', err);
        }
      });
  }

  onSearch() {
    this.loadPdiChecklistList();
  }

  savePdiChecklistmaster(form: any) {
    if (form.invalid) return;
    const payload = {
      id: this.PdiChecklistmastermodel.id,
      oemmodelId: this.PdiChecklistmastermodel.oemmodelId,
      checklistName: this.PdiChecklistmastermodel.checklistName,
      description: this.PdiChecklistmastermodel.description,
      isactive: this.PdiChecklistmastermodel.isActive
    };

    if (this.isEditMode) {
      // UPDATE
      this.loader.show();
      this.Pdichecklistmasterservice.updatePdiChecklistMaster(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.afterSave(form, 'Updated successfully');
        },
        error: () => {
          this.loader.hide();
          this.showError()
        }
      });
    } else {
      //  INSERT
      this.loader.show();
      this.Pdichecklistmasterservice.insertPdiChecklistMaster(payload).subscribe({
        next: () => {
          this.loader.hide();
          this.afterSave(form, 'Inserted successfully');
        },
        error: () => {
          this.loader.hide();
          this.showError()
        }
      });
    }
  }
  afterSave(form: any, message: string) {

    Swal.fire({
      icon: 'success',
      title: message,
      timer: 1500,
      showConfirmButton: false
    }).then(() => {

      const modalEl = document.getElementById('pdiChecklistmasterModal');

      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        document.body.classList.remove('modal-open');

        document.querySelectorAll('.modal-backdrop')
          .forEach(el => el.remove());
      }

      form.resetForm();
      this.isEditMode = false;

      this.loadPdiChecklistList();
    });
  }
  showError() {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong'
    });
  }
  deletePdiCheclistMaster(pdicheckId: number, event: Event) {
    event.stopPropagation();
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {

      if (result.isConfirmed) {
        this.loader.show()
        this.Pdichecklistmasterservice.deletePdiChecklistMaster(pdicheckId).subscribe({
          next: (res) => {
            this.loader.hide()
            Swal.fire({
              icon: 'success',
              title: res,
              timer: 1500,
              showConfirmButton: false
            });

            this.loadPdiChecklistList();
          },
          error: (err) => {
            this.loader.hide();
            Swal.fire({
              icon: 'warning',
              title: 'Deleted successfully'
              //text: err.error
            });
            this.loadPdiChecklistList();

          }
        });

      }
    });
  }

  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.checklistList.sort((a, b) => {
      let valueA = a[column] ?? '';
      let valueB = b[column] ?? '';

      // Special handling for Status column
      if (column === 'isActive') {
        valueA = valueA ? 1 : 0;
        valueB = valueB ? 1 : 0;
      }

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });

    this.refreshTable();
  }

  refreshTable() {

    if (!Array.isArray(this.checklistList)) {
      this.filteredData = [];
    }

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.checklistList.slice(start, end);
  }

}


