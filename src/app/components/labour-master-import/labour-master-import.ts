import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { LabourmaasterService } from '../../core/services/labourmaaster-service';

import { Form22masterservice } from '../../core/services/form22masterservice';

@Component({
  selector: 'app-labour-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './labour-master-import.html',
  styleUrl: './labour-master-import.scss',
})

export class LabourMaster implements OnInit {

  constructor(private labourmasterService: LabourmaasterService,
    private form22service: Form22masterservice) { }

  ngOnInit(): void {
    this.loadOemModels();
  }
  selectedFile!: File;
  oemModels: any[] = [];
  gridData: any[] = [];

  formData = {
    effectiveDate: '',
    rateType: '',
    oemModelName: ''
  };
  // =========================
  // Load OEM Models
  // =========================
  loadOemModels() {

    this.form22service.getOemModelList().subscribe({
      next: (res: any) => {
        this.oemModels = res;
      },
      error: (err) => {
        console.error('Error fetching OEM Models', err);
      }
    });
  }

  // =========================
  // File Change
  // =========================

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile =
        event.target.files[0];
    }
  }

  // =========================
  // Upload Excel
  // =========================

  uploadExcel() {

    // Validation
    if (!this.formData.effectiveDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select Effective Date'
      });
      return;
    }

    if (!this.formData.rateType) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select Rate Type'
      });
      return;
    }

    if (!this.formData.oemModelName) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select OEM Model'
      });
      return;
    }

    if (!this.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select Excel File'
      });
      return;
    }
    const formData = new FormData();
    formData.append('File',
      this.selectedFile
    );

    formData.append('effectiveDate',
      this.formData.effectiveDate
    );

    formData.append('oemmodelname',
      this.formData.oemModelName
    );

    let apiCall;

    // Dynamic API Call
    if (this.formData.rateType === 'Modelwise Labour Rate') {
      apiCall = this.labourmasterService.importModelwiseExcel(formData);
    }
    else {
      apiCall = this.labourmasterService.importPartwiseExcel(formData);
    }

    apiCall.subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text:
            `${res.totalRecords}
             Records Imported Successfully`
        });

        // Bind Grid Data
        if (
          this.formData.rateType === 'Partwise Labour Rate'
        ) {
          this.gridData = res.labourPartWiseData;
        }
        else {
          this.gridData = res.labourMasterData;
        }

        // Reset Form
        this.formData = {
          effectiveDate: '',
          rateType: '',
          oemModelName: ''
        };
      },

      error: (err) => {
        console.log(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            err?.error?.message ||
            'Excel Import Failed'
        });
      }
    });
  }

  // =========================
  // Download Template
  // =========================
  downloadTemplate() {
    if (this.formData.rateType === 'Partwise Labour Rate') {
      window.open('assets/templates/PartWiseLabourRate.xlsx', '_blank');
    }
    else {
      window.open('assets/templates/ModelWiseLabourRate.xlsx', '_blank');
    }
  }

}