//src\app\core\services\storage.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    encode(data: any): string {
        return btoa(JSON.stringify(data));
    }

    decode(encoded: string): any {
        try {
            return JSON.parse(atob(encoded));
        } catch (err) {
            // ADDED — a corrupted/non-base64 value should never crash app
            // bootstrap. Log it, clean up the bad key, and return null so
            // callers fall back to "no user" instead of throwing.
            console.warn('StorageService: failed to decode stored value, clearing it.', err);
            return null;
        }
    }

    setUser(user: any) {
        const encoded = this.encode(user);
        localStorage.setItem('currentUser', encoded);
    }

    getUser() {
        const data = localStorage.getItem('currentUser');
        if (!data) return null;

        const decoded = this.decode(data);

        // ADDED — if decode failed, remove the bad entry so future calls
        // don't keep hitting the same corrupted value.
        if (decoded === null) {
            localStorage.removeItem('currentUser');
        }

        return decoded;
    }

    getUserId() {
        const data = this.getUser();
        return data?.userId;
    }

    getDealerCode(): string {
        // Try explicit dealerCode first, fall back to userName
        return localStorage.getItem('dealerCode')
            ?? this.getUser()?.userName
            ?? '';
    }

    setMenuRights(menu) {
        const encode = this.encode(menu);
        localStorage.setItem('menuRights', encode);
    }

    getMenuRights() {
        const data = localStorage.getItem('menuRights');
        if (!data) return null;

        const decoded = this.decode(data);

        if (decoded === null) {
            localStorage.removeItem('menuRights');
        }

        return decoded;
    }

    clear() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedModule');
        localStorage.removeItem('menuRights');
        localStorage.removeItem('role');
    }

    setRole(role: string) {
        localStorage.setItem('role', role);
    }

    getRole(): string {
        return localStorage.getItem('role') || '';
    }

    setSelectedModule(module: string) {
        const encoded = this.encode(module);
        localStorage.setItem('selectedModule', encoded);
    }

    getSelectedModule(): string {
        const data = localStorage.getItem('selectedModule');
        if (!data) return '';

        const decoded = this.decode(data);

        if (decoded === null) {
            localStorage.removeItem('selectedModule');
            return '';
        }

        return decoded;
    }
}