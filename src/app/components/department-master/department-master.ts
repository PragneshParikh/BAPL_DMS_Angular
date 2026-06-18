import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentService } from '../../core/services/department';
import { DepartmentModel } from '../../ViewModels/models/DepartmentModel';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-department-master',
  imports: [CommonModule, FormsModule],
  templateUrl: './department-master.html',
  styleUrl: './department-master.scss',
})
export class DepartmentMaster {
  isEditMode = false;
  departmentExists = false;
  departmentList: DepartmentModel[] = [];

  formData: DepartmentModel = {
    departmentId: 0,
    abbreviation: '',
    departmentName: '',
    isActive: true
  };

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!id;
    this.loadDepartmentList(id ? +id : null);
  }

  loadDepartmentList(editId: number | null) {
    this.departmentService.get().subscribe({
      next: (res: DepartmentModel[]) => {
        this.departmentList = res ?? [];
        if (editId) {
          const dept = this.departmentList.find(d => d.departmentId === editId);
          if (dept) this.formData = { ...dept };
        }
      },
      error: () => {
        this.toaster.show('Error loading departments!', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  checkDuplicateDepartment() {
    if (!this.formData.departmentName) {
      this.departmentExists = false;
      return;
    }
    const name = this.formData.departmentName.trim().toLowerCase();
    this.departmentExists = this.departmentList.some(d =>
      d.departmentId !== this.formData.departmentId &&
      d.departmentName?.trim().toLowerCase() === name
    );
  }

  onSubmit(form: any) {
    if (!form.valid || this.departmentExists) return;
    this.loader.show();

    if (this.isEditMode) {
      this.formData.modifiedDate = new Date().toISOString();
      this.departmentService.update(this.formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show('Department updated successfully', { classname: 'bg-success text-white', delay: 5000 });
          this.router.navigate(['/department-master']);
        },
        error: () => {
          this.loader.hide();
          this.toaster.show('Error updating department!', { classname: 'bg-warning text-white', delay: 5000 });
        }
      });
    } else {
      this.formData.createdDate = new Date().toISOString();
      this.departmentService.create(this.formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show('Department created successfully!', { classname: 'bg-success text-white', delay: 5000 });
          this.router.navigate(['/department-master']);
        },
        error: () => {
          this.loader.hide();
          this.toaster.show('Error creating department!', { classname: 'bg-warning text-white', delay: 5000 });
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/department-master']);
  }
}