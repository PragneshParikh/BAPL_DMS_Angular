import { Injectable } from '@angular/core';
import { MENU } from '../../layouts/sidebar/menu';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private baseURL = environment.apiUrl;

  activeMenuModule = 'ShowRoom';
  private activeModuleSource = new BehaviorSubject<string>(this.activeMenuModule);
  activeModule$ = this.activeModuleSource.asObservable();

  private menuSource = new BehaviorSubject<any[]>([]);
  menu$ = this.menuSource.asObservable();

  constructor(private httpClient: HttpClient,
    private storageService: StorageService
  ) {
    this.activeMenuModule = this.storageService.getSelectedModule() || 'ShowRoom';
  }

  filterMenu(module: string) {
    this.activeModuleSource.next(module);

  }

  getMenu() {
    return this.httpClient.get(`${this.baseURL}/menu`);
  }


  getMyAccess(): Observable<{ roleId?: string; groups: any[] }> {
    return this.httpClient.get<{ roleId?: string; groups: any[] }>(`${this.baseURL}/menu/my-access`);
  }


  loadMyAccess(): Observable<any[]> {
    return this.getMyAccess().pipe(
      map(res => res?.groups ?? []),
      tap(groups => {
        this.menuSource.next(groups);
        this.storageService.setMenuRights(groups);
      }),
      catchError(err => {
        console.error('Failed to load menu access', err);
        this.menuSource.next([]);
        this.storageService.setMenuRights([]);
        return of([]);
      })
    );
  }

  resetMenu() {
    this.menuSource.next([]);
    this.activeModuleSource.next('ShowRoom');
    this.storageService.clear();
  }
}