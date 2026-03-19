import { Injectable } from '@angular/core';
import { getFirebaseBackend } from '../../authUtils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { GlobalComponent } from "../../global-component";
import { Store } from '@ngrx/store';
import { User } from '../../store/Authentication/auth.models';
import { loginFailure, logout } from '../../store/Authentication/authentication.actions';
import { environment } from '../../../environments/environment';

// const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({ providedIn: 'root' })

/**
 * Auth-service Component
 */
export class AuthenticationService {

    user!: User;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    protected baseUrl = environment.apiUrl;

    constructor(private httpClient: HttpClient,
        private store: Store) {

        const storedUser = localStorage.getItem('currentUser');
        if (storedUser && storedUser !== 'undefined') {
            this.currentUserSubject.next(JSON.parse(storedUser));
        }
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(username: string, password: string) {

        return this.httpClient.post(this.baseUrl + '/auth', {
            username,
            password
        }, httpOptions).pipe(
            map((response: any) => {
                if (response.status === 'success') {
                    const user: any = response;

                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('token', response.token);
                    this.currentUserSubject.next(user); // 🔑 this is key for AuthGuard

                    return response;
                } else {
                    return response;
                }
            }),
            catchError((error: any) => {
                const errorMessage = 'Login failed'; // Customize the error message as needed
                return throwError(errorMessage);
            })
        );
    }

    /**
     * Logout the user
     */
    logout() {
        this.store.dispatch(logout());
        // logout the user
        // return getFirebaseBackend()!.logout();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedModule');
        localStorage.removeItem('menuRights');
        this.currentUserSubject.next(null!);
    }

    forgotPassword(email: string) {
        return this.httpClient
            .post<{ success: boolean; message: string }>(
                `${this.baseUrl}/auth/forgot-password`,
                { email }
            )
            .pipe(
                map((response) => {
                    // If the API returns a valid object, just pass it along
                    return response;
                }),
                catchError((error) => {
                    console.error('Forgot password API error:', error);

                    // Wrap the error in the same object shape so component code works
                    const fallback = { success: false, message: 'Password reset failed. Please try again.' };
                    return throwError(fallback);
                })
            );
    }

    resetPassword(email: string, token: string, password: string, confirmPassword: string) {
        return this.httpClient.post(this.baseUrl + '/auth/reset-password', { email, token, password, confirmPassword }, httpOptions).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error: any) => {
                const errorMessage = 'Password reset failed'; // Customize the error message as needed
                return throwError(errorMessage);
            })
        );

    }

    getAccessPermission(subMenuId: number) {
        const permissions = JSON.parse(localStorage.getItem('menuRights') || '[]');

        const match = permissions.find((p: any) => p.subMenuId === subMenuId);

        return match.permission;
    }

}

