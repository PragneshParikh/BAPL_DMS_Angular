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

import { EmployeeMasterService }
from '../../core/services/employee-master.service';

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

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(
    private employeeService:
    EmployeeMasterService,

    private router: Router,

    private route: ActivatedRoute
  ) { }

  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

    this.loadStates();

    this.loadCities();

    // =====================================
    // POPUP EDIT MODE
    // =====================================

    if (this.popupData) {

      this.employeeData = {
        ...this.popupData
      };

      this.imagePreview =
        this.popupData.profileImage;

      this.isEditMode = true;

      setTimeout(() => {

        this.onStateChange();

        this.employeeData.city =
          this.popupData.city;

      }, 300);
    }
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
  // BACK
  // =====================================

  backToList(): void {

    this.router.navigate([
      '/employee'
    ]);
  }
}