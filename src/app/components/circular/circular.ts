import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StorageService } from '../../core/services/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { CircularService } from '../../core/services/circular';
import { AddCircular } from '../../dialogs/add-circular/add-circular';
import { finalize } from 'rxjs/operators';
import { CircularPermission } from '../../dialogs/circular-permission/circular-permission';
import { CircularDealerAssignmentService } from '../../core/services/circular-dealer-assignment';

@Component({
  selector: 'app-circular',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbTooltipModule],
  templateUrl: './circular.html',
  styleUrl: './circular.scss',
})
export class Circular {

  folderStructure: any = {};

  openedCategory: string | null = null;
  openedYear: string | null = null;
  openedMonth: string | null = null;
  openedDate: string | null = null;

  selectedYear: string | null = null;
  selectedMonth: string | null = null;
  selectedDate: string | null = null;

  selectedFiles: any[] = [];

  isSuperAdmin: boolean = false;
  dealerCode: string | null = null;

  constructor(
    private storageService: StorageService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toast: ToastService,
    private curcularService: CircularService,
    private circularDealerAssignmentService: CircularDealerAssignmentService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    }
  }

  ngOnInit(): void {
    this.getCircular();
  }

  getCircular() {
    this.loader.show();
    this.curcularService.getByDealerCode(this.dealerCode).subscribe({
      next: (res) => {
        this.loader.hide();
        this.folderStructure = res;

        if (this.selectedYear && this.selectedMonth && this.selectedDate
          && this.folderStructure?.[this.selectedYear]?.[this.selectedMonth]?.[this.selectedDate]) {
          this.selectedFiles =
            this.folderStructure[this.selectedYear][this.selectedMonth][this.selectedDate];
        } else {
          this.resetSelection();
        }
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 }
        );
      }
    });
  }

  resetSelection() {
    this.selectedDate = null;
    this.selectedFiles = [];

    this.openedYear = null;
    this.openedMonth = null;
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  toggleYear(year: string): void {
    this.openedYear = this.openedYear === year ? null : year;
    this.openedMonth = null;
  }

  toggleMonth(month: string): void {
    this.openedMonth = this.openedMonth === month ? null : month;
  }

  selectDate(category: string, year: string, month: string, date: string) {
    this.selectedDate = date;
    this.selectedFiles = this.folderStructure[category][year][month][date];
  }

  onAddNewFile() {
    const modalRef = this.modalService.open(AddCircular, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        if (result.isAccepted) {
          this.uploadFiles(result.formData);
        }
      },
      (reason) => {
      }
    );
  }

  uploadFiles(data: any) {
    this.loader.show();

    const request$ = data.id > 0
      ? this.curcularService.update({
        ...data,
        updatedBy: this.storageService.getUserId(),
        updatedDate: new Date()
      })
      : this.curcularService.insert({
        ...data,
        createdBy: this.storageService.getUserId()
      });

    request$
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.getCircular();
          this.toast.show(data.id > 0 ? 'Records updated successfully.' : 'Files uploaded successfully.', {
            classname: 'bg-success text-white', delay: 5000
          });
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Something went wrong.', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }
      });
  }

  editNews(selectedFile: any) {
    const modalRef = this.modalService.open(AddCircular, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.circularData = selectedFile;

    modalRef.result.then(
      (result) => {
        if (result.isAccepted) {
          this.uploadFiles(result.formData);
        }
      },
      (reason) => {
      }
    );
  }

  viewPdf(file: any) {

    const byteCharacters = atob(file.fileData);

    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], {
      type: 'application/pdf'
    });

    const fileURL = URL.createObjectURL(blob);

    window.open(fileURL, '_blank');
  }

  toggleCategory(category: string) {
    this.openedCategory =
      this.openedCategory === category ? null : category;

    this.openedYear = null;
    this.openedMonth = null;
  }

  openCircularPermission(selectedFile: any) {
    const modalRef = this.modalService.open(CircularPermission, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.selectedData = selectedFile;

    modalRef.result.then(
      (result) => {
        if (result.isAccepted && (result.addAssignments.length > 0 || result.deleteAssignments.length > 0)) {
          if (result.addAssignments.length > 0) {
            this.addDealerPermissions(selectedFile.id, result.addAssignments);
          }
          if (result.deleteAssignments.length > 0) {
            this.deleteDealerPermissions(selectedFile.id, result.deleteAssignments);
          }
        }
      },
      (reason) => {
      }
    );
  }

  addDealerPermissions(circularId: number, selectedDealers: any[]) {
    this.loader.show();
    this.circularDealerAssignmentService.addDealerPermissions(circularId, selectedDealers).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('Dealer permissions updated successfully.', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong while updating dealer permissions.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });

  }

  deleteDealerPermissions(circularId: number, selectedDealers: any[]) {
    this.loader.show();
    this.circularDealerAssignmentService.deleteDealerPermissions(circularId, selectedDealers).subscribe({
      next: () => {
        this.loader.hide();
        this.toast.show('Dealer permissions updated successfully.', { classname: 'bg-success text-white', delay: 5000 });
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong while updating dealer permissions.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }
}