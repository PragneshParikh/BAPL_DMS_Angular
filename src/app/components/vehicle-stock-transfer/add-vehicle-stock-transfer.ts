import { Component, OnInit } from '@angular/core';
import { PrefixService } from '../../core/services/prefix';
import { StorageService } from '../../core/services/storage';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmployeeMasterService } from '../../core/services/employee-master';
import { LocationMasterService } from '../../core/services/location-master-service';
import { ChassisSearchService } from '../../core/services/chassis-search-service';
import { VehicleStockTransferService } from '../../core/services/vehicle-stock-transfer-service';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeDesignations } from '../../constant';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';

@Component({
  selector: 'app-add-vehicle-stock-transfer',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-vehicle-stock-transfer.html',
  styleUrl: './add-vehicle-stock-transfer.scss',
})
export class AddVehicleStockTransfer implements OnInit {
  today = new Date().toISOString().split('T')[0];
  vehicleList: any[] = [];
  model: any = {
    transferNo: '',
    transferDate: this.today,
    fromDealerCode: '',
    toDealerCode: '',
    issuingLocation: null,
    issuingStaff: null,
    receivingLocation: null,
    receivingStaff: null,
    remark: '',
    vehicleDetails: [
      {
        chassisNo: '',
        itemCode: '',
        rate: 0,
        batteryMake: '',
        modelName: '',
        colour: '',
        mfgYear: null,
        keyNo: '',
        batteryCapacity: '',
        batteryNo: '',
        charger: '',
        convertor: '',
        controller: '',
        fameII: 0,

      }
    ]
  };
  employeeList: any[];
  filteredIssueEmployeeList: any[];
  filteredReceiveEmployeeList: any[];
  locationList: any;
  filteredIssuingLocationList: any[];
  filteredReceivingLocationList: any[];
  chassisDetails: any[] = [];
  filteredChassis: any[] = [];

  showChassisDropdown: boolean = false;
  showChassisNotFound: boolean = false;
  editIndex: number = -1;
  isEditMode: boolean;

  constructor(private prefixService: PrefixService, private storageService: StorageService,
    private employeeMasterService: EmployeeMasterService,
    private locationMasterService: LocationMasterService,
    private chassisSearchService: ChassisSearchService,
    private vehicleStockTransferService: VehicleStockTransferService,
    private router: Router,
    private route: ActivatedRoute,
    private toaster: ToastService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.getNextTransferNo();
    this.getEmployeesByDesignation();
    this.getLocations();
    if (id) {
      this.isEditMode = true;
      this.getVehicleStockTransferById(parseInt(id));
    }
  }

  getNextTransferNo() {
    const dealerCode = this.storageService.getDealerCode();
    this.prefixService.getPrefixByDealerByModule(dealerCode, 'vehicle_transfer').subscribe({
      next: (data) => {
        this.model.transferNo = data;
      }
    });
  }

  getEmployeesByDesignation() {
    const dealerCode = this.storageService.getDealerCode();
    const designation = EmployeeDesignations.find(x => x.id === 1)?.value;

    this.employeeMasterService.getEmployeesByDesignation(dealerCode, designation).subscribe({
      next: (data) => {
        this.employeeList = data;
        this.filteredIssueEmployeeList = data;
        this.filteredReceiveEmployeeList = data;
      }
    });
  }
  onReceivingLocationChange() {
    this.filteredIssuingLocationList = this.locationList.filter(x => x.locCode !== this.model.receivingLocation);
    this.filteredReceiveEmployeeList = this.employeeList.filter(x => x.locationCode === this.model.receivingLocation);
  }

  getLocations() {
    const dealerCode = this.storageService.getDealerCode();
    this.locationMasterService.getLocationList(dealerCode).subscribe({
      next: (data) => {
        this.locationList = data;
        this.filteredIssuingLocationList = data;
        this.filteredReceivingLocationList = data;
      }
    });
  }

  onIssuingLocationChange() {
    this.filteredReceivingLocationList = this.locationList.filter(x => x.locCode !== this.model.issuingLocation);
    this.filteredIssueEmployeeList = this.employeeList.filter(x => x.locationCode === this.model.issuingLocation);
    this.chassisSearchService.getChassisDetailsByLocationCode(this.model.issuingLocation).subscribe({
      next: (data) => {
        this.chassisDetails = data;
        this.filteredChassis = [...data];
      }
    });
  }

  filterChassis() {
    const search = (this.model.chassisNo || '').toLowerCase().trim();
    if (!search) {
      this.filteredChassis = [...this.chassisDetails];
      this.showChassisNotFound = false;
      return;
    }
    this.filteredChassis = this.chassisDetails.filter(x => x.chassisNo?.toLowerCase().includes(search));
    this.showChassisNotFound = this.filteredChassis.length === 0;
  }

  onFocusChassis() {
    this.filteredChassis = [...this.chassisDetails];
    this.showChassisDropdown = true;
    this.showChassisNotFound = false;
  }

  onBlurChassis() {
    setTimeout(() => {
      this.showChassisDropdown = false;
    }, 200);
  }

