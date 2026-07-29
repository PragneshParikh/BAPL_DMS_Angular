import { CommonModule } from '@angular/common';
import { Component, input, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { CircularService } from '../../core/services/circular';
import { BlobUploadService } from '../../core/services/blob-upload';

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
    private blobUploadService: BlobUploadService
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

  // onFileSelected(event: any) {
  //   const files = event.target.files;
  //   for (let i = 0; i < files.length; i++) {
  //     const file = files[i];
  //     if (file.type !== 'application/pdf') {
  //       this.toast.show('Only PDF files are allowed.', { classname: 'bg-danger text-white', delay: 5000 });
  //       continue;
  //     }

  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       const base64Data =
  //         (reader.result as string).split(',')[1];
  //       this.formData.files.push({
  //         AttachmentId: -1,
  //         fileName: file.name,
  //         contentType: file.type,
  //         fileData: base64Data,
  //         status: 'Added'
  //       });
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }

  onFileSelected(event: any) {

    const files = event.target.files;

    for (let i = 0; i < files.length; i++) {

      const file = files[i];

      if (file.type !== 'application/pdf') {
        this.toast.show(
          'Only PDF files are allowed.',
          {
            classname: 'bg-danger text-white',
            delay: 5000
          }
        );
        continue;
      }

      this.formData.files.push({
        AttachmentId: -1,
        fileName: file.name,
        contentType: file.type,
        file: file,
        filePath: '',
        status: 'Added'
      });
    }
  }

  async close(isAccepted: boolean) {

    if (!isAccepted) {
      this.activeModal.dismiss('closed');
      return;
    }

    try {

      const deletedFiles = this.formData.files.filter(
        x => x.status === 'Deleted'
      );

      await Promise.all(
        deletedFiles.map(async item => {

          if (item.filePath) {
            // await this.blobUploadService.deleteFile(item.filePath);
          }

          return item;
        })
      );

      const uploadTasks = this.formData.files
        .filter(x => x.status === 'Added')
        .map(async item => {

          const fileUrl = await this.uploadFile(item.file);

          return {
            AttachmentId: item.AttachmentId,
            FileName: item.fileName,
            FilePath: fileUrl,
            ContentType: item.contentType,
            Status: item.status
          };
        });

      const uploadedFiles = await Promise.all(uploadTasks);

      this.formData.files = [
        ...uploadedFiles,
        ...deletedFiles
      ];

      this.activeModal.close({
        isAccepted: true,
        formData: this.formData
      });

    } catch (error) {
      // console.error(error);
      console.error('Error:', error);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      this.toast.show('File upload failed.', { classname: 'bg-danger text-white', delay: 5000 });
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

  uploadFile(file: File): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.blobUploadService.getUploadSasUrl(file.name).subscribe({
        next: async (res: any) => {
          // const blobClient = new BlockBlobClient(res.sasUri);

          // await blobClient.uploadData(file, {
          //   blockSize: 4 * 1024 * 1024, // 4MB chunks
          //   concurrency: 5,
          //   onProgress: (progress) => {
          //     const percent = Math.round((progress.loadedBytes / file.size) * 100);
          //   }
          // });
          return res.blobUrl;
        },
        error: (err) => {
          console.error('Upload error:', err);
          reject(err);
        }
      });
    });
  }
}