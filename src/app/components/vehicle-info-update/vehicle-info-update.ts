import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { NgbHighlight, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FlatpickrDefaults, FlatpickrModule } from 'angularx-flatpickr';
import { VehicleInfoService } from '../../core/services/vehicle-info-service';
import { ChassisSearchService } from '../../core/services/chassis-search-service';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { LedgerMaster } from '../../ViewModels/LedgerMasterViewModel';
import { StorageService } from '../../core/services/storage';
import { LoaderService } from '../../core/services/loader';
import { ToastService } from '../../shared/toaster/toast-service';

@Component({
  selector: 'app-vehicle-info-update',
  imports: [CommonModule, FormsModule, NgbHighlight, NgbPaginationModule, FlatpickrModule, RouterOutlet, NgbTooltipModule
  ],
  templateUrl: './vehicle-info-update.html',
  styleUrl: './vehicle-info-update.scss',
  providers: [FlatpickrDefaults, FlatpickrModule],
})
export class VehicleInfoUpdate implements OnInit {
  searchCriteria = 'chassis';
  searchValue = '';
  showVehicleDetails = false;
  showResults = false;
  vehicle: any = {};
  editedVehicle: any = {};
  vehicleList: any[] = [];
  selectedVehicle: any = null;
  insurance: any;
  filteredInsurance: any[];
  insuranceNotFound: boolean;
  showInsuranceDropdown: boolean;
  isSuperAdmin: boolean;
  constructor(private vehicleInfoService: VehicleInfoService, private chassisService: ChassisSearchService,
    private ledgerService: LedgerMasterService, private storageService: StorageService,
    private loader: LoaderService, private toaster: ToastService
  ) { }
  updateData: any = {
    battery1: '',
    battery2: '',
    battery3: '',
    battery4: '',

    motor1: '',
    motor2: '',

    charger1: '',
    charger2: '',

    controller1: '',
    controller2: '',

    converter1: '',
    converter2: '',

    batteryCapacity: '',
    batteryChemical: '',
    batteryMake: ''
  };

  ngOnInit(): void {
    this.isSuperAdmin = this.storageService.getRole().toLowerCase() === 'superadmin';
    this.getChassisList();
    this.getInsuranceCompanies();
  }
  getChassisList() {
    this.chassisService.getAllSoldChassis().subscribe(
      (res) => {

      }
    );
  }

  searchVehicle() {
    this.loader.show();
    const regNo = this.searchCriteria === 'regNo' ? this.searchValue : null;
    const chassisNo = this.searchCriteria === 'chassis' ? this.searchValue : null;
    if (!regNo && !chassisNo) {
      this.toaster.show('Please enter a valid chassis or registration number', {
        classname: 'bg-danger text-white',
        delay: 5000
      });
      this.loader.hide();
      return;
    }
    let dealerCode = '';
    if (!this.isSuperAdmin) {
      dealerCode = this.storageService.getDealerCode();
    }

       this.vehicleInfoService
      .getVehicleInfo(regNo ?? undefined, chassisNo ?? undefined, dealerCode ?? undefined)
      .subscribe({
        next: (response) => {

          const batteries = response.vehicleDetails.batteries || [];
          const motors = response.vehicleDetails.motors || [];
          const chargers = response.vehicleDetails.chargers || [];
          const controllers = response.vehicleDetails.controllers || [];
          const converters = response.vehicleDetails.converters || [];

          this.vehicle = {
            ...response.dealerDetails,
            ...response.partyDetails,
            ...response.vehicleDetails,

            battery1: batteries.find((x: any) => x.serialNo === 1)?.batteryNo || '',
            battery2: batteries.find((x: any) => x.serialNo === 2)?.batteryNo || '',
            battery3: batteries.find((x: any) => x.serialNo === 3)?.batteryNo || '',
            battery4: batteries.find((x: any) => x.serialNo === 4)?.batteryNo || '',

            batteryCapacity: batteries.find((x: any) => x.serialNo === 1)?.capacity || '',
            batteryChemical: batteries.find((x: any) => x.serialNo === 1)?.chemicalType || '',
            batteryMake: batteries.find((x: any) => x.serialNo === 1)?.batteryMake || '',

            motor1: motors.find((x: any) => x.serialNo === 1)?.componentNo || '',
            motor2: motors.find((x: any) => x.serialNo === 2)?.componentNo || '',

            charger1: chargers.find((x: any) => x.serialNo === 1)?.componentNo || '',
            charger2: chargers.find((x: any) => x.serialNo === 2)?.componentNo || '',

            controller1: controllers.find((x: any) => x.serialNo === 1)?.componentNo || '',
            controller2: controllers.find((x: any) => x.serialNo === 2)?.componentNo || '',

            converter1: converters.find((x: any) => x.serialNo === 1)?.componentNo || '',
            converter2: converters.find((x: any) => x.serialNo === 2)?.componentNo || ''
          };

          this.editedVehicle = structuredClone(this.vehicle);

          this.showVehicleDetails = true;
          this.loader.hide();
          

        },
        error: (error) => {
          this.loader.hide();
          console.error(error);
          this.vehicle = {};
          this.showVehicleDetails = false;
        }
      });
  }

