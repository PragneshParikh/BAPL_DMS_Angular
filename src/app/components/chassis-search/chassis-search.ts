import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { ChassisSearchService } from '../../core/services/chassis-search-service';

@Component({
  selector: 'app-chassis-search',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './chassis-search.html',
  styleUrl: './chassis-search.scss',
})
export class ChassisSearch {

  formData: any = {
    chassisNumber: '',
  }
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

  constructor(
    private chassisSearchService: ChassisSearchService,
    private loader: LoaderService,
    private toastr: ToastService
  ) { }

  onSubmit(form: any) {
    if (form.invalid) return;

    this.loader.show();

    this.chassisSearchService.getChassisDetails(this.formData.chassisNumber).subscribe({
      next: (response: any) => {
        this.vinData = response;
        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
        console.error('Error fetching chassis details:', error);
        this.toastr.show('Failed to fetch chassis details', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

  resetForms() {
    this.formData = {
      chassisNumber: '',
    }

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
    }

  }
}
