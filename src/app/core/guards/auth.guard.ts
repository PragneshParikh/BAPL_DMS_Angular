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

        const findRoute = (routes: any[], url: string): any | null => {
            for (const r of routes) {
                const fullPath = '/' + r.path;
                if (url.startsWith(fullPath)) {
                    return r;
                }
                if (r.children && r.children.length) {
                    const childMatch = findRoute(r.children, url);
                    if (childMatch) return childMatch;
                }
            }
            return null;
        };

        const matchingRoute = findRoute(this.router.config, requestedUrl);

        if (!matchingRoute) {
            this.router.navigate(['/']);
            return false;
        }

        const routePermissions: number[] = matchingRoute.data || [];

        const hasAccess = routePermissions.length === 0 ||
            routePermissions.some(p =>
                menuRights.some(m => m.permission === p)
            );

        if (!hasAccess) {
            this.router.navigate(['/']);
            return false;
        }

        return true;
    }

}