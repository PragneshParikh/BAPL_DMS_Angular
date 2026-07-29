import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RoleService } from '../../core/services/Deptrole';
import { DepartmentService } from '../../core/services/department';

@Component({
  selector: 'app-role-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-master.html',
})
export class RoleMaster implements OnInit {
  roleName = '';
  category = '';
  categories: { id: string; name: string }[] = [];

  constructor(
    private roleService: RoleService,
    private departmentService: DepartmentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.departmentService.get().subscribe({
      next: (res: any[]) => {
        this.categories = (res ?? [])
          .filter(d => d.isActive)
          .map(d => ({ id: String(d.departmentId), name: d.departmentName }));
      }
    });
  }

  save(): void {
    if (!this.roleName.trim() || !this.category) {
      Swal.fire('Validation', 'Role name and category are required', 'warning');
      return;
    }
    this.roleService.createWithCategory({ name: this.roleName.trim(), category: this.category }).subscribe({
      next: () => {
        Swal.fire('Saved', 'Role saved and mapped to category', 'success');
        this.router.navigate(['/role-master']);
      },
      error: (err) => Swal.fire('Error', err?.error?.message || 'Save failed', 'error')
    });
  }

  backToList(): void {
    this.router.navigate(['/role-master']);
  }
}