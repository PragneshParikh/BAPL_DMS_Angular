import { Injectable } from '@angular/core';
import { MENU } from '../../layouts/sidebar/menu';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private baseURL = environment.apiUrl;

  private activeModuleSource = new BehaviorSubject<string>('showroom');
  activeModule$ = this.activeModuleSource.asObservable();

  private menuSource = new BehaviorSubject<any[]>([]);
  menu$ = this.menuSource.asObservable();

  constructor(private httpClient: HttpClient) { }

  filterMenu(module: string) {
    this.activeModuleSource.next(module);

  }
  getMenu() {
    return this.httpClient.get(`${this.baseURL}/menu`);
  }
}