import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LabourmaasterService } from '../../core/services/labourmaaster-service';
import Swal from 'sweetalert2';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { Form22masterservice } from '../../core/services/form22masterservice';

@Component({
  selector: 'app-labour-rate-master',
  imports: [FormsModule, CommonModule],
  templateUrl: './labour-rate-master.html',
  styleUrl: './labour-rate-master.scss',
})
export class LabourRateMaster implements OnInit {

  constructor(private LabourMasterService: LabourmaasterService,
    private form22service: Form22masterservice,
    private loader: LoaderService
  ) { }

  showEditPopup = false;
  showPartwiseEditPopup = false;
  rateType: string = '';
  oemModels: any[] = [];
  modelWiseLabourList: any[] = [];
  selectedLabour: any = {};
  selectedPartwiseLabour : any ={};
  pagedModelWiseLabourList: any[] = [];
  partWiseLabourList: any[] = [];
  pagedPartWiseLabourList: any[] = [];

  pageSize = 10;
  currentPage = 1;
  totalPages = 0;

  ngOnInit(): void {
    this.loadOemModels();
    this.onSearch();
  }
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
  onSearch(): void {
    this.loadModelWiseLabourRateList();
    this.loadPartWiseLabourRateList();
  }
  loadModelWiseLabourRateList(): void {
    this.loader.show();

    this.LabourMasterService.getLabourMasterModelwiseListApi().subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.modelWiseLabourList = res.data || res;
        this.totalPages = Math.ceil(
          this.modelWiseLabourList.length /
          this.pageSize
        );
        this.setPage(1);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load labour list'
        });
      }
    });
  }

  loadPartWiseLabourRateList(): void {
    this.loader.show();

    this.LabourMasterService.getLabourMasterPartwiseListApi().subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.partWiseLabourList = res.data || res;
        this.totalPages = Math.ceil(
          this.partWiseLabourList.length /
          this.pageSize
        );
        this.setPage(1);
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load labour list'
        });
      }
    });
  }

  setPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedModelWiseLabourList = this.modelWiseLabourList.slice(start, end);
    this.pagedPartWiseLabourList = this.partWiseLabourList.slice(start, end);
  }

  openEditPopup(item: any): void {
    this.selectedLabour = {
      ...item
    };
    console.log(this.selectedLabour)
    this.showEditPopup = true;
  }
  openPartwiseEditPopup(item: any): void {
    this.selectedPartwiseLabour = {
      ...item
    };
    console.log(this.selectedPartwiseLabour)
    this.showPartwiseEditPopup = true;
  }
  closePopup(): void {
    this.showEditPopup = false;
    this.showPartwiseEditPopup = false;
  }

  updateLabour(): void {
    this.loader.show();
    this.LabourMasterService.updateLabourMasterDataApi(this.selectedLabour).subscribe({
      next: (res: any) => {
        this.loader.hide();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Updated Successfully'
        });
        this.showEditPopup = false;
        this.loadModelWiseLabourRateList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            'Update Failed'
        });
      }
    });
  }

  updatePartwiseLabour(): void {
    this.loader.show();
    this.LabourMasterService.updatePartWiseLabourMasterDataApi(this.selectedPartwiseLabour).subscribe({
      next: (res: any) => {
        this.loader.hide();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message || 'Updated Successfully'
        });
        this.showPartwiseEditPopup = false;
        this.loadPartWiseLabourRateList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            'Update Failed'
        });
      }
    });
  }
}
