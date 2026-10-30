// src\app\components\designation-master\designation-master-list\designation-master-list.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DesignationService } from '../../../core/services/designation';
import { DesignationModel } from '../../../ViewModels/models/DesignationModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { filterRows } from '../../../shared/search/table-search';
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
  readonly SUBMENU_ID = 64;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  constructor(
    private designationService: DesignationService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService,
    private menuAccess: MenuAccessService   // ADDED
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDelete = this.menuAccess.canDelete(this.SUBMENU_ID);
  }

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
    this.filteredList = filterRows(this.designationList, this.searchText, ['designationName', 'abbreviation']);
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