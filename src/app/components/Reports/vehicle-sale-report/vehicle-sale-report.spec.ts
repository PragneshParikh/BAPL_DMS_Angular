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
  ReportService
} from '../../../core/services/report.service';

import {
  VehicleSaleReportViewModel
} from '../../../ViewModels/models/vehicle-sale-report.model';

describe(
  'VehicleSaleReportComponent',
  () => {

    let component:
      VehicleSaleReportComponent;

    let fixture:
      ComponentFixture<VehicleSaleReportComponent>;

    let reportService:
      jasmine.SpyObj<ReportService>;

    beforeEach(async () => {

      const spy =
        jasmine.createSpyObj(
          'ReportService',
          [
            'getVehicleSaleReport',
            'getDealerDropdown'
          ]
        );

      await TestBed
        .configureTestingModule({

          imports: [
            VehicleSaleReportComponent,
            ReactiveFormsModule,
            HttpClientTestingModule
          ],

          providers: [
            {
              provide: ReportService,
              useValue: spy
            }
          ]

        })
        .compileComponents();

      reportService =
        TestBed.inject(
          ReportService
        ) as jasmine.SpyObj<ReportService>;

      fixture =
        TestBed.createComponent(
          VehicleSaleReportComponent
        );

      component =
        fixture.componentInstance;
    });

    it('should create', () => {

      reportService
        .getVehicleSaleReport
        .and.returnValue(of([]));

      reportService
        .getDealerDropdown
        .and.returnValue(of([]));

      fixture.detectChanges();

      expect(component)
        .toBeTruthy();
    });

    it('should load report data', () => {

      const mockData:
        VehicleSaleReportViewModel[] = [];

      reportService
        .getVehicleSaleReport
        .and.returnValue(of(mockData));

      reportService
        .getDealerDropdown
        .and.returnValue(of([]));

      fixture.detectChanges();

      component.loadReport();

      expect(component.reportData)
        .toEqual(mockData);
    });

    it('should reset filters', () => {

      reportService
        .getVehicleSaleReport
        .and.returnValue(of([]));

      reportService
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

      spyOn(
        document,
        'createElement'
      ).and.callThrough();

      component.reportData = [];

      component.exportToCSV();

      expect(
        document.createElement
      ).toHaveBeenCalled();
    });

    it('should format date', () => {

      const result =
        component.formatDate(
          new Date()
        );

      expect(result)
        .toContain('/');
    });
});