import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DurationTypes, RateTypes } from '../../constant';
import { CommonModule } from '@angular/common';
import { OemmodelMasterService } from '../../core/services/oemmodel-master-service';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { ItemMasterService } from '../../core/services/item-master-service';
import { ExtendedBatteryWarrantyService } from '../../core/services/extended-battery-warranty';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-extended-battery-warranty',
  imports: [FormsModule, CommonModule],
  templateUrl: './extended-battery-warranty.html',
  styleUrl: './extended-battery-warranty.scss',
})
export class ExtendedBatteryWarranty implements OnInit {

  rateTypes = RateTypes;
  durationTypes = DurationTypes;

  items: any[] = [];
  oemModelsList: any[] = [];

  currentUser: any = {};

  schemeId: number = 0;

  formData: any = {
    id: -1,
    schemeName: '',
    oemmodelId: null,
    rateType: null,
    duration: 0,
    durationType: null,
    Kms: 0,
    dealerPrice: 0,
    customerPrice: 0,
    discountAmount: 0,
    gstPercentage: 0,
    purchaseValidity: 0,
    batteryPartCode: '',
    partCode: '', 
    fromDate: "",
    toDate: null,
    isActive: true,
    createdBy: null,
    createdDate: new Date(),
    updatedBy: null,
    updatedDate: null
  }

  constructor(
    private oemModelService: OemmodelMasterService,
    private router: Router,
    private loader: LoaderService,
    private toast: ToastService,
    private itemMasterService: ItemMasterService,
    private extendedBatteryWarrantyService: ExtendedBatteryWarrantyService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute
  ) {
    this.currentUser = this.storageService.getUser();

    this.activatedRoute.paramMap.subscribe(param => {
      this.schemeId = Number(param.get('id'));
    });

  }

  async ngOnInit() {
    await this.getOEMModelList();
    if (this.schemeId > 0) {
      this.loader.show();
      this.extendedBatteryWarrantyService.getById(this.schemeId).subscribe({
        next: (res) => {
          this.loader.hide();
          this.formData = {
            id: res.id,
            schemeName: res.schemeName,
            oemmodelId: res.oemmodelId,
            rateType: res.rateType,
            duration: res.duration,
            durationType: res.durationType,
            Kms: res.kms,
            dealerPrice: res.dealerPrice,
            customerPrice: res.customerPrice,
            discountAmount: res.discountAmount,
            gstPercentage: res.gstpercentage,
            purchaseValidity: res.purchaseValidity,
            batteryPartCode: res.batteryPartCode,
            partCode: res.partCode, 
            fromDate: new Date(res.fromDate).toISOString().split('T')[0],
            toDate: res.toDate,
            isActive: res.isActive,
            createdBy: res.createdBy,
            createdDate: res.createdDate,
            updatedBy: res.updatedBy,
            updatedDate: res.updatedDate
          }
          this.getSelectedOEMModels(res.oemmodelId);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show("Something went wrong", { classname: 'bg-danger text-white', delay: 5000 });
        }
      })
    }

  }

  getOEMModelList(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.oemModelService.getOEMModelByStatus(true).subscribe({
        next: (res) => {
          this.oemModelsList = res;
          this.loader.hide();
          resolve(res);
        },
        error: (err) => {
          this.loader.hide();
          console.error(err);
          this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
          reject(err);
        }
      })
    });

  }

  onOEMModelChange(event: any) {
    const selectedModel = event.target.value;
    this.getSelectedOEMModels(selectedModel);
  }

  getSelectedOEMModels(selectedModel: any) {
    this.loader.show();
    this.itemMasterService.getItemsByOEMModel(selectedModel).subscribe({
      next: (res) => {
        this.loader.hide();
        this.items = res;
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', { classname: 'bg-danger text-white', delay: 5000 });
      }
    })
  }

  onSubmit(form: any) {
    console.log('Form valid?', form.valid, form.value);
    if (!form.valid) return;

    const isNew = this.schemeId <= 0;

    const payload = {
      ...this.formData,
      ...(isNew
        ? { createdBy: this.currentUser.userName, createdDate: new Date() }
        : { updatedBy: this.currentUser.userName, updatedDate: new Date() }
      )
    };

    const request$ = isNew
      ? this.extendedBatteryWarrantyService.insert(payload)
      : this.extendedBatteryWarrantyService.update(this.schemeId, payload);

    this.loader.show();

    request$.subscribe({
      next: () => {
        this.loader.hide();
        this.backToList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Something went wrong.', {
          classname: 'bg-danger text-white',
          delay: 5000
        });
      }
    });
  }

  backToList() {
    this.router.navigate(['/extended-battery-warranty']);
  }
}
