import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StorageService } from '../../core/services/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { CircularService } from '../../core/services/circular';
import { AddCircular } from '../../dialogs/add-circular/add-circular';

@Component({
  selector: 'app-circular',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './circular.html',
  styleUrl: './circular.scss',
})
export class Circular {

  folderStructure: any = {};

  openedYear: string | null = null;
  openedMonth: string | null = null;
  openedDate: string | null = null;

  selectedYear: string | null = null;
  selectedMonth: string | null = null;
  selectedDate: string | null = null;

  selectedFiles: any[] = [];

  isSuperAdmin: boolean = false;

  constructor(
    private storageService: StorageService,
    private modalService: NgbModal,
    private loader: LoaderService,
    private toast: ToastService,
    private curcularService: CircularService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
  }

  ngOnInit(): void {
    this.getCircular();
  }

  getCircular() {
    this.loader.show();
    this.curcularService.get().subscribe({
      next: (res) => {
        this.loader.hide();
        this.folderStructure = res;

        if (
          this.selectedYear &&
          this.selectedMonth &&
          this.selectedDate &&
          this.folderStructure?.[this.selectedYear]?.[this.selectedMonth]?.[this.selectedDate]
        ) {
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

  // selectDate(year: string, month: string, date: string): void {
  //   this.selectedDate = date;
  //   this.selectedFiles = this.folderStructure[year][month][date];
  // }
  selectDate(year: string, month: string, date: string): void {

    this.selectedYear = year;
    this.selectedMonth = month;
    this.selectedDate = date;

    this.openedYear = year;
    this.openedMonth = month;

    this.selectedFiles = this.folderStructure[year][month][date];
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
        console.log('Modal dismissed:', reason);
      }
    );
  }

  uploadFiles(data: any) {
    this.loader.show();

    if (data.id > 0) {
      data.updatedBy = this.storageService.getUserId();
      data.updatedDate = new Date();
      // data.files = data.files.filter(x => x.status === 'Added');
      this.curcularService.update(data).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.getCircular();
          this.toast.show('records updated successfully.', { classname: 'bg-success text-white', delay: 5000 });
        }, error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    } else {
      data.createdBy = this.storageService.getUserId();
      this.curcularService.insert(data).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.getCircular();
          this.toast.show('Files uploaded successfully.', { classname: 'bg-success text-white', delay: 5000 });
        }, error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    }
  }

  // deleteFile(file: any) {
  //   this.loader.show();
  //   this.curcularService.delete(file.id).subscribe({
  //     next: () => {
  //       this.loader.hide();
  //       this.getCircular();
  //       this.toast.show("File deleted sucessfully.", { classname: 'bg-sucess text-white', delay: 5000 });
  //     },
  //     error: (err) => {
  //       this.loader.hide();
  //       console.error(err);
  //       this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
  //     }

  //   });
  // }

  editNews(selectedFile: any) {
    const modalRef = this.modalService.open(AddCircular, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.newsData = selectedFile;

    modalRef.result.then(
      (result) => {
        if (result.isAccepted) {
          this.uploadFiles(result.formData);
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
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

}
