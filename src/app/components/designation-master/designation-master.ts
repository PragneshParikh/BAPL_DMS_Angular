import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DesignationService } from '../../core/services/designation';
import { DepartmentService } from '../../core/services/department';
import { DesignationModel } from '../../ViewModels/models/DesignationModel';
import { DepartmentModel } from '../../ViewModels/models/DepartmentModel';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-designation-master',
  imports: [CommonModule, FormsModule],
  templateUrl: './designation-master.html',
  styleUrl: './designation-master.scss',
})
export class DesignationMaster {
  isEditMode = false;
  designationExists = false;
  designationList: DesignationModel[] = [];
  departmentList: DepartmentModel[] = [];

  formData: DesignationModel = {
    designationId: 0,
    abbreviation: '',
    designationName: '',
    departmentId: null,
    isActive: true
  };

  constructor(
    private designationService: DesignationService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService
  ) { }

  ngOnInit() {
    this.loadDepartments();
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!id;
    this.loadDesignationList(id ? +id : null);
  }

  loadDepartments() {
    this.departmentService.get().subscribe({
      next: (res: DepartmentModel[]) => (this.departmentList = res ?? []),
      error: () => { }
    });
  }

  loadDesignationList(editId: number | null) {
    this.designationService.get().subscribe({
      next: (res: DesignationModel[]) => {
        this.designationList = res ?? [];
        if (editId) {
          const desig = this.designationList.find(d => d.designationId === editId);
          if (desig) this.formData = { ...desig };
        }
      },
      error: () => {
        this.toaster.show('Error loading designations!', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  checkDuplicateDesignation() {
    if (!this.formData.designationName) {
      this.designationExists = false;
      return;
    }
    const name = this.formData.designationName.trim().toLowerCase();
    this.designationExists = this.designationList.some(d =>
      d.designationId !== this.formData.designationId &&
      d.designationName?.trim().toLowerCase() === name
    );
  }

  onSubmit(form: any) {
    if (!form.valid || this.designationExists) return;
    this.loader.show();

    if (this.isEditMode) {
      this.formData.modifiedDate = new Date().toISOString();
      this.designationService.update(this.formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show('Designation updated successfully', { classname: 'bg-success text-white', delay: 5000 });
          this.router.navigate(['/designation-master']);
        },
        error: () => {
          this.loader.hide();
          this.toaster.show('Error updating designation!', { classname: 'bg-warning text-white', delay: 5000 });
        }
      });
    } else {
      this.formData.createdDate = new Date().toISOString();
      this.designationService.create(this.formData).subscribe({
        next: () => {
          this.loader.hide();
          this.toaster.show('Designation created successfully!', { classname: 'bg-success text-white', delay: 5000 });
          this.router.navigate(['/designation-master']);
        },
        error: () => {
          this.loader.hide();
          this.toaster.show('Error creating designation!', { classname: 'bg-warning text-white', delay: 5000 });
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/designation-master']);
  }
}