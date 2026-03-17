import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthenticationService } from './core/services/auth.service';
import { ToastsContainer } from './shared/toaster/toasts-container.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsContainer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isLoggedIn = false;
  protected readonly title = signal('BAPL_DMS_Angular');

  constructor(private authService: AuthenticationService) { }
}
