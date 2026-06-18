import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { OemmodelMasterService } from '../../../core/services/oemmodel-master-service';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';
import { FreeServiceRate } from '../free-service-rate';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-free-service-rate-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, NgbPagination],
  templateUrl: './free-service-rate-list.html',
  styleUrl: './free-service-rate-list.scss',
})
export class FreeServiceRateList implements OnInit {
  public searchTerm: string = '';
  dataSource: any[] = [];

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // #region pagination variables
  page = 1;
  pageSize = 10;
  collectionSize = 0;

  isSuperAdmin: boolean;

  oemModel: string = '';

  oemModelList: any[] = [];

  constructor(
    private oemModelMasterService: OemmodelMasterService,
    private loader: LoaderService,
    private toast: ToastService,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.getOEMModelList();
  }

  newFreeServiceRate() {

  }

  onSearch() {

  }

  onPageChange(event: any) {

  }

  addNewOEMRate() {
    const value = Date.now() + '|' + 0;
    const encPO = btoa(value);
    this.route.navigate(['/free-service-rate', encPO], { state: { oemModelList: this.oemModelList } });
  }

  getOEMModelList() {
    this.loader.show();
    this.oemModelMasterService.getOEMModelByStatus(true).subscribe({
      next: (res) => {
        this.oemModelList = res
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.loader.hide();
        this.toast.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }
}
