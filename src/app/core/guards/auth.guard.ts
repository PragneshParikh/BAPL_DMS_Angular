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

        // SuperAdmin / Admin can open every page - same rule the API applies
        // to the sidebar (/api/menu), so menu and page access stay consistent.
        const role = (this.storageService.getRole() || '').toLowerCase().trim();
        if (role === 'superadmin' || role === 'admin') {
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

        // A user can have more than one rights row for a page (two roles, or legacy
        // duplicate rows). Combine them - a 0-permission row must not hide a grant.
        const permission = (menuRights || [])
            .filter(r => Number(r?.subMenuId) === Number(subMenuId))
            .reduce((acc, r) => acc | (Number(r?.permission) || 0), 0);

        const hasAccess = permission > 0;

        if (!hasAccess) {
            this.router.navigate(['/']);
            return false;
        }

        return true;
    }

}