import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Gender } from '../../constant';

@Component({
  selector: 'app-employee-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './employee-master.html',
  styleUrls: ['./employee-master.scss']
})
export class EmployeeMasterComponent implements OnInit {
  genders = Gender;

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  employeeData: any = {};

  constructor() { }

  ngOnInit(): void { }

  onSubmit(form: any): void {
    console.log('Employee Data:', this.employeeData);
  }
  backToList(): void {

  }
  onFileSelect(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        this.imagePreview = e.target?.result;
      }
      reader.readAsDataURL(this.selectedFile);
    }
  }

}