//src\app\components\account\login\login.ts
import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/toaster/toast-service';
import { StorageService } from '../../../core/services/storage';
import { MenuService } from '../../../core/services/menu-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit, OnDestroy {
  // 3D scene: page parallax (--mx/--my on the root) and card tilt (--rx/--ry/--gx/--gy on the card)
  @ViewChild('root') private rootRef?: ElementRef<HTMLElement>;
  @ViewChild('stage') private stageRef?: ElementRef<HTMLElement>;
  @ViewChild('card') private cardRef?: ElementRef<HTMLElement>;
  private removeListeners: (() => void)[] = [];
  private frame = 0;

  @Output() loginStatus = new EventEmitter<boolean>();
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  // set the current year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  isLoading = false;

  constructor(private formBuilder: UntypedFormBuilder,
    private zone: NgZone,
    private authenticationService: AuthenticationService,
    private router: Router,
    public toastService: ToastService,
    private storageService: StorageService,
    private menuService: MenuService // fetches this session's granted menu tree after login
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

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  // ---------------------------------------------------------------- 3D effect
  ngAfterViewInit(): void {
    const root = this.rootRef?.nativeElement;
    const stage = this.stageRef?.nativeElement;
    const card = this.cardRef?.nativeElement;
    if (!root || !stage || !card || typeof window === 'undefined') return;
    // no movement for "reduce motion" users or on touch-only screens
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;

    const MAX_TILT = 10; // degrees
    let last: PointerEvent | null = null;

    const paint = () => {
      this.frame = 0;
      const e = last;
      if (!e) return;
      // page parallax
      root.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3));
      // card tilt + glare while the pointer is near the card
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const near = px > -0.25 && px < 1.25 && py > -0.25 && py < 1.25;
      if (near) {
        const cx = Math.min(Math.max(px, 0), 1) - 0.5;
        const cy = Math.min(Math.max(py, 0), 1) - 0.5;
        card.style.setProperty('--ry', `${(cx * 2 * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-cy * 2 * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        card.classList.add('is-tilting');
      } else {
        this.resetTilt(card);
      }
    };

    this.zone.runOutsideAngular(() => {
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        last = e;
        if (!this.frame) this.frame = requestAnimationFrame(paint);
      };
      const onLeave = () => {
        root.style.setProperty('--mx', '0');
        root.style.setProperty('--my', '0');
        this.resetTilt(card);
      };
      root.addEventListener('pointermove', onMove, { passive: true });
      root.addEventListener('pointerleave', onLeave);
      this.removeListeners.push(
        () => root.removeEventListener('pointermove', onMove),
        () => root.removeEventListener('pointerleave', onLeave)
      );
    });
  }

  private resetTilt(card: HTMLElement): void {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.classList.remove('is-tilting');
  }

  ngOnDestroy(): void {
    this.removeListeners.forEach(off => off());
    this.removeListeners = [];
    if (this.frame) cancelAnimationFrame(this.frame);
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

      // A Location Login ID assigned to more than one location comes back
      // this way instead of a token (see AuthController.Login /
      // TryLocationLoginAsync on the backend) since there's no way to know
      // which location to scope the session to yet. There's no
      // location-picker UI wired up here, so for now this just tells the
      // user what happened instead of silently failing or showing a scary
      // "error" toast.
      if (data.requiresLocationSelection) {
        this.toastService.show(
          data.message || 'This login is linked to multiple locations. Please contact your admin.',
          { classname: 'bg-warning text-dark', delay: 4000 }
        );
        this.isLoading = false;
        return;
      }

      if (data.status == 'success') {
        // Surface the location right away, in addition to wherever it ends
        // up being shown persistently (nav bar / dashboard, etc.).
        const successMessage = data.locationCode
          ? `${data.message} — Location: ${data.locationCode}`
          : data.message;
        this.toastService.show(successMessage, { classname: 'bg-success text-white', delay: 2000 });

        this.storageService.setRole(data.role);
        this.storageService.setSelectedModule('ShowRoom');

        // FIX: this used to be gated on `data.userName`, which only the
        // regular email/password login response has. A Location Login
        // response (employeeCode/firstName/lastName, no userName) was
        // silently skipping dealerCode storage entirely. Gate on
        // dealerCode itself instead.
        if (data.dealerCode) {
          localStorage.setItem('dealerCode', data.dealerCode);
        } else {
          localStorage.removeItem('dealerCode');
        }

        // The location this session is scoped to (Location Login only;
        // absent for a normal email/password login). Cleared on a plain
        // login too, so a stale value from an earlier location-based
        // session never lingers.
        if (data.locationCode) {
          localStorage.setItem('locationCode', data.locationCode);
        } else {
          localStorage.removeItem('locationCode');
        }

        // Location Login's location-assigned role (LocationMaster.RoleId),
        // separate from the employee's own category roles. AuthController
        // returns this and embeds it as a "LocationRoleId" JWT claim;
        // storing it here is just for any UI that wants to show/debug it
        // without decoding the token. The actual menu-access endpoint reads
        // the claim server-side, not this value, so this line is
        // informational only.
        if (data.locationRoleId) {
          localStorage.setItem('locationRoleId', data.locationRoleId);
        } else {
          localStorage.removeItem('locationRoleId');
        }

        // Fetch this session's granted forms (location-wise if this was a
        // Location Login, otherwise the employee/dealer's own role-based
        // menu) and push it into MenuService's menu$ stream before
        // navigating away, so the sidebar has something to render on first
        // paint.
        this.menuService.loadMyAccess().subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/']);
          }
          // no error branch needed — loadMyAccess() catches internally and always emits
        });

        return; // skip the isLoading=false below; loadMyAccess's subscribe owns it now
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