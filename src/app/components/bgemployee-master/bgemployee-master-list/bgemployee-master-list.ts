//src\app\components\bgemployee-master\bgemployee-master-list\bgemployee-master-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { BgemployeeMaster } from '../bgemployee-master';
import { BgemployeeMasterService } from '../../../core/services/bgemployee-master.service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { DepartmentService } from '../../../core/services/department';
import { DesignationService } from '../../../core/services/designation';
import { RoleService } from '../../../core/services/Deptrole';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';
import { MenuAccessService } from '../../../core/services/menu-access.service';
@Component({
  selector: 'app-bgemployee-master-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    BgemployeeMaster,
  ],
  templateUrl: './bgemployee-master-list.html',
  styleUrl: './bgemployee-master-list.scss',
})
export class BgemployeeMasterList implements OnInit {

  employeeList:  any[] = [];
  filteredList:  any[] = [];

  locationMap:    { [code: string]: string } = {};
  departmentMap:  { [id: string]: string }   = {};
  designationMap: { [id: string]: string }   = {};

  readonly SUBMENU_ID = 76;
  canCreate = false;
  canEdit = false;
  canDownload = false;

  departmentList: any[] = [];
  roles: { title: string; value: string }[]  = [];

  searchQuery    = '';
  selectedDept   = '';
  selectedStatus = '';

  showModal        = false;
  selectedEmployee: any = null;

  get activeCount():     number { return this.employeeList.filter(e =>  e.isActive).length; }
  get inactiveCount():   number { return this.employeeList.filter(e => !e.isActive).length; }
  get departmentCount(): number { return new Set(this.employeeList.map(e => e.department)).size; }

  constructor(
    private bgEmployeeService: BgemployeeMasterService,
    private locationService: LocationMasterService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private roleService: RoleService,
    private toaster: ToastService,
    private loader: LoaderService,
    private menuAccess: MenuAccessService
  ) {
    this.canCreate = this.menuAccess.canCreate(this.SUBMENU_ID);
    this.canEdit = this.menuAccess.canEdit(this.SUBMENU_ID);
    this.canDownload = this.menuAccess.canDownload(this.SUBMENU_ID);
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadLocations();
    this.loadDepartments();
    this.loadDesignations();
    this.loadRoles();
  }

  loadEmployees(): void {
    this.bgEmployeeService.getEmployeeListView().subscribe({
      next: (response: any[]) => {
        this.employeeList = response ?? [];
        this.applyFilters();
      },
      error: (err) => console.error('BG Employee list-view load error', err),
    });
  }

  loadLocations(): void {
    const dealerCode = localStorage.getItem('dealerCode');
    if (!dealerCode) return;

    this.locationService.getLocationByDealerCode(dealerCode).subscribe({
      next: (response: any[]) => {
        this.locationMap = {};
        (response ?? []).forEach(l => {
          const code = l.locCode ?? l.loccode ?? l.Loccode;
          const name = l.locName ?? l.locname ?? l.Locname;
          if (code != null) this.locationMap[code] = name;
        });
      },
      error: (err) => console.error('Location load error', err),
    });
  }

  loadDepartments(): void {
    this.departmentService.get().subscribe({
      next: (response: any[]) => {
        this.departmentList = response ?? [];
        this.departmentMap  = {};
        this.departmentList.forEach(d => {
          if (d.departmentId != null) {
            this.departmentMap[String(d.departmentId)] = d.departmentName;
          }
        });
      },
      error: (err) => console.error('Department load error', err),
    });
  }

  loadDesignations(): void {
    this.designationService.get().subscribe({
      next: (response: any[]) => {
        this.designationMap = {};
        (response ?? []).forEach(d => {
          if (d.designationId != null) {
            this.designationMap[String(d.designationId)] = d.designationName;
          }
        });
      },
      error: (err) => console.error('Designation load error', err),
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (response: any[]) => {
        this.roles = (response ?? []).map(r => ({
          title: r.name ?? r.Name,
          value: r.name ?? r.Name,
        }));
      },
      error: (err) => console.error('Role load error', err),
    });
  }

  getLocationName(code: string): string {
    return this.locationMap[code] ?? '';
  }

  getDepartmentName(id: any): string {
    return this.departmentMap[String(id)] ?? '';
  }

  getDesignationName(id: any): string {
    return this.designationMap[String(id)] ?? '';
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);
    const f = parts[0]?.[0] ?? '';
    const l = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (f + l).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['avatar-blue', 'avatar-green', 'avatar-pink', 'avatar-amber', 'avatar-red'];
    let sum = 0;
    for (const ch of (name || '')) sum += ch.charCodeAt(0);
    return colors[sum % colors.length];
  }

  getZones(emp: any): string[] {
    return (emp.zone || '')
      .split(',')
      .map((z: string) => z.trim())
      .filter((z: string) => z.length > 0);
  }

  getDealerNames(emp: any): string[] {
    return (emp.dealerName || '')
      .split(',')
      .map((d: string) => d.trim())
      .filter((d: string) => d.length > 0);
  }

  formatDate(value: any): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredList = this.employeeList.filter(emp => {

      const matchQuery = !q || [
        emp.employeeName,
        emp.employeeCode,
        emp.dealerCode,
        emp.dealerName,
        emp.zone,
        emp.jobRoles,
        emp.reportingTo,
      ].some(v => String(v ?? '').toLowerCase().includes(q));

      const matchDept   = !this.selectedDept   || String(emp.department) === this.selectedDept;
      const matchStatus = !this.selectedStatus || String(emp.isActive)   === this.selectedStatus;

      return matchQuery && matchDept && matchStatus;
    });
  }

  openEditPopup(employee: any): void {
    this.bgEmployeeService.getEmployeeById(employee.id).subscribe({
      next: (full: any) => {
        this.selectedEmployee = { ...full };
        this.showModal = true;
      },
      error: () => {
        this.selectedEmployee = { ...employee };
        this.showModal = true;
      },
    });
  }

  closePopup(): void {
    this.showModal        = false;
    this.selectedEmployee = null;
    this.loadEmployees();
  }

  toggleStatus(emp: any, event: Event): void {
    event.stopPropagation();

    const newStatus  = !emp.isActive;
    const confirmMsg = newStatus
      ? 'Make this employee Active?'
      : 'Make this employee Inactive?';

    if (!confirm(confirmMsg)) return;

    this.bgEmployeeService.updateStatus(emp.id, newStatus).subscribe({
      next: () => {
        emp.isActive = newStatus;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Status update error', err);
        alert('Failed to update status.');
      },
    });
  }

  // =====================================================
  // EXCEL EXPORT
  // FIX: error handler now surfaces the real failure reason (via the
  // blob-decoding added in BgemployeeMasterService) instead of a generic
  // message with no detail — matches the fix just applied on the
  // Employee list side.
  // =====================================================

  downloadExcel(): void {
    this.loader.show();

    this.bgEmployeeService.downloadBgEmployeeExcel().subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'BgEmployeeList.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);
        this.loader.hide();
        this.toaster.show('BG Employee Excel downloaded successfully', { classname: 'bg-success text-light', delay: 3000 });
      },
      error: (err) => {
        console.error('Excel download error', err);
        this.loader.hide();
        const detail = err?.message ? `: ${err.message}` : '';
        this.toaster.show(`Failed to download BG Employee Excel${detail}`, { classname: 'bg-danger text-white', delay: 6000 });
      }
    });
  }
}