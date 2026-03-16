import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { defineElement } from "@lordicon/element";
import lottie from 'lottie-web';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [NgbCarouselModule, CommonModule, ReactiveFormsModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  passresetForm!: UntypedFormGroup;
  // set the current year
  year: number = new Date().getFullYear();
  showNavigationArrows: any;
  submitted = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authservice: AuthenticationService
  ) {
    defineElement(lottie.loadAnimation);

    this.passresetForm = this.formBuilder.group({
      email: ['', [Validators.required]]
    });
  }
  // convenience getter for easy access to form fields
  get f() { return this.passresetForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.passresetForm.invalid) {
      return;
    }

    this.authservice.forgotPassword(this.passresetForm.value.email).subscribe(
      (response) => {
        console.log('Password reset email sent successfully:', response);
        // You can show a success message to the user here
      },
      (error) => {
        console.error('Error sending password reset email:', error);
        // You can show an error message to the user here
      }
    );
  }

}
