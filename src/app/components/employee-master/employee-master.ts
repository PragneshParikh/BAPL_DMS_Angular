import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-employee-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-master.html',
  styleUrls: ['./employee-master.scss']
})
export class EmployeeMasterComponent implements OnInit {

  employeeForm!: FormGroup;

  selectedFile: File | null = null;

  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {

    this.initializeForm();

  }

  // ================= INITIALIZE FORM =================

  initializeForm(): void {

    this.employeeForm = this.fb.group({

      id: [0],

      employeeCode: [
        '',
        Validators.required
      ],

      firstName: [
        '',
        Validators.required
      ],

      lastName: [''],

      gender: [
        '',
        Validators.required
      ],

      mobile: [
        '',
        Validators.required
      ],

      emailID: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        Validators.required
      ],

      address: [''],

      state: [''],

      city: [''],

      pincode: [''],

      dateOfJoin: [''],

      designation: [''],

      department: [''],

      dealerCode: [''],

      supervisor: [''],

      isActive: [true],

      profileImage: [''],

      notes: ['']

    });

  }

  // ================= FILE SELECT =================

  onFileSelect(event: any): void {

    if (
      event.target.files &&
      event.target.files.length > 0
    ) {

      this.selectedFile = event.target.files[0];

      // PATCH IMAGE NAME
      this.employeeForm.patchValue({

        profileImage: this.selectedFile.name

      });

      // IMAGE PREVIEW
      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreview = reader.result;

      };

      reader.readAsDataURL(this.selectedFile);

      console.log('Selected File:', this.selectedFile);

    }

  }

  // ================= REMOVE IMAGE =================

  removeImage(): void {

    this.selectedFile = null;

    this.imagePreview = null;

    this.employeeForm.patchValue({

      profileImage: ''

    });

  }

  // ================= SAVE EMPLOYEE =================

  saveEmployee(): void {

    if (this.employeeForm.invalid) {

      this.employeeForm.markAllAsTouched();

      return;

    }

    console.log('Employee Form Data');

    console.log(this.employeeForm.value);

    // =====================================
    // API CALL HERE
    // =====================================

  }

  // ================= RESET FORM =================

  resetForm(): void {

    this.employeeForm.reset({

      id: 0,

      isActive: true

    });

    this.selectedFile = null;

    this.imagePreview = null;

  }

  // ================= FORM CONTROLS =================

  get formControls() {

    return this.employeeForm.controls;

  }

}