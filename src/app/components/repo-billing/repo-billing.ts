import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RepoBillingService } from '../../core/services/repo-billing';
import { ToastService } from '../../shared/toaster/toast-service';
import { LoaderService } from '../../core/services/loader';

@Component({
  selector: 'app-repo-billing',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './repo-billing.html',
  styleUrl: './repo-billing.scss',
})
export class RepoBilling {

  formData: any = { chassisNumber: '', searchCriteria: '' };
  showVehicleDetails = true;

  vehicleDetails: any = {
    chassisNo: '',
    regNo: '',
    engineNo: null,
    saleDate: '',
    itemCode: '',
    modelName: '',
    colorName: '',
    insuranceDate: '',
    pollutionDate: null,
    policyNo: '',
    policyExpiryDate: '',
    insuranceCompany: '',
    insuranceCompanyId: '',
    fuelType: null,
    engineHealthSubscriptionDate: null,
    monthlySubsidyDate: null,
    ownershipType: null,

    battery1: '',
    battery2: '',
    battery3: '',
    battery4: '',

    batteryCapacity: '',
    batteryChemical: '',
    batteryMake: '',

    motor1: '',
    motor2: '',

    charger1: '',
    charger2: '',

    controller1: '',
    controller2: '',

    converter1: '',
    converter2: ''
  }
  dealerDetails: any = {
    address: '',
    dealerCity: '',
    dealerCode: "",
    dealerEmail: '',
    dealerLocation: '',
    dealerName: '',
    dealerState: '',
    email: '',
    mobileNo: ''
  }
  partyDetails: any = {
    partyName: '',
    partyMobile: '',
    partyAltMobile: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    email: '',
    pin: ''
  }

  constructor(
    private repoBillingService: RepoBillingService,
    private toast: ToastService,
    private loader: LoaderService
  ) { }

  onSubmit(form: any) {
    if (form.invalid)
      return;

    const regNo = this.formData.searchCriteria === 'regNo' ? this.formData.chassisNumber : null;
    const chassisNo = this.formData.searchCriteria === 'chassis' ? this.formData.chassisNumber : null;

    this.loader.show();
    this.repoBillingService.getRepoBillingData(chassisNo, regNo).subscribe({
      next: (res: any) => {
        console.log(res);
        this.loader.hide();
        const dealer = res.dealerDetails;
        const party = res.partyDetails;
        const vehicle = res.vehicleDetails;

        const batteries = res.vehicleDetails.batteries || [];
        const motors = res.vehicleDetails.motors || [];
        const chargers = res.vehicleDetails.chargers || [];
        const controllers = res.vehicleDetails.controllers || [];
        const converters = res.vehicleDetails.converters || [];

        this.dealerDetails = {
          address: dealer.address,
          dealerCity: dealer.dealerCity,
          dealerCode: dealer.dealerCode,
          dealerEmail: dealer.dealerEmail,
          dealerLocation: dealer.dealerLocation,
          dealerName: dealer.dealerName,
          dealerState: dealer.dealerState,
          email: dealer.email,
          mobileNo: dealer.mobileNo
        };

        this.partyDetails = {
          partyName: party.partyName || '',
          partyMobile: party.partyMobile || '',
          partyAltMobile: party.partyAltMobile || '',
          address1: party.address1 || '',
          address2: party.address2 || '',
          state: party.state || '',
          city: party.city || '',
          email: party.email || '',
          pin: party.pin || ''
        };

        this.vehicleDetails = {
          chassisNo: vehicle.chassisNo || '',
          regNo: vehicle.regNo || '',
          engineNo: vehicle.engineNo || null,
          saleDate: vehicle.saleDate || '',
          itemCode: vehicle.itemCode || '',
          modelName: vehicle.modelName || '',
          colorName: vehicle.colorName || '',
          insuranceDate: vehicle.insuranceDate || '',
          pollutionDate: vehicle.pollutionDate || null,
          policyNo: vehicle.policyNo || '',
          policyExpiryDate: vehicle.policyExpiryDate || '',
          insuranceCompany: vehicle.insuranceCompany || '',
          insuranceCompanyId: vehicle.insuranceCompanyId || 98,
          fuelType: vehicle.fuelType || null,
          engineHealthSubscriptionDate: vehicle.engineHealthSubscriptionDate || null,
          monthlySubsidyDate: vehicle.monthlySubsidyDate || null,
          ownershipType: vehicle.ownershipType || null,


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
        }
      },
      error: (err: any) => {
        this.loader.hide();
        console.error(err);
        this.toast.show('Error fetching repo billing data', { classname: 'bg-danger text-light', delay: 5000 });
      }
    });
  }

  updateAll() {

  }

  resetForms() {
    this.formData = { chassisNumber: '', searchCriteria: '' };
  }
}
