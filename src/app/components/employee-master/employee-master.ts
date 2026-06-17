import {
  Component,
  Input,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Gender } from '../../constant';
import { EmployeeMasterService } from '../../core/services/employee-master';
import { DealerService } from '../../core/services/dealer-service';
import { LocationMasterService } from '../../core/services/location-master-service';
import { DepartmentService } from '../../core/services/department';
import { DesignationService } from '../../core/services/designation';


@Component({
  selector: 'app-employee-master',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './employee-master.html',

  styleUrls: ['./employee-master.scss']
})

export class EmployeeMasterComponent
  implements OnInit {

  // =====================================
  // INPUTS
  // =====================================

  @Input()
  popupData: any;

  @Input()
  isPopupMode: boolean = false;

  // =====================================
  // VARIABLES
  // =====================================

  genders = Gender;

  employeeData: any = {};

  states: any[] = [];

  cities: any[] = [];

  filteredCities: any[] = [];

  selectedFile: File | null = null;

  imagePreview: string | ArrayBuffer | null = null;

  isEditMode: boolean = false;

  departments: any[] = [];

  designations: any[] = [];

  dealerInfo: any = null;

  dealerLocations: any[] = [];

  // =====================================
  // CONSTRUCTOR
  // =====================================
constructor(
  private employeeService: EmployeeMasterService,
  private router: Router,
  private route: ActivatedRoute,
  private dealerMasterService: DealerService,
  private locationService: LocationMasterService,
  private departmentService: DepartmentService,      // add
  private designationService: DesignationService     // add
) { } 

  ngOnInit(): void {

  this.loadStates();
  this.loadCities();
  this.loadDepartments();
  this.loadDesignations();

  // =====================================
  // POPUP EDIT MODE
  // =====================================

  if (this.popupData) {

    this.employeeData = {
      ...this.popupData
    };

    // make dropdown values match the string option values so they preselect
    this.employeeData.department =
      this.popupData.department != null ? String(this.popupData.department) : '';

    this.employeeData.designation =
      this.popupData.designation != null ? String(this.popupData.designation) : '';

      this.employeeData.location =
        this.popupData.locationCode != null ? String(this.popupData.locationCode) : '';

      if (this.popupData.dealerCode) {
        this.loadDealerInfo(this.popupData.dealerCode);
        this.loadDealerLocations(this.popupData.dealerCode);   // load options with correct code
      }

    // format date for the <input type="date"> (needs yyyy-MM-dd)
    this.employeeData.dateOfJoin =
      this.formatDate(this.popupData.dateOfJoin);

    this.imagePreview =
      this.popupData.profileImage;

    this.isEditMode = true;

    // Fetch THIS employee's dealer status
    if (this.popupData.dealerCode) {

      this.loadDealerInfo(
        this.popupData.dealerCode
      );
    }

    setTimeout(() => {

      this.onStateChange();

      this.employeeData.city =
        this.popupData.city;

    }, 300);
  }

  // =====================================
  // ADD MODE — LOGGED-IN DEALER
  // =====================================

  else {

    this.loadLoggedInDealer();
  }
}
// =====================================
// FORMAT DATE FOR <input type="date">
// =====================================
formatDate(value: any): string {

  if (!value) {
    return '';
  }

  const d = new Date(value);

  if (isNaN(d.getTime())) {
    return '';
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}
  // =====================================
  // LOAD DEALER INFO BY CODE
  // =====================================

  loadDealerInfo(dealerCode: string): void {

    this.dealerMasterService
      .getByDealerCode(dealerCode)

      .subscribe({

        next: (response) => {

          this.dealerInfo = response;

          this.loadDealerLocations(
            response.dealerCode
          );
        },

        error: () => {

          this.dealerInfo = null;
        }
      });
  }

  // =====================================
// LOAD LOGGED-IN DEALER
// =====================================

loadLoggedInDealer(): void {

  const dealerCode = localStorage.getItem('dealerCode');   // e.g. "CUS0435"
  if (!dealerCode) return;

  this.employeeData.dealerCode = dealerCode;     // dealer code
  this.generateEmployeeCode(dealerCode);         // employee code only

  this.dealerMasterService.getByDealerCode(dealerCode).subscribe({
    next: (response) => {
      this.dealerInfo = response;
      this.employeeData.dealerCode = response.dealerCode ?? dealerCode;  // still dealer code
      this.loadDealerLocations(response.dealerCode ?? dealerCode);
    },
    error: () => this.loadDealerLocations(dealerCode)
  });
}

// =====================================
// LOAD DEALER LOCATIONS
// =====================================

  loadDealerLocations(dealerCode: string): void {

    this.locationService
      .getLocationByDealerCode(dealerCode)

      .subscribe({

        next: (response: any[]) => {

          this.dealerLocations = (response ?? []).map(l => ({
            locCode: String(l.locCode ?? l.loccode ?? l.Loccode ?? '').trim(),
            locName: l.locName ?? l.locname ?? l.Locname ?? ''
          }));

          if (this.isEditMode && this.popupData?.locationCode != null) {

            const saved = String(this.popupData.locationCode).trim();

            // defer so the <option> elements are rendered first
            setTimeout(() => {
              const match = this.dealerLocations.find(l => l.locCode === saved);
              if (match) {
                this.employeeData.location = match.locCode;
              }
            });
          }
        },

        error: (error) => console.error('Dealer location load error', error)
      });
  }
  // =====================================
  // LOAD STATES
  // =====================================

  loadStates(): void {

    this.employeeService
      .getStates()

      .subscribe({

        next: (response) => {

          this.states = response;
        }
      });
  }

  // =====================================
  // LOAD CITIES
  // =====================================

  loadCities(): void {

    this.employeeService
      .getCities()

      .subscribe({

        next: (response) => {

          this.cities = response;
        }
      });
  }

  // =====================================
  // STATE CHANGE
  // =====================================

  onStateChange(): void {

    const selectedStateId =
      Number(this.employeeData.state);

    this.filteredCities =
      this.cities.filter(

        (x: any) =>
          x.stateId === selectedStateId
      );
  }

  // =====================================
  // SAVE / UPDATE
  // =====================================

  onSubmit(form: any): void {

    const employeeObj = {

      id:
        this.employeeData.id || 0,

      employeeCode:
        this.employeeData.employeeCode,

      firstName:
        this.employeeData.firstName,

      lastName:
        this.employeeData.lastName,

      gender:
        this.employeeData.gender,

      mobile:
        this.employeeData.mobile,

      emailId:
        this.employeeData.emailId,

      password:
        this.employeeData.password,

      address:
        this.employeeData.address,

      state:
        Number(this.employeeData.state),

      city:
        Number(this.employeeData.city),

      pincode:
        this.employeeData.pincode,

      dateOfJoin:
        this.employeeData.dateOfJoin,

      designation:
        this.employeeData.designation,

      department:
        this.employeeData.department,

      dealerCode:
        this.employeeData.dealerCode,

      supervisor:
        this.employeeData.supervisor,

      isActive:
        this.employeeData.isActive ?? true,

      profileImage:
        this.imagePreview as string,

      notes:
        this.employeeData.notes,

      locationCode:
        this.employeeData.location,

      createdBy: 'admin',

      createdDate: new Date(),

      updatedBy: 'admin',

      updatedDate: new Date()
    };

    // UPDATE

    if (this.isEditMode) {

      this.employeeService
        .updateEmployee(employeeObj)

        .subscribe({

          next: () => {

            alert(
              'Employee Updated Successfully'
            );

          }
        });
    }

    // INSERT

    else {

      this.employeeService
        .saveEmployee(employeeObj)

        .subscribe({

          next: () => {

            alert(
              'Employee Saved Successfully'
            );

          }
        });
    }
  }

  // =====================================
  // FILE SELECT
  // =====================================

  onFileSelect(event: any): void {

    this.selectedFile =
      event.target.files[0];

    if (this.selectedFile) {

      const reader = new FileReader();

      reader.onload = (e) => {

        this.imagePreview =
          e.target?.result!;
      };

      reader.readAsDataURL(
        this.selectedFile
      );
    }
  }

  // =====================================
// LOAD DEPARTMENTS
// =====================================
loadDepartments(): void {

  this.departmentService.get().subscribe({

    next: (response: any[]) => {

      this.departments = response ?? [];

      this.syncDepartmentSelection();
    },

    error: (error) => console.error('Department load error', error)
  });
}

// Keep the saved department selected if it exists in the list,
// otherwise reset to '' so the "Select Department" placeholder shows
syncDepartmentSelection(): void {

  const current = this.employeeData?.department;

  if (current == null || current === '') {
    return;
  }

  const val = String(current);

  this.employeeData.department =
    this.departments.some(d => String(d.departmentId) === val) ? val : '';
}

// =====================================
// LOAD DESIGNATIONS
// =====================================
loadDesignations(): void {

  this.designationService.get().subscribe({

    next: (response: any[]) => {

      this.designations = response ?? [];

      this.syncDesignationSelection();
    },

    error: (error) => console.error('Designation load error', error)
  });
}

// Keep the saved designation selected if it exists, otherwise reset to ''
syncDesignationSelection(): void {

  const current = this.employeeData?.designation;

  if (current == null || current === '') {
    return;
  }

  const val = String(current);

  this.employeeData.designation =
    this.designations.some(d => String(d.designationId) === val) ? val : '';
}
  // =====================================
  // BACK
  // =====================================

  backToList(): void {

    this.router.navigate([
      '/employee'
    ]);
  }
    generateEmployeeCode(dealerCode: string): void {

  const baseCode = dealerCode;   // the pure dealer code, e.g. "CUS0435"

  this.employeeService.getEmployees().subscribe({

    next: (employees: any[]) => {

      let maxSeq = 0;

      (employees ?? []).forEach(e => {
        const code: string = e?.employeeCode ?? '';
        if (code.startsWith(baseCode)) {
          const suffix = code.substring(baseCode.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });

      const nextSeq = maxSeq + 1;

      // ONLY the employee code — do NOT touch dealerCode here
      this.employeeData.employeeCode =
        baseCode + nextSeq.toString().padStart(4, '0');
    },

    error: (error) => console.error('Employee code generation error', error)
  });
}
}