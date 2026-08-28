// src\app\components\dispatch-master\dispatch-master.ts
// misc-master/dispatch-master.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DispatchMasterService } from '../../core/services/dispatch-master-service';
import { DispatchMasterListViewModel, DispatchMasterViewModel } from '../../ViewModels/models/DispatchMasterViewModel';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-dispatch-master',
  standalone: true,
  imports: [CommonModule, NgbModule, FormsModule],
  templateUrl: './dispatch-master.html',
  styleUrl: './dispatch-master.scss',
})
export class DispatchMaster implements OnInit {

  @ViewChild('dispatchModal') dispatchModal!: TemplateRef<unknown>;

  readonly SUBMENU_ID = 117;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canDownload = false;
  masterTypeList: string[] = ['Dispatch Thru Master'];

  dispatchList: DispatchMasterListViewModel[] = [];

  selectedMasterType = 'Dispatch Thru Master';
  searchName = '';
  perPageRecords = 25;

  page = 1;
  collectionSize = 0;

  modalRef!: NgbModalRef;
  selectedRecord!: DispatchMasterViewModel;
  isEditMode = false;

  constructor(
    private dispatchService: DispatchMasterService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toaster: ToastService,
    private menuAccess: MenuAccessService   // ADDED
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loader.show();

    this.dispatchService
      .search(this.selectedMasterType, this.searchName, this.page, this.perPageRecords)
      .subscribe({
        next: (res) => {
          this.dispatchList = res.data;
          this.collectionSize = res.totalRecords;
          this.loader.hide();
        },
        error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toaster.show('Failed to load records!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadRecords();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadRecords();
  }

  /* ================= ADD / EDIT ================= */

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedRecord = {
      id: 0,
      masterType: this.selectedMasterType,
      masterName: '',
      isActive: true
    };

    this.modalRef = this.modalService.open(this.dispatchModal, {
      centered: true,
      size: 'md'
    });
  }

  openEditModal(record: DispatchMasterListViewModel): void {
    this.loader.show();

    this.dispatchService.getById(record.id).subscribe({
      next: (res) => {
        this.isEditMode = true;
        this.selectedRecord = { ...res.data };
        this.loader.hide();

        this.modalRef = this.modalService.open(this.dispatchModal, {
          centered: true,
          size: 'md'
        });
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Failed to load record!', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  saveRecord(): void {
    if (!this.selectedRecord.masterName?.trim() || !this.selectedRecord.masterType) {
      this.toaster.show('Master Type and Name are required!', {
        classname: 'bg-warning text-dark',
        delay: 4000
      });
      return;
    }

    this.loader.show();

    this.dispatchService.save(this.selectedRecord).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.modalRef.close();
        this.loadRecords();

        this.toaster.show(res.message ?? 'Saved successfully', {
          classname: 'bg-success text-light',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

        this.toaster.show(
          err.error?.message ?? 'Error saving record',
          { classname: 'bg-danger text-light', delay: 4000 }
        );
      }
    });
  }

  /* ================= TOGGLE ACTIVE (single click) ================= */

  toggleActive(item: DispatchMasterListViewModel, event: MouseEvent): void {
    event.stopPropagation(); // prevent triggering row dblclick

    const newStatus = !item.isActive;

    this.loader.show();

    this.dispatchService.toggleActive(item.id, newStatus).subscribe({
      next: () => {
        item.isActive = newStatus; // update locally, avoids full reload
        this.loader.hide();

        this.toaster.show(
          `Marked as ${newStatus ? 'Active' : 'Inactive'}`,
          { classname: 'bg-success text-light', delay: 2500 }
        );
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toaster.show('Failed to update status!', {
          classname: 'bg-danger text-white',
          delay: 4000
        });
      }
    });
  }

  // misc-master/dispatch-master.ts — add this method

  /* ================= DELETE ================= */

  deleteRecord(item: DispatchMasterListViewModel, event: MouseEvent): void {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${item.masterName}"?`)) {
      return;
    }

    this.loader.show();

    this.dispatchService.delete(item.id).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.loadRecords();

        this.toaster.show(res.message ?? 'Deleted successfully', {
          classname: 'bg-success text-light',
          delay: 3000
        });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);

        this.toaster.show(
          err.error?.message ?? 'Error deleting record',
          { classname: 'bg-danger text-light', delay: 4000 }
        );
      }
    });
  }
  /* ================= EXPORT ================= */

  downloadExcel(): void {
    this.toaster.show('Export not yet implemented', {
      classname: 'bg-warning text-dark',
      delay: 3000
    });
  }
}