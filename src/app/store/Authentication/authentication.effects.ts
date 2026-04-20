import { Injectable, Inject, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, exhaustMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthenticationService } from '../../core/services/auth.service';
import { login, loginSuccess, loginFailure, logout, logoutSuccess, Register } from './authentication.actions';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthenticationEffects {
  private actions$ = inject(Actions);

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      tap(() => {
        // Perform any necessary cleanup or side effects before logging out
      }),
      exhaustMap(() => of(logoutSuccess()))
    )
  );

  constructor(
    private AuthenticationService: AuthenticationService,
    private router: Router) { }

}