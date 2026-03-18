import { Component, TemplateRef } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from './toast-service';

@Component({
  selector: 'app-toasts',
  template: `
   @for(toast of toastService.toasts;track $index){
    <ngb-toast
      [class]="toast.classname"
      [autohide]="true"
      [delay]="toast.delay || 5000"
      (hidden)="toastService.remove(toast)"
    >
        <div class="d-flex justify-content-between align-items-center">
          <!-- Toast message -->
          <div>
            @if (isTemplate(toast)) {
              <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
            } @else {
              {{ toast.textOrTpl }}
            }
          </div>

          <!-- Close button -->
          <button type="button" class="btn-close btn-sm ms-3" aria-label="Close"
            (click)="toastService.remove(toast)">
          </button>
        </div>
      </ngb-toast>
   }
   `,
  host: { 'class': 'toast-container position-fixed top-0 end-0 p-3', 'style': 'z-index: 1200' },
  standalone: true,
  imports: [NgbToastModule]
})
export class ToastsContainer {
  constructor(public toastService: ToastService) { }

  isTemplate(toast: { textOrTpl: any; }) { return toast.textOrTpl instanceof TemplateRef; }
}