  selectChassis(chassis: any) {
    this.model.chassisNo = chassis.chassisNo;
    this.model.modelName = chassis.modelName;
    this.model.colour = chassis.colour;
    this.model.itemCode = chassis.itemCode;
    this.model.rate = chassis.rate;
    this.model.batteryMake = chassis.batteryMake;
    this.model.batteryCapacity = chassis.batteryCapacity;
    this.model.batteryNo = chassis.batteryNo;
    this.model.charger = chassis.charger;
    this.model.convertor = chassis.convertor;
    this.model.controller = chassis.controller;
    this.model.fameII = chassis.fameII;
    this.model.mfgYear = chassis.mfgYear;
    this.model.keyNo = chassis.keyNo;
    //this.showChassisDropdown = false;
  }
  addVehicle() {
    const vehicleData = {
      chassisNo: this.model.chassisNo,
      itemCode: this.model.itemCode,
      modelName: this.model.modelName,
      colour: this.model.colour,
      mfgYear: this.model.mfgYear,
      keyNo: this.model.keyNo,
      batteryMake: this.model.batteryMake,
      batteryCapacity: this.model.batteryCapacity,
      batteryNo: this.model.batteryNo,
      charger: this.model.charger,
      convertor: this.model.convertor,
      controller: this.model.controller,
      fameII: this.model.fameII,
      rate: this.model.rate
    };
    if (this.editIndex >= 0) {
      this.vehicleList[this.editIndex] = vehicleData;
      this.editIndex = -1;
    } else {
      this.vehicleList.push(vehicleData);
    }
    this.clearVehicleFields();
  }

  onRefresh() {
    this.clearVehicleFields();
  }
  clearVehicleFields() {
    this.model.chassisNo = '';
    this.model.modelName = '';
    this.model.colour = '';
    this.model.mfgYear = null;
    this.model.keyNo = '';
    this.model.batteryMake = '';
    this.model.batteryCapacity = '';
    this.model.batteryNo = '';
    this.model.charger = '';
    this.model.convertor = '';
    this.model.controller = '';
    this.model.fameII = null;
    this.model.rate = null;
  }

  deleteVehicle(index: number) {
    this.vehicleList.splice(index, 1);
  }

  isChassisAdded(chassisNo: string): boolean {
    return this.vehicleList.some(v => v.chassisNo === chassisNo);
  }

  editVehicle(row: any, index: number) {
    this.editIndex = index;
    this.model.chassisNo = row.chassisNo;
    this.model.itemCode = row.itemCode;
    this.model.modelName = row.modelName;
    this.model.colour = row.colour;
    this.model.mfgYear = row.mfgYear;
    this.model.keyNo = row.keyNo;
    this.model.batteryMake = row.batteryMake;
    this.model.batteryCapacity = row.batteryCapacity;
    this.model.batteryNo = row.batteryNo;
    this.model.charger = row.charger;
    this.model.convertor = row.convertor;
    this.model.controller = row.controller;
    this.model.fameII = row.fameII;
    this.model.rate = row.rate;
  }

  onSubmit(form: NgForm) {
    this.loader.show();
    if (this.vehicleList.length === 0) {
      this.loader.hide();
      this.toaster.show('Add atleast one vehicle',
        {
          classname: 'bg-warning text-white',
          delay: 5000
        }
      );
      return;
    }
    const dealerCode = this.storageService.getDealerCode();
    const payload = {
      transferNo: this.model.transferNo,
      transferDate: this.model.transferDate,
      issuingLocationCode: this.model.issuingLocation,
      issuingStaffCode: this.model.issuingStaff,
      receivingLocationCode: this.model.receivingLocation,
      receivingStaffCode: this.model.receivingStaff,
      remarks: this.model.remarks,
      dealerCode: dealerCode,
      transferTotal: this.getTransferTotal(),
      vehicleStockTransferDetailsViewModel:
        this.vehicleList.map(x => ({
          chassisNo: x.chassisNo,
          itemCode: x.itemCode,
          itemRate: x.rate
        }))
    };
    this.vehicleStockTransferService.createStockTransfer(payload).subscribe({
      next: (data) => {
        this.loader.hide();
        this.toaster.show('Successfully added stock transfer', {
          classname: 'bg-success text-white',
          delay: 5000
        },
        );
        this.goToList();
      },
      error: (err) => {
        this.loader.hide();
        console.error(err);
        this.toaster.show("Something went wrong.", { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  goToList() {
    this.router.navigate(['/vehicle-stock-transfer']);
  }
  getTransferTotal(): number {
    return this.vehicleList.reduce(
      (total, vehicle) => total + (Number(vehicle.rate) || 0),
      0
    );
  }

  getVehicleStockTransferById(id: number) {
    this.getLocations();
    this.getEmployeesByDesignation();
    this.vehicleStockTransferService.getTransferById(id).subscribe({
      next: (data) => {
        this.model.transferNo = data.transferNo;
        this.model.transferDate = data.transferDate.split('T')[0];
        this.model.issuingLocation = data.issuingLocationCode;
        this.model.issuingStaff = data.issuingStaffCode;
        this.model.receivingLocation = data.receivingLocationCode;
        this.model.receivingStaff = data.receivingStaffCode;
        this.model.remarks = data.remarks;
        this.filteredIssueEmployeeList = this.employeeList?.filter(x => x.locationCode === this.model.issuingLocation) || [];
        this.filteredReceiveEmployeeList = this.employeeList?.filter(x => x.locationCode === this.model.receivingLocation) || [];
        this.vehicleList = data.vehicleStockTransferDetailsViewModel
          .map((x: any) => ({
            chassisNo: x.chassisNo,
            itemCode: x.itemCode,
            modelName: x.modelName,
            colour: x.colour,
            mfgYear: x.mfgYear,
            keyNo: x.keyNo,
            batteryMake: x.batteryMake,
            batteryCapacity: x.batteryCapacity,
            batteryNo: x.batteryNo,
            charger: x.charger,
            convertor: x.convertor,
            controller: x.controller,
            fameII: x.fameII,
            rate: x.rate
          }));
      }
    });
  }
}

