// module.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  private moduleSource = new BehaviorSubject<string>(
    localStorage.getItem('activeModule') || 'showroom'
  );

  activeModule$ = this.moduleSource.asObservable();

  setModule(module: string) {
    localStorage.setItem('activeModule', module);
    this.moduleSource.next(module);
  }

}