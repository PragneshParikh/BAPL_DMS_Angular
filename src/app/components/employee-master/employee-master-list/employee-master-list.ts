import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeMasterComponent } from '../employee-master';
import { EmployeeMasterService } from '../../../core/services/employee-master';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { DepartmentService } from '../../../core/services/department';
import { DesignationService } from '../../../core/services/designation';
import { RoleService } from '../../../core/services/Deptrole';
import { DealerService } from '../../../core/services/dealer-service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { LoaderService } from '../../../core/services/loader';
import { StorageService } from '../../../core/services/storage';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-master-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    EmployeeMasterComponent
  ],
  templateUrl: './employee-master-list.html',
  styleUrl: './employee-master-list.scss',
})

export class EmployeeMasterList
  implements OnInit {

  // =====================================
  // VARIABLES
  // =====================================

  employeeList: any[] = [];
  filteredEmployeeList: any[] = [];

  selectedEmployee: any = null;

  showModal: boolean = false;
  locationMap: { [code: string]: string } = {};

  departmentMap: { [id: string]: string } = {};
  designationMap: { [id: string]: string } = {};

  roles: { title: string; value: string }[] = [];
  selectedRoles: string[] = ['Employee'];

  // ── DEALER FILTER — SuperAdmin only. Everyone else's list is already
  // scoped server-side to their own DealerCode (EmployeeController.Get()),
  // so the dropdown would be redundant/misleading for them. ──
  dealerList: any[] = [];
  selectedDealerCode: string = '';   // '' = All Dealers
  isSuperAdmin: boolean = false;

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(private employeeService: EmployeeMasterService,
    private locationService: LocationMasterService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private roleService: RoleService,
    private dealerService: DealerService,
    private toaster: ToastService,
    private loader: LoaderService,
    private storageService: StorageService
  ) {
    this.isSuperAdmin = this.storageService.getRole()?.toLowerCase() === 'superadmin';
  }

  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

    this.getEmployees();
    this.loadDepartments();
    this.loadDesignations();
    this.loadRoles();

    // Non-SuperAdmins never see cross-dealer data (server enforces this
    // regardless), so there's no reason to even load the dealer dropdown.
    if (this.isSuperAdmin) {
      this.loadDealers();
    }
  }

  loadDepartments(): void {
    this.departmentService.get().subscribe({
      next: (response: any[]) => {
        this.departmentMap = {};
        (response ?? []).forEach(d => {
          if (d.departmentId != null) {
            this.departmentMap[String(d.departmentId)] = d.departmentName;
          }
        });
      },
      error: (error) => console.error('Department load error', error)
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
      error: (error) => console.error('Designation load error', error)
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (response: any[]) => {
        this.roles = (response ?? []).map(r => ({
          title: r.name ?? r.Name,
          value: r.name ?? r.Name
        }));
      },
      error: (error) => console.error('Role load error', error)
    });
  }
  getDepartmentName(id: any): string {
    return this.departmentMap[String(id)] ?? '';
  }

  getDesignationName(id: any): string {
    return this.designationMap[String(id)] ?? '';
  }

  // =====================================
  // DEALER FILTER (SuperAdmin only)
  // =====================================

  loadDealers(): void {
    this.dealerService.getDealerDropdown(null).subscribe({
      next: (response: any) => {
        this.dealerList = response?.data ?? response ?? [];
      },
      error: (error) => console.error('Dealer load error', error)
    });
  }

  getDealerDisplayName(d: any): string {
    const code = d.dealerCode ?? d.DealerCode ?? d.dealercode ?? '';
    const name = d.compname ?? d.dealerName ?? d.DealerName ?? d.CompName ?? '';
    return name ? `${code} - ${name}` : code;
  }

  onDealerFilterChange(): void {
    this.applyDealerFilter();
  }

  applyDealerFilter(): void {
    if (!this.selectedDealerCode) {
      this.filteredEmployeeList = [...this.employeeList];
    } else {
      this.filteredEmployeeList = this.employeeList.filter(
        e => (e.dealerCode ?? '').trim().toLowerCase() === this.selectedDealerCode.trim().toLowerCase()
      );
    }
  }

  // =====================================
  // GET EMPLOYEES
  // =====================================

  getEmployees(): void {

    this.employeeService
      .getEmployees()

      .subscribe({

        next: (response) => {

          this.employeeList = response;
          this.applyDealerFilter();

          // FIX: Location Name wasn't showing for most employees — see
          // loadLocationsForCurrentEmployees() below for the reason. This
          // re-runs on every list refresh, including right after an
          // edit/save (closePopup() calls getEmployees()), so a newly
          // saved employee's location resolves immediately too.
          this.loadLocationsForCurrentEmployees();
        },

        error: (error) => {

          console.error(
            'Employee Error',
            error
          );
        }
      });
  }

  // =====================================
  // LOAD LOCATIONS
  // FIX: this used to be loadLocations(), which only fetched locations for
  // the CURRENTLY LOGGED-IN user's own dealerCode (read from localStorage).
  // That's why Location Name only ever resolved for that one dealer's
  // employees and stayed permanently blank for every other dealer's
  // employees — editing/saving changed nothing because locationMap never
  // contained THAT dealer's codes to begin with, regardless of what was
  // saved.
  //
  // Now we look at whichever employees are actually loaded, collect every
  // distinct DealerCode among them, and fetch + merge each dealer's
  // locations into locationMap. Works whether this list is scoped to one
  // dealer or showing SuperAdmin's "All Dealers" view.
  // =====================================
  loadLocationsForCurrentEmployees(): void {
    const dealerCodes = Array.from(
      new Set(
        (this.employeeList ?? [])
          .map(e => (e.dealerCode ?? '').trim())
          .filter(code => !!code)
      )
    );

    if (dealerCodes.length === 0) return;

    dealerCodes.forEach(dealerCode => {
      this.locationService.getLocationByDealerCode(dealerCode).subscribe({
        next: (response: any[]) => {
          (response ?? []).forEach(l => {
            const code = l.locCode ?? l.loccode ?? l.Loccode;
            const name = l.locName ?? l.locname ?? l.Locname;
            if (code != null) {
              this.locationMap[String(code).trim()] = name;
            }
          });
        },
        error: (error) => console.error(`Location load error for dealer ${dealerCode}`, error)
      });
    });
  }

  // Handles a single location code or a comma-separated list of codes
  // (an employee can be assigned to more than one dealer location).
  getLocationName(code: string): string {
    if (!code) return '';

    return String(code)
      .split(',')
      .map(c => c.trim())
      .filter(c => !!c)
      .map(c => this.locationMap[c])
      .filter(name => !!name)
      .join(', ');
  }

  // =====================================
  // EXCEL EXPORT
  // =====================================

  downloadExcel(): void {
    this.loader.show();

    this.employeeService.downloadEmployeeExcel(this.selectedDealerCode || null).subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.selectedDealerCode
          ? `EmployeeList_${this.selectedDealerCode}.xlsx`
          : 'EmployeeList_All.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);
        this.loader.hide();
        this.toaster.show('Employee Excel downloaded successfully', { classname: 'bg-success text-light', delay: 3000 });
      },
      error: (err) => {
        console.error('Excel download error', err);
        this.loader.hide();
        this.toaster.show('Failed to download Employee Excel', { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  // =====================================
  // OPEN EDIT POPUP
  // =====================================
  openEditPopup(employee: any): void {

    this.employeeService.getEmployeeById(employee.id).subscribe({
      next: (full: any) => {
        this.selectedEmployee = { ...full };
        this.showModal = true;
      },
      error: (err) => {
        console.error('GetById error', err);
        this.selectedEmployee = { ...employee };
        this.showModal = true;
      }
    });
  }

  // =====================================
  // CLOSE POPUP
  // =====================================
  closePopup(): void {
    this.showModal = false;
    this.selectedEmployee = null;
    this.getEmployees();
  }

  // =====================================
  // TOGGLE ACTIVE / INACTIVE
  // =====================================

  toggleStatus(emp: any, event: Event): void {

    event.stopPropagation();

    const newStatus = !emp.isActive;

    const confirmMsg = newStatus
      ? 'Make this employee Active?'
      : 'Make this employee Inactive?';

    if (!confirm(confirmMsg)) {
      return;
    }

    const employeeObj = {
      ...emp,
      isActive: newStatus
    };

    this.employeeService
      .updateEmployee(employeeObj)

      .subscribe({

        next: () => {

          emp.isActive = newStatus;
        },

        error: (error) => {

          console.error(
            'Status Update Error',
            error
          );

          alert('Failed to update status');
        }
      });
  }
}