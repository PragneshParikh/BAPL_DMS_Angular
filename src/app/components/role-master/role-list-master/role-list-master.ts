import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService } from '../../../core/services/Deptrole';
import { RoleMappingModel } from '../../../ViewModels/RoleMappingModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-role-master-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list-master.html',
  styleUrl: './role-list-master.scss',
})
export class RoleMasterList {
  roleList: RoleMappingModel[] = [];
  filteredList: RoleMappingModel[] = [];
  searchText: string = '';

  constructor(
    private roleService: RoleService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loader.show();
    this.roleService.getMappings().subscribe({
      next: (res: RoleMappingModel[]) => {
        this.roleList = res ?? [];
        this.applyFilter();
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error fetching roles', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error loading roles:', err);
      }
    });
  }

  applyFilter() {
    const text = this.searchText.trim().toLowerCase();
    this.filteredList = !text
      ? [...this.roleList]
      : this.roleList.filter(r =>
          r.roleName?.toLowerCase().includes(text) ||
          r.category?.toLowerCase().includes(text)
        );
  }

  onAdd() {
    this.router.navigate(['/role-master/add']);
  }

    onEdit(role: RoleMappingModel) {
    this.router.navigate(['/role-master/edit', role.id]);
  }

  onDelete(role: RoleMappingModel) {
    if (!confirm(`Remove role "${role.roleName}" from category "${role.category}"?`)) return;

    this.loader.show();
    this.roleService.deleteMapping(role.id).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('Role mapping removed', { classname: 'bg-success text-white', delay: 5000 });
        this.loadRoles();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error removing mapping!', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error deleting mapping:', err);
      }
    });
  }
}