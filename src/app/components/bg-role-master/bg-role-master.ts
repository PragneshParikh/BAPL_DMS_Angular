import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BgRoleService } from '../../core/services/bg-role';
import { DepartmentService } from '../../core/services/department';
import { BgRoleMappingModel } from '../../ViewModels/models/BgRoleMappingModel';

@Component({
  selector: 'app-bg-role-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bg-role-master.html',
})
export class BgRoleMaster implements OnInit {
  roleName = '';
  category = '';
  categories: { id: string; name: string }[] = [];

  isEditMode = false;
  mappingId: number | null = null;

  constructor(
    private bgRoleService: BgRoleService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.departmentService.get().subscribe({
      next: (res: any[]) => {
        this.categories = (res ?? [])
          .filter(d => d.isActive)
          .map(d => ({ id: String(d.departmentId), name: d.departmentName }));
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.mappingId = +idParam;
      this.loadMapping(this.mappingId);
    }
  }

  private loadMapping(id: number): void {
    this.bgRoleService.getMappings().subscribe({
      next: (res: BgRoleMappingModel[]) => {
        const mapping = (res ?? []).find(m => m.id === id);
        if (!mapping) {
          Swal.fire('Not found', 'This BG role mapping no longer exists.', 'warning');
          this.router.navigate(['/bg-role-master']);
          return;
        }
        this.roleName = mapping.roleName;
        this.category = mapping.category;
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Failed to load BG role mapping.', 'error');
        this.router.navigate(['/bg-role-master']);
      }
    });
  }

  save(): void {
    if (!this.roleName.trim() || !this.category) {
      Swal.fire('Validation', 'Role name and category are required', 'warning');
      return;
    }

    if (this.isEditMode && this.mappingId) {
      this.bgRoleService.updateMapping(this.mappingId, this.roleName.trim(), this.category).subscribe({
        next: () => {
          Swal.fire('Saved', 'BG Role updated', 'success');
          this.router.navigate(['/bg-role-master']);
        },
        error: (err) => Swal.fire('Error', err?.error?.message || 'Update failed', 'error')
      });
      return;
    }

    this.bgRoleService.createWithCategory({ name: this.roleName.trim(), category: this.category }).subscribe({
      next: () => {
        Swal.fire('Saved', 'BG Role saved and mapped to category', 'success');
        this.router.navigate(['/bg-role-master']);
      },
      error: (err) => Swal.fire('Error', err?.error?.message || 'Save failed', 'error')
    });
  }

  backToList(): void {
    this.router.navigate(['/bg-role-master']);
  }
}