import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form22masterservice } from '../../../core/services/form22masterservice';
import { NgbHighlight, NgbModal, NgbPagination, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Form22MasterModel } from '../../../ViewModels/Form22MasterModel';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';

@Component({
  selector: 'app-form22master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbHighlight, NgbPagination, NgbTooltipModule],
  templateUrl: './form22master.html',
  styleUrl: './form22master.scss',
})

export class Form22master implements OnInit {
  //binding dropdown value fields
  oemModelList: any[] = [];
  selectedOemModelId: number | null = null;

  //binding modal data to pass in insert api
  formData: Form22MasterModel = {
    id: 0,
    oemmodelId: 0,
    oemModelName: '',
    soundLevelHorn: '',
    passbyNoiseLevel: '',
    approvalCertificateNo: '',
    isActive: true,
    createdBy: 'Kajal Tiwari',
    createdDate: new Date(),
    updatedBy: '',
    updatedDate: new Date()

  };

  //load page details
  griddata: any[] = [];
  filteredData: any[] = [];
  oemModelnameList: any[] = [];

  searchTerm: string = '';
  selectedForm22Item: any;

  pagedData: any[] = [];
  // pagination
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


  constructor(private form22service: Form22masterservice,
    public toaster: ToastService,
    private loader: LoaderService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadOemModels();
    this.loadForm22Items();
  }
  //  API CALL
  loadForm22Items(search?: string) {
    this.loader.show();
    this.form22service.getForm22masterdetails(this.searchTerm).subscribe({
      next: (res: any) => {
        this.griddata = res;
        this.filteredData = [...this.griddata];
        this.collectionSize = this.filteredData.length;
        this.loader.hide();
        this.refreshTable();

        //console.log(this.griddata);
      },
      error: (err) => {
        console.log(err);
        this.loader.hide();
      }
    });

  }


  //Oem dropdown binding
  loadOemModels() {
    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        console.log('OEM Models:', res);

        //  Direct assign (API already gives ID + Name)
        this.oemModelList = res;
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }

  // ///oem all details
  // loadOemModels() {
  //   this.form22service.getForm22masterdetails().subscribe((res: any) => {
  //     this.oemModelList = res;
  //   });
  // }

  //  SEARCH FUNCTION
  searchItems(event: any) {
    this.searchTerm = event.target.value || '';
    this.loadForm22Items(this.searchTerm);
  }

  //add oem details
  addForm22Master(form: any, modal: any) {

    const payload: Form22MasterModel = {
      id: 0,
      oemmodelId: this.formData.oemmodelId,
      oemModelName: this.formData.oemModelName,
      soundLevelHorn: this.formData.soundLevelHorn,
      passbyNoiseLevel: this.formData.passbyNoiseLevel,
      approvalCertificateNo: this.formData.approvalCertificateNo,
      isActive: true,
      createdBy: 'Admin',
      createdDate: new Date(),
      updatedBy: 'Admin',
      updatedDate: new Date()
    };

    this.loader.show();

    this.form22service.insertForm22Master(payload)
      .subscribe({
        next: (res) => {

          this.loader.hide();

          this.toaster.show('Form22 Master details added successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.loadForm22Items();
          setTimeout(() => {
            modal.close();   // this will close popup
            form.resetForm(); // optional reset
          }, 1000); // 1 sec delay
          // form.resetForm();
        },
        error: (err) => {
          console.error(err);

          this.loader.hide();

          this.toaster.show('Failed to submit Form22 Master details!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });
        }

      });
  }

  //update oem details
  updateForm22Master(modal: any) {
    const updateData = {
      id: this.selectedForm22Item.id,
      oemmodelId: this.selectedForm22Item.oemmodelId,
      soundLevelHorn: this.selectedForm22Item.soundLevelHorn,
      passbyNoiseLevel: this.selectedForm22Item.passbyNoiseLevel,
      approvalCertificateNo: this.selectedForm22Item.approvalCertificateNo,
      isactive: this.selectedForm22Item.isactive,
      updatedBy: "Kajal Tiwari"
    };

    this.loader.show();

    this.form22service.updateForm22Master(this.formData.id, updateData)
      .subscribe({
        next: (res) => {

          this.toaster.show('Form22 Master details Updated successfully!', {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.loader.hide();
          this.loadForm22Items();
          setTimeout(() => {
            modal.close();   // this will close popup
          }, 1000); // 1 sec delay
        },

        error: (err) => {
          console.error('Update Error:', err);

          this.toaster.show('Error while updating Form22 Master!', {
            classname: 'bg-danger text-white',
            delay: 5000
          });

          this.loader.hide();
        },

        complete: () => {
          console.log('Update API completed');
        }
      });
  }


  //pagination
  pageChange(page: number) {
    this.page = page;
    this.refreshTable();
  }
  //download Form 22 master excel file
  downloadForm22MasterExcel() {
    this.form22service.downloadForm22MasterExcel().subscribe((response: Blob) => {

      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'Form22MasterList.xlsx';

      link.click();
      window.URL.revokeObjectURL(url);

    });
  }

  //sorting
  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filteredData.sort((a, b) => {

      let valueA = a[column];
      let valueB = b[column];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;

      return this.sortDirection === 'asc' ? result : -result;
    });

    this.page = 1;   // reset page after sorting
    this.refreshTable();
  }

  refreshTable() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedData = this.filteredData.slice(start, end);
  }
  openDetails(modal: any, data: any) {
    this.selectedForm22Item = { ...data };
    this.modalService.open(modal, { size: 'xl' });
  }
  openAddDetails(modal: any, item: any) {
    this.resetForm();
    this.formData = item;
    this.modalService.open(modal, { size: 'xl' });
  }

  resetForm() {
    this.formData = {
      id: 0,
      oemmodelId: 0,
      oemModelName: '',
      soundLevelHorn: '',
      passbyNoiseLevel: '',
      approvalCertificateNo: '',
      isActive: true,
      createdBy: 'Admin',
      createdDate: new Date(),
      updatedBy: '',
      updatedDate: new Date()

    };
  }

}
