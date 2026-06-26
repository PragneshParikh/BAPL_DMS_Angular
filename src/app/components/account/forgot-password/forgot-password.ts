import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { defineElement } from "@lordicon/element";
import lottie from 'lottie-web';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { Router } from '@angular/router';

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

  isLoading = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authservice: AuthenticationService,
    private toastService: ToastService,
    private router: Router
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

    this.isLoading = true;

    this.authservice.forgotPassword(this.passresetForm.value.email).subscribe(
      (response: { success: boolean; message: string }) => {
        this.isLoading = false;

        if (response.success) {
          this.toastService.show(response.message, {
            classname: 'bg-success text-white',
            delay: 5000
          });

          this.passresetForm.reset();
        } else {
          this.toastService.show(response.message, {
            classname: 'bg-warning text-white',
            delay: 5000
          });
          console.warn('Password reset failed:', response);
        }
      },
      (error) => {
        this.isLoading = false;
        this.toastService.show('An error occurred while sending the password reset email. Please try again.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
        console.error('Error sending password reset email:', error);
      }
    );


  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

}
