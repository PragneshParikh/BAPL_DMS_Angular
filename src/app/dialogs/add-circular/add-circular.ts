import { CommonModule } from '@angular/common';
import { Component, input, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { CircularService } from '../../core/services/circular';

@Component({
  selector: 'app-add-circular',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-circular.html',
  styleUrl: './add-circular.scss',
})
export class AddCircular implements OnInit {

  @Input() circularData: any;
  circularDataList: any[] = [];

  formData: any = {
    id: 0,
    category: 'Sales',
    title: '',
    description: '',
    publishDate: '',
    expiryDate: null,
    isActive: true,
    files: [],
    createdBy: '',
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null
  }

  constructor(
    public activeModal: NgbActiveModal,
    private loader: LoaderService,
    private toast: ToastService,
    private circularService: CircularService,
  ) { }

  ngOnInit(): void {
    this.getCircularDataList();
    if (this.circularData) {
      this.getCircularDataById();
    }
  }

  getCircularDataList() {
    this.loader.show();
    this.circularService.getCircularList().subscribe({
      next: (res: any) => {
        this.circularDataList = res;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  getCircularDataById() {
    this.loader.show();
    this.circularService.getById(this.circularData.id).subscribe({
      next: (res: any) => {
        this.formData = res;
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        this.toast.show('Only PDF files are allowed.', { classname: 'bg-danger text-white', delay: 5000 });
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data =
          (reader.result as string).split(',')[1];
        this.formData.files.push({
          AttachmentId: -1,
          fileName: file.name,
          contentType: file.type,
          fileData: base64Data,
          status: 'Added'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  close(isAccepted) {
    if (isAccepted) {
      // this.formData.files = this.selectedFiles;
      this.activeModal.close({ 'isAccepted': isAccepted, formData: this.formData });
    } else {
      this.activeModal.dismiss("closed");
    }

  }

  removeFile(index: number) {
    this.formData.files[index].status = 'Deleted';
  }

  checkDuplicateDate(args: any) {
    const selectedDate = args.target.value; // yyyy-MM-dd

    const isDuplicate = this.circularDataList.some((x: any) =>
      x.publishDate?.split('T')[0] === selectedDate &&
      x.category === this.formData.category &&
      x.id !== this.formData.id
    );

    if (isDuplicate) {
      this.toast.show(
        `${this.formData.category} circular already exists for this date.`,
        {
          classname: 'bg-warning text-dark',
          delay: 5000
        }
      );

      this.formData.publishDate = null;
    }
  }

  checkDuplicate(args: any) {
    const category = args.target.value; // yyyy-MM-dd

    const isDuplicate = this.circularDataList.some((x: any) =>
      x.publishDate?.split('T')[0] === this.formData.publishDate &&
      x.category === category &&
      x.id !== this.formData.id
    );

    if (isDuplicate) {
      this.toast.show(`${this.formData.category} circular already exists for this date.`, { classname: 'bg-warning text-dark', delay: 5000 });
      this.formData.publishDate = null;
    }
  }
}
