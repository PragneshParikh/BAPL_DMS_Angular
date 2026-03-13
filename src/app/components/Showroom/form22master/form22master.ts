import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form22masterservice } from '../../../core/services/form22masterservice';
import { NgbHighlight, NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Form22MasterModel } from '../../../ViewModels/Form22MasterModel';

@Component({
  selector: 'app-form22master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbHighlight, NgbPagination],
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



  //success messages 
  showAlert: boolean = false;

  //load page details
  griddata: any[] = [];
  filteredData: any[] = [];
  searchTerm: string = '';
  selectedForm22Item: any;
  pagedData: any[] = [];
  // pagination
  page = 1;
  pageSize = 5;
  collectionSize = 0;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


  constructor(private form22service: Form22masterservice,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadOemModels();

    this.form22service.getForm22masterdetails().subscribe((res: any) => {
      this.griddata = res;

      // initialize table
      this.filteredData = [...this.griddata];
      this.collectionSize = this.filteredData.length;

      this.refreshTable();

      console.log(this.griddata);
    });
  }
  //Oem dropdown binding
  loadOemModels() {
    this.form22service.getForm22masterdetails().subscribe((res: any) => {
      this.oemModelList = res;
    });
  }


  //add oem details
  addForm22Master() {


    this.form22service.insertForm22Master(this.formData)
      .subscribe({

        next: (res) => {
          console.log("Inserted Successfully", res);
          this.showAlert = true;
        },

        error: (err) => {
          console.error(err);
        }

      });

  }
  //update oem details

  updateForm22Master() {

    const updateData = {
      id: this.formData.id,
      oemmodelId: this.formData.oemmodelId,
      soundLevelHorn: this.formData.soundLevelHorn,
      passbyNoiseLevel: this.formData.passbyNoiseLevel,
      approvalCertificateNo: this.formData.approvalCertificateNo,
      isActive: this.formData.isActive,
      updatedBy: "Kajal Tiwari"
    };

    this.form22service.updateForm22Master(this.formData.id, updateData)
      .subscribe(res => {

        console.log("Update Success");

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
  openDetails(modal: any, item: any) {
    this.selectedForm22Item = item;
    this.modalService.open(modal, { size: 'xl' });
  }
  openAddDetails(modal: any, item: any) {
    this.formData = item;
    this.modalService.open(modal, { size: 'xl' });
  }

}
