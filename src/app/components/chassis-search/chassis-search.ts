import { CommonModule } from '@angular/common';

import { Component } from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  LoaderService
} from '../../core/services/loader';

import {
  ToastService
} from '../../shared/toaster/toast-service';

import {
  ChassisSearchService
} from '../../core/services/chassis-search-service';

@Component({
  selector: 'app-chassis-search',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],

  templateUrl:
    './chassis-search.html',

  styleUrl:
    './chassis-search.scss',
})
export class ChassisSearch {

  // ============================================
  // FORM DATA
  // ============================================

  formData: any = {

    chassisNumber: '',
  };

  // ============================================
  // VIN DATA
  // ============================================

  vinData: any = {

    motorNo: '',

    chasisNo: '',

    defects: '',

    itemName: '',

    colrCode: '',

    currentLocation: '',

    customerName: '',

    saleDetails: '',

    purchaseDetails: ''
  };

  // ============================================
  // FILE
  // ============================================

  selectedFile!: File;

  constructor(

    private chassisSearchService:
      ChassisSearchService,

    private loader:
      LoaderService,

    private toastr:
      ToastService

  ) { }

  // ============================================
  // SEARCH CHASSIS
  // ============================================

  onSubmit(form: any) {

    if (form.invalid)
      return;

    this.loader.show();

    this.chassisSearchService
      .getChassisDetails(
        this.formData.chassisNumber
      )
      .subscribe({

        next: (response: any) => {

          this.vinData = response;

          this.loader.hide();
        },

        error: (error) => {

          this.loader.hide();

          console.error(
            'Error fetching chassis details:',
            error
          );

          this.toastr.show(
            'Failed to fetch chassis details',
            {
              classname:
                'bg-danger text-light',

              delay: 5000
            }
          );
        }
      });
  }

  // ============================================
  // FILE SELECT
  // ============================================

  onFileSelect(event: any): void {

    const file =
      event.target.files[0];

    if (file) {

      this.selectedFile = file;
    }
  }

  // ============================================
  // UPLOAD EXCEL
  // ============================================

  uploadExcel(): void {

    if (!this.selectedFile) {

      this.toastr.show(
        'Please select excel file',
        {
          classname:
            'bg-danger text-light',

          delay: 3000
        }
      );

      return;
    }

    this.loader.show();

    this.chassisSearchService
      .importChassisExcel(
        this.selectedFile
      )
      .subscribe({

        next: (response: any) => {

          this.loader.hide();

          this.toastr.show(
            'Excel imported successfully',
            {
              classname:
                'bg-success text-light',

              delay: 3000
            }
          );
        },

        error: (error) => {

          this.loader.hide();

          console.error(
            'Excel upload error:',
            error
          );

          this.toastr.show(
            'Failed to import excel',
            {
              classname:
                'bg-danger text-light',

              delay: 5000
            }
          );
        }
      });
  }

  // ============================================
  // RESET
  // ============================================

  resetForms() {

    this.formData = {

      chassisNumber: '',
    };

    this.vinData = {

      motorNo: '',

      chasisNo: '',

      defects: '',

      itemName: '',

      colrCode: '',

      currentLocation: '',

      customerName: '',

      saleDetails: '',

      purchaseDetails: ''
    };

    this.selectedFile =
      undefined as any;
  }
}