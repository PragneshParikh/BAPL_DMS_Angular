import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    encode(data: any): string {
        return btoa(JSON.stringify(data));
    }

    decode(encoded: string): any {
        return JSON.parse(atob(encoded));
    }

    setUser(user: any) {
        const encoded = this.encode(user);
        localStorage.setItem('currentUser', encoded);
    }

    getUser() {
        const data = localStorage.getItem('currentUser');
        return data ? this.decode(data) : null;
    }

    getUserId() {
        const data = this.getUser();
        return data?.userId;
    }

    getDealerCode() {
        const data = this.getUser();
        return data?.userName;
    }

    clear() {
        localStorage.removeItem('currentUser');
    }
}