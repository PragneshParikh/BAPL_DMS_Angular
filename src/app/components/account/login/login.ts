import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  @Output() loginStatus = new EventEmitter<boolean>();
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  // set the current year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  isLoading = false;

  constructor(private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router,
    public toastService: ToastService,
    private storageService: StorageService
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (localStorage.getItem('currentUser')) {
      this.router.navigate(['/']);
    }
    /**
     * Form Validatyion
     */
    // this.loginForm = this.formBuilder.group({
    //   username: ['CUS0435', [Validators.required]],
    //   password: ['Dealer@123', [Validators.required]],

    // });

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
    // get return url from route parameters or default to '/'
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }
  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;
    this.isLoading = true;

    this.authenticationService.login(this.f['username'].value, this.f['password'].value).subscribe((data: any) => {
      if (data.status == 'success') {
        this.toastService.show(data.message, { classname: 'bg-success text-white', delay: 2000 });
        this.storageService.setRole(data.role);
        this.storageService.setSelectedModule('ShowRoom');
        if (data.userName) {
          localStorage.setItem('dealerCode', data.dealrCode);
        }
        this.router.navigate(['/']);
      } else {
        this.toastService.show(data.message, { classname: 'bg-danger text-white', delay: 2000 });
      }
      this.isLoading = false;
    }, error => {
      console.error('Login error:', error);
      this.toastService.show('An error occurred during login. Please try again.', { classname: 'bg-danger text-white', delay: 5000 });
      this.isLoading = false;
    });

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

  }
}
