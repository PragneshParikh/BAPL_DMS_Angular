import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimeoutService {
  private timeout: any;
  private readonly idleTime = 15 * 60 * 1000; // 15 minutes

  startWatching(logoutCallback: () => void) {
    this.resetTimer(logoutCallback);

    ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
      window.addEventListener(event, () => this.resetTimer(logoutCallback));
    });
  }

  resetTimer(logoutCallback: () => void) {
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      console.log('Auto logout after 15 min inactivity');
      logoutCallback();
    }, this.idleTime);
  }
}