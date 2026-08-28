// src\app\components\bg-role-master\bg-role-master.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { BgRoleService } from '../../core/services/bg-role';
import { BgRoleMappingModel } from '../../ViewModels/models/BgRoleMappingModel';
import { MenuAccessService } from '../../core/services/menu-access.service';

@Component({
  selector: 'app-bg-role-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bg-role-master.html',
})
export class BgRoleMaster implements OnInit {
  roleName = '';

  isEditMode = false;
  mappingId: number | null = null;

  readonly SUBMENU_ID = 100;
  canCreate = false;
  canEdit = false;

  constructor(
    private bgRoleService: BgRoleService,
    private router: Router,
    private route: ActivatedRoute,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
  }

  ngOnInit(): void {
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
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'Failed to load BG role mapping.', 'error');
        this.router.navigate(['/bg-role-master']);
      }
    });
  }

  save(): void {
    if (!this.roleName.trim()) {
      Swal.fire('Validation', 'Role name is required', 'warning');
      return;
    }

    if (this.isEditMode && this.mappingId) {
      this.bgRoleService.updateMapping(this.mappingId, this.roleName.trim()).subscribe({
        next: () => {
          Swal.fire('Saved', 'BG Role updated', 'success');
          this.router.navigate(['/bg-role-master']);
        },
        error: (err) => Swal.fire('Error', err?.error?.message || 'Update failed', 'error')
      });
      return;
    }

    this.bgRoleService.createWithCategory({ name: this.roleName.trim() }).subscribe({
      next: () => {
        Swal.fire('Saved', 'BG Role saved', 'success');
        this.router.navigate(['/bg-role-master']);
      },
      error: (err) => Swal.fire('Error', err?.error?.message || 'Save failed', 'error')
    });
  }

  backToList(): void {
    this.router.navigate(['/bg-role-master']);
  }
}