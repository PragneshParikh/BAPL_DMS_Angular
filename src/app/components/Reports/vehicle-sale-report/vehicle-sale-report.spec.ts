import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  ReactiveFormsModule
} from '@angular/forms';

import {
  HttpClientTestingModule
} from '@angular/common/http/testing';

import { of } from 'rxjs';

import {
  VehicleSaleReportComponent
} from './vehicle-sale-report';

import {
  VehicleSaleReportService,
  VehicleSaleReportViewModel
} from '../../../core/services/vehicle-sale-report.service';

describe('VehicleSaleReportComponent', () => {

  let component: VehicleSaleReportComponent;

  let fixture:
    ComponentFixture<VehicleSaleReportComponent>;

  let vehicleSaleReportService:
    jasmine.SpyObj<VehicleSaleReportService>;

  beforeEach(async () => {

    const spy =
      jasmine.createSpyObj(
        'VehicleSaleReportService',
        [
          'getVehicleSaleReport',
          'getDealerDropdown'
        ]
      );

    await TestBed.configureTestingModule({

      imports: [
        VehicleSaleReportComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],

      providers: [
        {
          provide: VehicleSaleReportService,
          useValue: spy
        }
      ]

    }).compileComponents();

    vehicleSaleReportService =
      TestBed.inject(
        VehicleSaleReportService
      ) as jasmine.SpyObj<VehicleSaleReportService>;

    fixture =
      TestBed.createComponent(
        VehicleSaleReportComponent
      );

    component = fixture.componentInstance;
  });

  it('should create', () => {

    vehicleSaleReportService
      .getVehicleSaleReport
      .and.returnValue(of([]));

    vehicleSaleReportService
      .getDealerDropdown
      .and.returnValue(of([]));

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load report data', () => {

    const mockData:
      VehicleSaleReportViewModel[] = [
      {
        srNo: 1,
        modelCode: 'MD001',
        modelDescription: 'Model 1',
        oemModelName: 'OEM',
        vehicleGroup: 'EV',

        colorCode: 'RED',

        chasisNo: 'CH001',
        regNo: 'GJ01AA1234',

        dealerCode: 'D001',
        dealerName: 'Dealer 1',
        dealerCity: 'Ahmedabad',
        dealerState: 'Gujarat',

        location: 'Ahmedabad',
        locCode: 'LOC1',
        locCity: 'Ahmedabad',

        name: 'Mayank',

        address1: 'Address 1',
        address2: '',

        customerState: 'Gujarat',
        customerCity: 'Ahmedabad',

        pin: '380001',

        email: 'test@test.com',

        mobileNo: '9999999999',

        type: 'Retail',

        bookingId: 'BK001',

        dispatchDate: new Date(),

        saleDate: new Date(),

        invoiceNo: 'INV001',

        billType: 'Cash',

        financeBy: 'HDFC',

        financerCode: '',

        financerCategory: '',

        executiveName: 'Executive',

        prospectName: 'Prospect',

        prospectMobNo: '8888888888',

        motorNumber: 'MTR001',

        batteryNo: 'BAT1',
        batteryNo2: '',
        batteryNo3: '',
        batteryNo4: '',
        batteryNo5: '',
        batteryNo6: '',

        batteryCapacity: '3KW',

        subsidyAmount: 5000,

        fameIIRequired: true,

        totalAmount: 120000,

        billDate: new Date()
      }
    ];

    vehicleSaleReportService
      .getVehicleSaleReport
      .and.returnValue(of(mockData));

    vehicleSaleReportService
      .getDealerDropdown
      .and.returnValue(of([]));

    fixture.detectChanges();

    component.loadReport();

    expect(component.reportData.length)
      .toBe(1);

    expect(component.reportData[0].dealerCode)
      .toBe('D001');
  });

  it('should reset filters', () => {

    vehicleSaleReportService
      .getVehicleSaleReport
      .and.returnValue(of([]));

    vehicleSaleReportService
      .getDealerDropdown
      .and.returnValue(of([]));

    fixture.detectChanges();

    component.filterForm.patchValue({
      dealerCode: 'D001'
    });

    component.onReset();

    expect(
      component.filterForm
        .get('dealerCode')
        ?.value
    ).toBeFalsy();
  });

  it('should export csv', () => {

    spyOn(document, 'createElement')
      .and.callThrough();

    component.reportData = [];

    component.exportToCSV();

    expect(document.createElement)
      .toHaveBeenCalled();
  });

  it('should format date', () => {

    const date = new Date();

    const result =
      component.formatDate(date);

    expect(result).toContain('/');
  });

});