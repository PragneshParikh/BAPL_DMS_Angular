// src\app\components\role-master\role-master.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RoleService } from '../../core/services/Deptrole';
import { DepartmentService } from '../../core/services/department';
import { MenuAccessService } from '../../core/services/menu-access.service';
@Component({
  selector: 'app-role-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-master.html',
})
export class RoleMaster implements OnInit {
  readonly SUBMENU_ID = 75;
  canCreate = false;
  canEdit = false;
  roleName = '';
  category = '';
  categories: { id: string; name: string }[] = [];

  isEditMode = false;
  mappingId: number | null = null;   // RoleCategoryMapping.Id
  saving = false;

  constructor(
    private roleService: RoleService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

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
    this.roleService.getMappings().subscribe({
      next: (res: any[]) => {
        const mapping = (res ?? []).find(m => m.id === id);
        if (!mapping) {
          Swal.fire('Not found', 'This role mapping no longer exists.', 'warning');
          this.router.navigate(['/role-master']);
          return;
        }
        this.roleName = mapping.roleName;
        this.category = mapping.category;
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Failed to load role.', 'error');
        this.router.navigate(['/role-master']);
      }
    });
  }

  save(): void {
    if (!this.roleName.trim() || !this.category) {
      Swal.fire('Validation', 'Role name and category are required', 'warning');
      return;
    }

    this.isEditMode ? this.saveEdit() : this.saveAdd();
  }

  // Add mode: just registers the role under a category. Menu access is no
  // longer assigned here — it's assigned per employee, in Employee Master,
  // where checked items resolve into the right role behind the scenes.
  private saveAdd(): void {
    this.saving = true;
    this.roleService.createWithCategory({ name: this.roleName.trim(), category: this.category }).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Saved', 'Role saved and mapped to category', 'success');
        this.router.navigate(['/role-master']);
      },
      error: (err) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Save failed', 'error');
      }
    });
  }

  private saveEdit(): void {
    if (!this.mappingId) return;

    this.saving = true;
    this.roleService.updateMapping(this.mappingId, this.roleName.trim(), this.category).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Saved', 'Role updated', 'success');
        this.router.navigate(['/role-master']);
      },
      error: (err) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Update failed', 'error');
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/role-master']);
  }
}