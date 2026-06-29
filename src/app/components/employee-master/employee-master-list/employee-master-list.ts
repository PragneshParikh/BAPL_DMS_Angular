import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeMasterComponent } from '../employee-master';
import { EmployeeMasterService } from '../../../core/services/employee-master';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { DepartmentService } from '../../../core/services/department';
import { DesignationService } from '../../../core/services/designation';
import { RoleService } from '../../../core/services/Deptrole';



@Component({
  selector: 'app-employee-master-list',
  imports: [
    CommonModule,
    RouterLink,
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

  selectedEmployee: any = null;

  showModal: boolean = false;
  locationMap: { [code: string]: string } = {};

  departmentMap: { [id: string]: string } = {};
  designationMap: { [id: string]: string } = {};

  roles: { title: string; value: string }[] = [];
  selectedRoles: string[] = ['Employee'];

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(private employeeService: EmployeeMasterService,
    private locationService: LocationMasterService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private roleService: RoleService
  ) { }

  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

    this.getEmployees();
    this.loadLocations();
    this.loadDepartments();
    this.loadDesignations();
    this.loadRoles();
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
  // GET EMPLOYEES
  // =====================================

  getEmployees(): void {

    this.employeeService
      .getEmployees()

      .subscribe({

        next: (response) => {

          this.employeeList = response;
        },

        error: (error) => {

          console.error(
            'Employee Error',
            error
          );
        }
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
      error: (error) => console.error('Location load error', error)
    });
  }


  getLocationName(code: string): string {
    return this.locationMap[code] ?? '';
  }
  // =====================================
  // OPEN EDIT POPUP
  // =====================================
  openEditPopup(employee: any): void {

    // fetch the full record (includes selectedDepartments + roles from mappings)
    this.employeeService.getEmployeeById(employee.id).subscribe({
      next: (full: any) => {
        this.selectedEmployee = { ...full };
        this.showModal = true;
      },
      error: (err) => {
        console.error('GetById error', err);
        // fallback: open with the row data we already have
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

    // Prevent row click from opening edit popup
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



