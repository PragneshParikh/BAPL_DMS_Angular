import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeMasterComponent } from '../employee-master';
import { EmployeeMasterService } from '../../../core/services/employee-master';

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

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(private employeeService: EmployeeMasterService) { }

  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

    this.getEmployees();
  }

  // =====================================
  // GET EMPLOYEES
  // =====================================

  getEmployees(): void {

    this.employeeService
      .getEmployees()

      .subscribe({

        next: (response) => {

          console.log(
            'Employee List',
            response
          );

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

  // =====================================
  // OPEN EDIT POPUP
  // =====================================

  openEditPopup(employee: any): void {

    this.selectedEmployee = {
      ...employee
    };

    this.showModal = true;
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