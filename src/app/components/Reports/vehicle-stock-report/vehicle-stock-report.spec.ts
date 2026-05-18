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
  VehicleStockReportComponent
} from './vehicle-stock-report';

import {
  ReportService
} from '../../../core/services/report.service';

describe('VehicleStockReportComponent', () => {

  let component:
    VehicleStockReportComponent;

  let fixture:
    ComponentFixture<VehicleStockReportComponent>;

  let reportService:
    jasmine.SpyObj<ReportService>;

  beforeEach(async () => {

    const spy =
      jasmine.createSpyObj(
        'ReportService',
        [
          'getVehicleStockReport'
        ]
      );

    await TestBed.configureTestingModule({

      imports: [
        VehicleStockReportComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],

      providers: [
        {
          provide:
            ReportService,
          useValue: spy
        }
      ]

    }).compileComponents();

    reportService =
      TestBed.inject(
        ReportService
      ) as jasmine.SpyObj<ReportService>;

    reportService
      .getVehicleStockReport
      .and.returnValue(
        of({
          data: [],
          totalRecords: 0
        })
      );

    fixture =
      TestBed.createComponent(
        VehicleStockReportComponent
      );

    component =
      fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {

    expect(component)
      .toBeTruthy();
  });

  it('should load report data', () => {

    component.loadReport();

    expect(
      reportService
        .getVehicleStockReport
    ).toHaveBeenCalled();
  });

  it('should reset filters', () => {

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

    spyOn(
      document,
      'createElement'
    ).and.callThrough();

    component.exportToCSV();

    expect(
      document.createElement
    ).toHaveBeenCalled();
  });

});