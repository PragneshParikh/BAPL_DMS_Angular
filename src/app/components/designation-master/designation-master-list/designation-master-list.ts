import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DesignationService } from '../../../core/services/designation';
import { DesignationModel } from '../../../ViewModels/models/DesignationModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-designation-master-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './designation-master-list.html',
  styleUrl: './designation-master-list.scss',
})
export class DesignationMasterList {
  designationList: DesignationModel[] = [];
  filteredList: DesignationModel[] = [];
  searchText: string = '';

  constructor(
    private designationService: DesignationService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit() {
    this.loadDesignations();
  }

  loadDesignations() {
    this.loader.show();
    this.designationService.get().subscribe({
      next: (res: DesignationModel[]) => {
        this.designationList = res ?? [];
        this.applyFilter();
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error fetching designations', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error loading designations:', err);
      }
    });
  }

applyFilter() {
    const text = this.searchText.trim().toLowerCase();
    this.filteredList = !text
      ? [...this.designationList]
      : this.designationList.filter(d =>
          d.designationName?.toLowerCase().includes(text) ||
          d.abbreviation?.toLowerCase().includes(text)
        );
  }

  onAdd() {
    this.router.navigate(['/designation-master/add']);
  }

  onEdit(id: number) {
    this.router.navigate(['/designation-master/edit', id]);
  }

  onDelete(designation: DesignationModel) {
    if (!confirm(`Are you sure you want to delete "${designation.designationName}"?`)) return;

    this.loader.show();
    this.designationService.delete(designation.designationId).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Designation deleted successfully', { classname: 'bg-success text-white', delay: 5000 });
        this.loadDesignations();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error deleting designation!', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error deleting designation:', err);
      }
    });
  }
}