import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartmentService } from '../../../core/services/department';
import { DepartmentModel } from '../../../ViewModels/models/DepartmentModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-department-master-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './department-master-list.html',
  styleUrl: './department-master-list.scss',
})
export class DepartmentMasterList {
  departmentList: DepartmentModel[] = [];
  filteredList: DepartmentModel[] = [];
  searchText: string = '';

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loader.show();
    this.departmentService.get().subscribe({
      next: (res: DepartmentModel[]) => {
        this.departmentList = res ?? [];
        this.applyFilter();
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error fetching departments', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error loading departments:', err);
      }
    });
  }

  applyFilter() {
    const text = this.searchText.trim().toLowerCase();
    this.filteredList = !text
      ? [...this.departmentList]
      : this.departmentList.filter(d =>
          d.abbreviation?.toLowerCase().includes(text) ||
          d.departmentName?.toLowerCase().includes(text)
        );
  }

  onAdd() {
    this.router.navigate(['/department-master/add']);
  }

  onEdit(id: number) {
    this.router.navigate(['/department-master/edit', id]);
  }

  onDelete(department: DepartmentModel) {
    if (!confirm(`Are you sure you want to delete "${department.departmentName}"?`)) return;

    this.loader.show();
    this.departmentService.delete(department.departmentId).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Department deleted successfully', { classname: 'bg-success text-white', delay: 5000 });
        this.loadDepartments();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error deleting department!', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error deleting department:', err);
      }
    });
  }
}