  loadVehicle(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.vehicle = vehicle;
    this.showVehicleDetails = true;
  }


  updateAll() {
    const payload = {
      chassisNo: this.editedVehicle.chassisNo,
      regNo: this.editedVehicle.regNo,
      insuranceNo: this.editedVehicle.policyNo,
      insuranceStartDate: this.editedVehicle.insuranceDate,
      insuranceExpiryDate: this.editedVehicle.policyExpiryDate,
      insuranceCompany: this.editedVehicle.insuranceCompanyId,
      customerAltMobile: this.editedVehicle.partyAltMobile,
      batteries: [
        {
          orderNo: 1,
          batteryNo: this.editedVehicle.battery1,
          batteryCapacity: this.editedVehicle.batteryCapacity,
          batteryChemical: this.editedVehicle.batteryChemical,
          batteryMake: this.editedVehicle.batteryMake
        },
        {
          orderNo: 2,
          batteryNo: this.editedVehicle.battery2,
          batteryCapacity: this.editedVehicle.batteryCapacity,
          batteryChemical: this.editedVehicle.batteryChemical,
          batteryMake: this.editedVehicle.batteryMake
        },
        {
          orderNo: 3,
          batteryNo: this.editedVehicle.battery3,
          batteryCapacity: this.editedVehicle.batteryCapacity,
          batteryChemical: this.editedVehicle.batteryChemical,
          batteryMake: this.editedVehicle.batteryMake
        },
        {
          orderNo: 4,
          batteryNo: this.editedVehicle.battery4,
          batteryCapacity: this.editedVehicle.batteryCapacity,
          batteryChemical: this.editedVehicle.batteryChemical,
          batteryMake: this.editedVehicle.batteryMake
        }
      ].filter(x => x.batteryNo),

      motors: [
        {
          orderNo: 1,
          componentNo: this.editedVehicle.motor1
        },
        {
          orderNo: 2,
          componentNo: this.editedVehicle.motor2
        }
      ].filter(x => x.componentNo),

      chargers: [
        {
          orderNo: 1,
          componentNo: this.editedVehicle.charger1
        },
        {
          orderNo: 2,
          componentNo: this.editedVehicle.charger2
        }
      ].filter(x => x.componentNo),

      controllers: [
        {
          orderNo: 1,
          componentNo: this.editedVehicle.controller1
        },
        {
          orderNo: 2,
          componentNo: this.editedVehicle.controller2
        }
      ].filter(x => x.componentNo),

      converters: [
        {
          orderNo: 1,
          componentNo: this.editedVehicle.converter1
        },
        {
          orderNo: 2,
          componentNo: this.editedVehicle.converter2
        }
      ].filter(x => x.componentNo)
    };

    this.vehicleInfoService.updateVehicleInfo(payload).subscribe({
      next: () => {
        this.loader.hide();
        this.showVehicleDetails = false;
        this.toaster.show('Succesfully updated Vehicle Information',
          {
            classname: 'bg-success text-white',
            delay: 5000
          }
        );
      }
    });
  }

  getInsuranceCompanies() {
    this.ledgerService.getLedgerByType('Insurance').subscribe({
      next: (res) => {

        this.insurance = res;
      }
    });
  }
  filterInsurance() {
    const search = (this.editedVehicle.insuranceName || '')
      .toLowerCase()
      .trim();

    if (!search) {
      this.filteredInsurance = [...this.insurance];
      this.insuranceNotFound = false;
      return;
    }

    this.filteredInsurance = this.insurance.filter((x: any) =>
      x.ledgerName?.toLowerCase().includes(search)
    );

    this.insuranceNotFound = this.filteredInsurance.length === 0;
  }

  selectInsurance(party: LedgerMaster) {
    this.editedVehicle.insuranceName = party.ledgerName;
    this.editedVehicle.insuranceCompanyId = party.id;
    this.filteredInsurance = [];
    this.insuranceNotFound = false;
    this.showInsuranceDropdown = false;
  }
  onInsuranceFocus() {
    this.showInsuranceDropdown = true;
    this.filteredInsurance = [...this.insurance];

  }

  onInsuranceBlur() {
    setTimeout(() => {
      this.showInsuranceDropdown = false;
    }, 200);
  }
  sanitizeMobile(event: any) {
    let value = event.target.value || '';
    value = value.replace(/[^0-9]/g, '');
    value = value.slice(0, 10);
    event.target.value = value;
    this.editedVehicle.partyAltMobile = value;
  }

}
