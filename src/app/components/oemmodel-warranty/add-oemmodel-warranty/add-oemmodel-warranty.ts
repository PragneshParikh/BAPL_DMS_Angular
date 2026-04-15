import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { OemModelWarranty } from '../../../ViewModels/OemModelWarranty';
import { OemmodelWarrantyService } from '../../../core/services/oemmodel-warranty-service';
import { OemmodelMasterService } from '../../../core/services/oemmodel-master-service';
import { OemModelViewModel } from '../../../ViewModels/OemModelViewModel';

import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-add-oemmodel-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-oemmodel-warranty.html',
  styleUrl: './add-oemmodel-warranty.scss',
})
export class AddOemmodelWarranty implements OnInit {

  isEditMode = false;
  id: number = 0;

  oemModels: OemModelViewModel[] = [];

  today: string = new Date().toISOString().split('T')[0];

  minEffectiveDate: string | null = null;

  formData: OemModelWarranty = {
    oemmodelId: 0,
    effectiveDate: '',
    odoreading: 0,
    durationType: '',
    duration: 0,
    isB2b: false
  };

  constructor(
    private service: OemmodelWarrantyService,
    private oemService: OemmodelMasterService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private toaster: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOEMModels();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam && !isNaN(Number(idParam))) {
        this.isEditMode = true;
        this.id = Number(idParam);
        this.getById();
      }
    });
  }

  // =========================
  // LOAD OEM MODELS
  // =========================
  loadOEMModels(): void {
    this.loader.show();

    this.oemService.getAllOEMModels().subscribe({
      next: (res: any[]) => {
        this.oemModels = res.filter(x => x.isActive);

        // default selection
        if (this.oemModels.length > 0 && !this.isEditMode) {
          this.formData.oemmodelId = this.oemModels[0].id;
          this.formData.durationType = 'YEAR';
          this.formData.duration = 3;
          this.formData.odoreading = 36000;
          this.formData.effectiveDate = this.today;

          this.onModelChange();
        }

        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toaster.show('Failed to load OEM Models', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // =========================
  // EDIT LOAD
  // =========================
  getById(): void {
   // this.loader.show();

    this.service.getById(this.id).subscribe({
      next: (res) => {
        this.formData = {
          ...res,
          effectiveDate: res.effectiveDate
            ? res.effectiveDate.split('T')[0]
            : ''
        };

        this.onModelChange();
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.toaster.show('Failed to fetch data', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // =========================
  // MODEL CHANGE → GET MIN DATE
  // =========================
  onModelChange(): void {
    if (!this.formData.oemmodelId) return;

    this.service.getLastEffectiveDate(this.formData.oemmodelId)
      .subscribe({
        next: (res: any) => {
          this.minEffectiveDate = res;
          this.setDefaultEffectiveDate();
        },
        error: () => {
          this.minEffectiveDate = this.today;
        }
      });
  }

  // =========================
  // FINAL MIN DATE LOGIC
  // =========================
  get effectiveMinDate(): string {
  const base = this.minEffectiveDate
    ? this.minEffectiveDate
    : this.today;

  return this.addOneDay(base); // ✅ +1 day
}


private addOneDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}
  // =========================
  // AUTO SET VALID DATE
  // =========================
  setDefaultEffectiveDate(): void {
    const min = this.effectiveMinDate;
  if (this.isEditMode) return;

    if (!this.formData.effectiveDate || this.formData.effectiveDate < min) {
      this.formData.effectiveDate = min;
    }
  }

  // =========================
  // SUBMIT
  // =========================
  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.toaster.show('Invalid form', {
        classname: 'bg-warning text-white',
        delay: 5000
      });
      return;
    }

    this.loader.show();

    const payload = { ...this.formData };

    const request$ = this.isEditMode
      ? this.service.update(this.id, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.loader.hide();
        this.router.navigate(['/oemmodel-warranty']);
      },
      error: () => {
        this.loader.hide();
        this.toaster.show('Operation failed', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  // =========================
  // CANCEL
  // =========================
  onCancel(): void {
    this.router.navigate(['/oemmodel-warranty']);
  }
}