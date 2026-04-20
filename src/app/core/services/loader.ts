import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  private timeout: any;

  show() {
    this.timeout = setTimeout(() => {
      document.body.classList.add('loading');
      this.loading.next(true);
    })
  }

  hide() {
    clearTimeout(this.timeout);
    document.body.classList.remove('loading');
    this.loading.next(false);
  }

}