import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Auth Services
import { AuthenticationService } from '../services/auth.service';
import { RolewiseMenuService } from '../services/rolewisemenu-service';
import { StorageService } from '../services/storage';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
    constructor(
        private router: Router,
        private roleMenuService: RolewiseMenuService,
        private authService: AuthenticationService,
        private storageService: StorageService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const currentUser = this.authService.currentUserValue;

        if (!currentUser) {
            this.router.navigate(['/login']);
            return false;
        }

        const requestedUrl = state.url;

        if (requestedUrl === '/' || requestedUrl === '') {
            return true;
        }

        let menuRights: any[] = [];

        try {
            menuRights = this.storageService.getMenuRights();
        } catch (e) {
            console.error('Invalid menuRights in localStorage');
            this.router.navigate(['/login']);
            return false;
        }

        const hasAccess = menuRights.some(m =>
            requestedUrl.includes(m.pathName) ||
            requestedUrl.includes(m.subMenuId)
        );

        if (!hasAccess) {
            this.router.navigate(['/']);
            return false;
        }

        return true;
    }
}