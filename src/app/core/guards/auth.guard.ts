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

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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
            console.error('Invalid menuRights in storage');
            this.authService.logout();      
            this.router.navigate(['/login']);
            return false;
        }

        const subMenuId = route.data[0];

        if (subMenuId === 0) {
            return true;
        }

        if (!subMenuId) {
            this.router.navigate(['/']);
            return false;
        }

        const right = menuRights.find(r => r.subMenuId === subMenuId);

        const hasAccess = right && right.permission > 0;

        if (!hasAccess) {
            this.router.navigate(['/']);
            return false;
        }

        return true;
    }

}