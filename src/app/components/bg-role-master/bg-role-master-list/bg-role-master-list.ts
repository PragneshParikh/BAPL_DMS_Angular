import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BgRoleService } from '../../../core/services/bg-role';
import { BgRoleMappingModel } from '../../../ViewModels/models/BgRoleMappingModel';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-bg-role-master-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './bg-role-master-list.html',
  styleUrl: './bg-role-master-list.scss',
})
export class BgRoleMasterList {
  roleList: BgRoleMappingModel[] = [];
  filteredList: BgRoleMappingModel[] = [];
  searchText: string = '';

  constructor(
    private bgRoleService: BgRoleService,
    private router: Router,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loader.show();
    this.bgRoleService.getMappings().subscribe({
      next: (res: BgRoleMappingModel[]) => {
        this.roleList = res ?? [];
        this.applyFilter();
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this.toaster.show('Error fetching BG roles', { classname: 'bg-warning text-white', delay: 5000 });
        console.error('Error loading BG roles:', err);
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
    this.router.navigate(['/bg-role-master/add']);
  }

    onEdit(role: BgRoleMappingModel) {
    this.router.navigate(['/bg-role-master/edit', role.id]);
  }
  onDelete(role: BgRoleMappingModel) {
    if (!confirm(`Remove BG role "${role.roleName}" from category "${role.category}"?`)) return;

    this.loader.show();
    this.bgRoleService.deleteMapping(role.id).subscribe({
      next: () => {
        this.loader.hide();
        this.toaster.show('BG Role mapping removed', { classname: 'bg-success text-white', delay: 5000 });
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