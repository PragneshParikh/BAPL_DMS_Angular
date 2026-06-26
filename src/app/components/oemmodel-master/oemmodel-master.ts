
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OemmodelMasterService } from '../../core/services/oemmodel-master-service';
import { OemModelViewModel } from '../../ViewModels/OemModelViewModel';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
declare var bootstrap: any;

@Component({
  selector: 'app-oemmodel-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './oemmodel-master.html',
  styleUrl: './oemmodel-master.scss'
})

export class OemmodelMasterComponent implements OnInit {

  modelList: OemModelViewModel[] = [];
  originalModelList: OemModelViewModel[] = [];

  pagedModelList: OemModelViewModel[] = [];

  selectedModel: OemModelViewModel = new OemModelViewModel();

  searchTerm = '';

  page = 1;
  pageSize = 10;

  totalRecords = 0;

  sortColumn = '';
  sortDirection = 'asc';
  formSubmitted = false;

  constructor(private modelService: OemmodelMasterService,
    public toastr: ToastService,
    private loader: LoaderService) { }

  ngOnInit(): void {
    this.loadModels();
  }

  // ================= GET LIST =================
  loadModels() {
    this.loader.show();
    this.modelService.getAllOEMModels().subscribe({

      next: (res: any) => {
        this.loader.hide();

        this.modelList = res;
        this.originalModelList = [...res];

        this.loadPage();

      },

      error: (err) => {
        this.loader.hide();
        console.error("API ERROR:", err);
      }

    });

  }

  // ================= SEARCH =================

  searchModel() {
    let filtered = this.originalModelList;

    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(x =>
        (x.modelName?.toLowerCase().includes(term)) ||
        (x.modelShortName?.toLowerCase().includes(term))
      );
    }

    this.modelList = filtered;
    this.page = 1;
    this.loadPage();
  }
  // ================= PAGINATION =================
  loadPage() {

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.totalRecords = this.modelList.length;

    this.pagedModelList = this.modelList.slice(start, end);

  }

  refreshPage() {
    this.loadPage();
  }

  // ================= SORT =================
  sort(column: string) {

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.modelList.sort((a: any, b: any) => {

      let valueA = a[column] || '';
      let valueB = b[column] || '';

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;

    });

    this.loadPage();

  }

  // ================= OPEN EDIT MODAL =================
  openEditModal(model: OemModelViewModel) {

    this.selectedModel = { ...model };

    const modal = new bootstrap.Modal(
      document.getElementById('editModelModal')
    );

    modal.show();

  }

  // ================= NEW MODEL =================
  newModel() {

    this.selectedModel = new OemModelViewModel();

  }

  // ================= SAVE MODEL =================
  saveModel() {

    if (this.selectedModel.id === 0) {

      this.modelService.AddOEMModel(this.selectedModel).subscribe(() => {

        this.loadModels();

      });

    }
    else {

      this.modelService.updateOEMModel(this.selectedModel).subscribe(() => {

        this.loadModels();

      });

    }

  }

  updateModel() {
    this.loader.show();
    this.modelService.updateOEMModel(this.selectedModel)
      .subscribe({

        next: (res: any) => {
          this.loader.hide();

          // Show success toast
          this.toastr.show(res.message || "Model Changes successfully Added", {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.loadModels();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('editModelModal')
          );
          modal.hide();

          // Reset formSubmitted for next open
          this.formSubmitted = false;

        },

        error: (err: any) => {
          this.loader.hide();
          console.error("Update Error:", err);

          // Show error toast
          this.toastr.show(err.error?.message || "Failed to update model", {
            classname: 'bg-danger text-white',
            delay: 5000
          });

        }

      });

  }
  openAddModal() {

    this.selectedModel = {
      id: 0,
      modelName: '',
      modelShortName: '',
      isActive: true
    } as OemModelViewModel;

    const modal = new bootstrap.Modal(
      document.getElementById('addModelModal')
    );

    modal.show();

  }

  addModel() {
    this.loader.show();
    this.modelService.AddOEMModel(this.selectedModel)
      .subscribe({

        next: (res: any) => {
          this.loader.hide();

          // Show success toast
          this.toastr.show(res.message || "Model added successfully", {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.loadModels();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('addModelModal')
          );
          modal.hide();

          // Reset formSubmitted for next open
          this.formSubmitted = false;

        },

        error: (err: any) => {
          this.loader.hide();

          // Show error toast
          this.toastr.show(err.error?.message || "Failed to add model", {
            classname: 'bg-danger text-white',
            delay: 5000
          });

        }

      });

  }
  getSortClass(column: string) {

    if (this.sortColumn === column) {

      return this.sortDirection === 'asc'
        ? 'sort-asc'
        : 'sort-desc';

    }

    return '';

  }
  downloadOEMModelExcel() {
    this.loader.show();
    this.modelService.downloadOEMModelExcel().subscribe({

      next: (response: Blob) => {
        this.loader.hide();
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'OEMModelMaster.xlsx';
        a.click();

        this.toastr.show('Excel downloaded successfully', { classname: 'bg-success text-white', delay: 5000 });
      },

      error: (err) => {
        this.loader.hide();
        console.error('Excel Download Error:', err);
        this.toastr.show('Excel download failed', { classname: 'bg-danger text-white', delay: 5000 });
      }

    });

  }
}
