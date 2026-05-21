import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StorageService } from '../../core/services/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddNewsBulletin } from '../../dialogs/add-news-bulletin/add-news-bulletin';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { error } from 'console';
import { LoaderService } from '../../core/services/loader';
import { NewsBulletinService } from '../../core/services/news-bulletin';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-news-bulletin',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './news-bulletin.html',
  styleUrl: './news-bulletin.scss',
})
export class NewsBulletin {

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
    private newsBulletinService: NewsBulletinService
  ) {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
  }

  ngOnInit(): void {
    this.getNewsAndBulletin();
  }

  getNewsAndBulletin() {
    this.loader.show();
    this.newsBulletinService.get().subscribe({
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
    const modalRef = this.modalService.open(AddNewsBulletin, {
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
      this.newsBulletinService.update(data).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.getNewsAndBulletin();
          this.toast.show('records updated successfully.', { classname: 'bg-success text-white', delay: 5000 });
        }, error: (err) => {
          console.error(err);
          this.loader.hide();
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
    } else {
      data.createdBy = this.storageService.getUserId();
      this.newsBulletinService.insert(data).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.getNewsAndBulletin();
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
  //   this.newsBulletinService.delete(file.id).subscribe({
  //     next: () => {
  //       this.loader.hide();
  //       this.getNewsAndBulletin();
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
    const modalRef = this.modalService.open(AddNewsBulletin, {
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
