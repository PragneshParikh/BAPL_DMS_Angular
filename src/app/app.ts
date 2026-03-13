import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from "./components/login/login";
import { AuthenticationService } from './core/services/auth.service';
import { ToastsContainer } from './shared/toaster/toasts-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, ToastsContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isLoggedIn = false;
  protected readonly title = signal('BAPL_DMS_Angular');

  /**
   *
   */
  constructor(private authService: AuthenticationService) {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user; // true if user exists, false if null
    });
  }

  handleLogin(status: boolean) {
    this.isLoggedIn = status;
    console.log('Received from child:', status);
  }
}
