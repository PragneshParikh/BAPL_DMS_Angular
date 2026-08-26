import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/toaster/toast-service';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-who-am-i',
  imports: [FormsModule, CommonModule],
  templateUrl: './who-am-i.html',
  styleUrl: './who-am-i.scss',
})
export class WhoAmI {
  model = {
    email: ''
  };

  result: { found: boolean; isDefaultPassword: boolean; message: string } | null = null;
  loading = false;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private router: Router,
    private storageService: StorageService
  ) {}

  fetch() {
    if (!this.model.email) {
      this.toast.show('Please enter a dealer email.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    this.loading = true;
    this.result = null;

    this.http.post<any>(`${environment.apiUrl}/auth/check-default-password`, { email: this.model.email })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.result = res;
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.toast.show('Failed to check password status.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
  }

  forceReset() {
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/auth/admin-reset-password`, { email: this.model.email })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.show(res.message, { classname: 'bg-success text-white', delay: 6000 });
          this.result = { found: true, isDefaultPassword: true, message: res.message };
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.toast.show('Reset failed.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
  }

  // ADDED — SuperAdmin logs in AS this dealer, using a fresh token issued
  // by the backend. The dealer's own password is never touched or seen.
  // This is logged server-side in ImpersonationLog for full traceability.
  impersonate() {
    if (!this.model.email) {
      this.toast.show('Please enter a dealer email.', { classname: 'bg-warning text-dark', delay: 3000 });
      return;
    }

    this.loading = true;

    this.http.post<any>(`${environment.apiUrl}/auth/impersonate`, { email: this.model.email })
      .subscribe({
        next: (res) => {
          this.loading = false;

          // Replace the current SuperAdmin session with the impersonated
          // dealer's session — mirrors what Login component does on success.
          localStorage.setItem('currentUser', JSON.stringify(res));
          if (res.dealerCode) {
            localStorage.setItem('dealerCode', res.dealerCode);
          }
          this.storageService.setSelectedModule('ShowRoom');

          this.toast.show(res.message, { classname: 'bg-success text-white', delay: 4000 });
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.toast.show('Impersonation failed. Dealer may not exist.', { classname: 'bg-danger text-white', delay: 5000 });
        }
      });
  }
}