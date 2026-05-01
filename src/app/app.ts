import { Component, HostListener, OnInit, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { AuthenticationService } from './core/services/auth.service';
import { ToastsContainer } from './shared/toaster/toasts-container.component';
import { CommonModule } from '@angular/common';
import { Loader } from './components/loader/loader';
import { LoaderService } from './core/services/loader';
import { TimeoutService } from './core/services/timeout';
import { StorageService } from './core/services/storage';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsContainer, CommonModule, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isLoggedIn = false;
  protected readonly title = signal('BAPL_DMS_Angular');

  constructor(
    private authService: AuthenticationService,
    private loader: LoaderService,
    private router: Router,
    private timeoutService: TimeoutService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loader.show();
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loader.hide();
      }
    });

    this.timeoutService.startWatching(() => this.authService.logout());

    // this.authService.initAuth();

  }

  // @HostListener('window:beforeunload')
  // handleUnload() {
  //   this.storageService.clear();
  // }

}
