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
    login(email: string, password: string) {

        return this.httpClient.post(this.baseUrl + '/auth', {
            email,
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
     * Returns the current user
     */
    public currentUser(): any {
        return getFirebaseBackend()!.getAuthenticatedUser();
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
        return this.httpClient.post(this.baseUrl + '/auth/forgot-password', { email }, httpOptions).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error: any) => {
                const errorMessage = 'Password reset failed'; // Customize the error message as needed
                return throwError(errorMessage);
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

}

