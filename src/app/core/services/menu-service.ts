import { Injectable } from '@angular/core';
import { MENU } from '../../layouts/sidebar/menu';
import { BehaviorSubject } from 'rxjs';
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

  resetMenu() {
    this.menuSource.next([]);
    this.activeModuleSource.next('ShowRoom');
    this.storageService.clear();
  }
}