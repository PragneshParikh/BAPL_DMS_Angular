import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';
import { FreeServiceRateService } from '../../core/services/free-service-rate';
import { identity } from 'lodash';
import { threadId } from 'worker_threads';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-free-service-rate',
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule],
  templateUrl: './free-service-rate.html',
  styleUrl: './free-service-rate.scss',
})
export class FreeServiceRate implements OnInit {

  oemModelList: any[] = [];

  claimId: number = 0;
  dataSource: any[] = [
    { srNo: 1, serviceId: 1, serviceName: '1st Free Service', metroRate: 0, metroGST: 0, nonMetroRate: 0, nonMetroGST: 0 },
    { srNo: 2, serviceId: 2, serviceName: '4th Free Service', metroRate: 0, metroGST: 0, nonMetroRate: 0, nonMetroGST: 0 }
  ];

  isEdit: boolean = false;
  formData: any = {
    effectiveDate: '',
    modelId: ''
  };

  constructor(
    private route: ActivatedRoute,
    private loader: LoaderService,
    private toast: ToastService,
    private freeServiceRateService: FreeServiceRateService,
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.oemModelList = history.state.oemModelList || [];

    this.route.params.subscribe(params => {

      const encPO = params['id'];
      const decoded = atob(encPO);

      this.claimId = Number(decoded.split('|')[1]);
      if (this.claimId && this.claimId !== 0) {
        this.isEdit = true;
        this.getClaimDetailsById(this.claimId);
      } else {
        this.isEdit = false;
      }
    });
  }

  getClaimDetailsByOEMModelId(OEMModelId: number) {

  }

  saveRates() {
    this.loader.show();

    this.dataSource = this.dataSource.map(item => ({
      ...item,
      id: 0,
      oemmodelId: this.formData.modelId,
      effectiveDate: this.formData.effectiveDate,
      createdBy: this.storageService.getUserId(),
      createdDate: new Date()
    }));

    this.freeServiceRateService.insert(this.dataSource).subscribe({
      next: (res) => {
        this.loader.hide();
        this.toast.show("Record inserted sucessfully.", { classname: 'bg-success text-white', delay: 5000 })
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  backToList() {
    this.router.navigate(['/free-service-rate']);
  }

  getClaimDetailsById(OEMModelId) {
    this.loader.show();
    this.freeServiceRateService.getByOEMModelId(null).subscribe({
      next: (res) => {
        const response = res[0];

        this.formData.effectiveDate = this.formatDate(response.effectiveDate);;
        this.formData.modelId = response.oemModelId;
        console.log(response);

        this.dataSource = this.dataSource.map(item => {
          const service = response.services.find(
            (s: any) => s.serviceId === item.serviceId
          );

          return service
            ? {
              ...item,
              metroRate: service.metroRate,
              metroGST: service.metroGst,
              nonMetroRate: service.nonMetroRate,
              nonMetroGST: service.nonMetroGst
            }
            : item;
        });
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

}
