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
    currentUserValue: any;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    protected baseUrl = environment.apiUrl;

    constructor(private httpClient: HttpClient,
        private store: Store) {

        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser && storedUser !== 'undefined') {

            // Check if storedUser is not null or undefined
            const initialUser = storedUser ? JSON.parse(storedUser) : null;

            this.currentUserSubject = new BehaviorSubject<User | null>(initialUser);
            this.currentUser$ = this.currentUserSubject.asObservable();
        }
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
                const user = response;
                return user;
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
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        this.currentUserSubject.next(null!);
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend()!.forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

}

