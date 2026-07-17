import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemMasterService } from '../../core/services/item-master-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';

@Component({
  selector: 'app-vehicle-open-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-open-stock.html',
  styleUrl: './vehicle-open-stock.scss',
})
export class VehicleOpenStock {

  fromDate: string = '';
  toDate: string = '';
  modelList: any[] = [];
  vehicleList: any[] = []

  constructor(private itemService: ItemMasterService,
    private storageService: StorageService,
    private toaster: ToastService,
    private loader: LoaderService
  ) {

  }

  ngOnInit(): void {

    this.loadModelList();
    const today = new Date();

    // First day of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(today);
  }
  itemObj: any = {
    modelId: null,
    itemdesc: '',
    fame2amount: 0
  };

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }


  loadModelList() {

    const dealerCode = this.storageService.getDealerCode();

    this.itemService.getItemModelist().subscribe({
      next: (res: any) => {

        this.modelList = res;
        console.log(this.modelList)

      },
      error: (err) => {
        console.error(err);
      }
    })

  }
  onModelChange() {

    const selectedModel = this.modelList.find(
      x => x.id === this.itemObj.modelId
    );

    if (selectedModel) {
      this.itemObj.itemdesc = selectedModel.itemdesc;
      this.itemObj.fame2amount = selectedModel.fame2amount;
    } else {
      this.itemObj.itemdesc = '';
      this.itemObj.fame2amount = 0;
    }
  }

}
