import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { User } from '../../store/Authentication/auth.models';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage';
import { Router } from '@angular/router';


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
    private timeoutId: any;

    protected baseUrl = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
        private storageService: StorageService,
        private ngZone: NgZone,
        private router: Router,
    ) {

        const storedUser = storageService.getUser();
        if (storedUser && storedUser !== 'undefined') {
            this.currentUserSubject.next(storedUser);
        }
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    // initAuth(): void {
    //     const token = localStorage.getItem('token');

    //     if (!token) return;

    //     try {
    //         const payload = JSON.parse(atob(token.split('.')[1]));
    //         const expiry = payload.exp * 1000;

    //         if (expiry <= Date.now()) {
    //             this.logout();
    //         } else {
    //             this.startTokenTimer(token);
    //         }

    //     } catch {
    //         this.logout();
    //     }
    // }

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

                    this.storageService.setUser(user);
                    localStorage.setItem('token', response.token);
                    this.currentUserSubject.next(user);

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
        // this.store.dispatch(logout());
        // logout the user
        // return getFirebaseBackend()!.logout();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedModule');
        localStorage.removeItem('menuRights');
        this.currentUserSubject.next(null!);

        this.ngZone.run(() => {
            this.router.navigate(['/login']);
        });
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
        const permissions = this.storageService.getMenuRights();

        const match = permissions.find((p: any) => p.subMenuId === subMenuId);

        return match.permission;
    }

    startTokenTimer(token: string): void {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            const expiry = payload.exp * 1000; // convert to milliseconds
            const now = new Date().getTime();

            const timeout = expiry - now;

            // If already expired
            if (timeout <= 0) {
                this.logout();
                return;
            }

            console.log(`Token expires in ${Math.floor(timeout / 1000)} seconds`);

            // Clear existing timer
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }

            // Start new timer
            this.timeoutId = setTimeout(() => {
                console.log('Token expired → logging out');
                this.logout();
            }, timeout);

        } catch (error) {
            console.error('Invalid JWT token');
            this.logout();
        }
    }

    getUserList(): Observable<any> {
        return this.httpClient.get(`${this.baseUrl}/auth`);
    }

}

