import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemMasterService } from '../../core/services/item-master-service';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';
import { StorageService } from '../../core/services/storage';
import { LocationMasterService } from '../../core/services/location-master-service';
import { VehicleOpenStockService } from '../../core/services/vehicle-open-stock-service';
import { batteryMake } from '../../constant';

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
  isSuperAdmin: boolean;
  dealerCode: string;
  locations: any[];
  selectedLocation: string;
  isEditMode: any;
  purposeofbatterymake = batteryMake;


  constructor(private itemService: ItemMasterService,
    private storageService: StorageService,
    private locationService: LocationMasterService,
    private vehicleOpenStockService: VehicleOpenStockService,
    private toaster: ToastService,
    private loader: LoaderService
  ) {

  }

  ngOnInit(): void {

    this.loadModelList();
    this.fetchLocations();
    const today = new Date();

    // First day of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(today);
  }
  itemObj: any = {
    modelId: null,
    itemdesc: '',
    fame2amount: 0,
    colorName: '',
    locationName: 0,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  };

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  loadBatteryMake():void{
    
  }


  fetchLocations(): void {
    debugger;
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';

    if (!this.isSuperAdmin) {
      this.dealerCode = this.storageService.getDealerCode();
    } else {
      this.dealerCode = null;
    }


    this.locationService.getLocationList(this.dealerCode).subscribe({
      next: (data: any[]) => {
        // only showroom (id = 1)
        this.locations = data.filter(x => x.locareadidNo === 1);
      },
      error: (err) => {
        console.error('Error fetching locations', err);
      }
    });
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLocation = target.value;
  }
  loadModelList() {

    const dealerCode = this.storageService.getDealerCode();

    this.itemService.getItemModelist().subscribe({
      next: (res: any) => {

        this.modelList = res;
        //console.log(this.modelList)

      },
      error: (err) => {
        console.error(err);
      }
    })

  }
  onModelChange() {
debugger
    const selectedModel = this.modelList.find(
      x => x.id === this.itemObj.modelId
    );

    if (selectedModel) {
      this.itemObj.itemname = selectedModel.itemname;
      this.itemObj.itemdesc = selectedModel.itemdesc;
      this.itemObj.fame2amount = selectedModel.fame2amount;
      this.itemObj.colorName = selectedModel.colorName;

    } else {
      this.itemObj.itemdesc = '';
      this.itemObj.fame2amount = 0;
    }
    console.log(this.itemObj.itemname)
    this.loadVehicleOpenDetails(this.itemObj.itemname);

  }

  loadVehicleOpenDetails(itemName) {
    const modelName = itemName;
    const dealerCode = this.storageService.getDealerCode();

    this.vehicleOpenStockService.getVehicleSaleDetailsByModel(modelName,dealerCode).subscribe({
      next: (res: any) => {
        this.vehicleList = res;
        console.log(this.vehicleList);
      }
    })
  }

  editIndex: number = -1;
  vehicleObj: any = {};

  editVehicle(index: number): void {
    this.editIndex = index;
    this.isEditMode = true;

    this.vehicleObj = { ...this.vehicleList[index] };
    console.log(this.vehicleObj);

    if (this.vehicleObj.saleDate) {
      this.vehicleObj.saleDate = this.vehicleObj.saleDate.substring(0, 10);
    }

    if (this.vehicleObj.saleBillCreatedDate) {
      this.vehicleObj.saleBillCreatedDate =
        this.vehicleObj.saleBillCreatedDate.substring(0, 10);
    }
     this.calculateTotalStock();
  }

  calculateTotalStock(): void {

  const rate = Number(this.vehicleObj.rate) || 0;

  const cgst = Number(this.itemObj.cgst) || 0;
  const sgst = Number(this.itemObj.sgst) || 0;
  const igst = Number(this.itemObj.igst) || 0;

  let taxAmount = 0;

  // Same State
  if (cgst > 0 || sgst > 0) {
    taxAmount = rate * (cgst + sgst) / 100;
  }

  // Other State
  else if (igst > 0) {
    taxAmount = rate * igst / 100;
  }

  this.vehicleObj.cgst = cgst;
  this.vehicleObj.sgst = sgst;
  this.vehicleObj.igst = igst;
  this.vehicleObj.totalOpStock = +(rate + taxAmount).toFixed(2);
}

  addVehicle(): void {

    if (this.isEditMode) {

      // Update same row
      this.itemObj.cgst = this.vehicleObj.cgst;
      this.itemObj.sgst = this.vehicleObj.sgst;
      this.itemObj.igst = this.vehicleObj.igst;
      this.vehicleList[this.editIndex] = { ...this.vehicleObj };

      this.isEditMode = false;
      this.editIndex = -1;

      //this.toaster.success('Vehicle updated successfully.');

    } else {

      // Add new row
      this.vehicleList.push({ ...this.vehicleObj });

      //this.toaster.success('Vehicle added successfully.');
    }

    // Clear form
    this.vehicleObj = {};

    // Optional: Reset dropdown
    this.itemObj.modelId = null;
    this.itemObj.itemname = '';
    this.itemObj.itemdesc = '';
    this.itemObj.fame2amount = 0;
    this.itemObj.colorName = '';
  }

}
