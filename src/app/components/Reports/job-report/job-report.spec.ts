import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  ReactiveFormsModule
} from '@angular/forms';

import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import {
  JobReportComponent
} from './job-report';

import {
  ReportService
} from '../../../core/services/report.service';

describe('JobReportComponent', () => {

  let component: JobReportComponent;

  let fixture:
    ComponentFixture<JobReportComponent>;

  let httpMock:
    HttpTestingController;

  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [
        JobReportComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],

      providers: [
        ReportService
      ]

    }).compileComponents();

    fixture =
      TestBed.createComponent(
        JobReportComponent
      );

    component =
      fixture.componentInstance;

    httpMock =
      TestBed.inject(
        HttpTestingController
      );
  });

  afterEach(() => {

    httpMock.verify();
  });

  it('should create', () => {

    fixture.detectChanges();

    const dealerRequest =
      httpMock.expectOne(req =>
        req.url.includes('dealer')
      );

    dealerRequest.flush([]);

    const reportRequest =
      httpMock.expectOne(req =>
        req.url.includes('job-report')
      );

    reportRequest.flush({
      data: [],
      totalRecords: 0,
      pageIndex: 1,
      pageSize: 100,
      totalSpares: 0,
      totalAcsr: 0,
      totalOil: 0,
      totalLabour: 0,
      totalOutsideWork: 0,
      totalTaxable: 0,
      totalSGST: 0,
      totalCGST: 0,
      grandTotal: 0
    });

    expect(component)
      .toBeTruthy();
  });

  it('should load report data from api', () => {

    fixture.detectChanges();

    const dealerRequest =
      httpMock.expectOne(req =>
        req.url.includes('dealer')
      );

    dealerRequest.flush([]);

    const firstRequest =
      httpMock.expectOne(req =>
        req.url.includes('job-report')
      );

    firstRequest.flush({
      data: [],
      totalRecords: 0,
      pageIndex: 1,
      pageSize: 100,
      totalSpares: 0,
      totalAcsr: 0,
      totalOil: 0,
      totalLabour: 0,
      totalOutsideWork: 0,
      totalTaxable: 0,
      totalSGST: 0,
      totalCGST: 0,
      grandTotal: 0
    });

    component.loadReport();

    const apiRequest =
      httpMock.expectOne(req =>
        req.url.includes('job-report')
      );

    expect(apiRequest.request.method)
      .toBe('POST');

    apiRequest.flush({

      data: [
        {
          srNo: 1,
          invoiceNo: 1001,
          invoiceDate: new Date(),
          jobNo: 1,
          partyName: 'Mayank',
          partyMobileNo: '9999999999',
          regNo: 'GJ01AA1111',
          mechanicName: 'Mechanic',
          invoiceType: 'Cash',
          invoiceMode: 'Offline',
          sparesAmount: 1000,
          acsrAmount: 100,
          oilAmount: 50,
          labourAmount: 500,
          outsideWorkAmount: 0,
          taxableAmount: 1650,
          sgstAmount: 150,
          cgstAmount: 150,
          chassisNo: 'CH001',
          dealerCode: 'D001',
          serviceLocation: 'Vadodara',
          jobType: 'Service',
          serviceHead: 'General',
          serviceType: 'Normal',
          jobInDate: new Date(),
          estimatedDeliveryDate: new Date()
        }
      ],

      totalRecords: 1,
      pageIndex: 1,
      pageSize: 100,
      totalSpares: 1000,
      totalAcsr: 100,
      totalOil: 50,
      totalLabour: 500,
      totalOutsideWork: 0,
      totalTaxable: 1650,
      totalSGST: 150,
      totalCGST: 150,
      grandTotal: 1950
    });

    expect(component.reportData.length)
      .toBe(1);

    expect(component.totalRecords)
      .toBe(1);

    expect(component.grandTotal)
      .toBe(1950);
  });

  it('should reset filters', () => {

    fixture.detectChanges();

    const dealerRequest =
      httpMock.expectOne(req =>
        req.url.includes('dealer')
      );

    dealerRequest.flush([]);

    const reportRequest =
      httpMock.expectOne(req =>
        req.url.includes('job-report')
      );

    reportRequest.flush({
      data: [],
      totalRecords: 0,
      pageIndex: 1,
      pageSize: 100,
      totalSpares: 0,
      totalAcsr: 0,
      totalOil: 0,
      totalLabour: 0,
      totalOutsideWork: 0,
      totalTaxable: 0,
      totalSGST: 0,
      totalCGST: 0,
      grandTotal: 0
    });

    component.filterForm.patchValue({
      dealerCode: 'D001',
      partyName: 'Test'
    });

    component.onReset();

    const resetRequest =
      httpMock.expectOne(req =>
        req.url.includes('job-report')
      );

    resetRequest.flush({
      data: [],
      totalRecords: 0,
      pageIndex: 1,
      pageSize: 100,
      totalSpares: 0,
      totalAcsr: 0,
      totalOil: 0,
      totalLabour: 0,
      totalOutsideWork: 0,
      totalTaxable: 0,
      totalSGST: 0,
      totalCGST: 0,
      grandTotal: 0
    });

    expect(
      component.filterForm
        .get('dealerCode')
        ?.value
    ).toBeFalsy();
  });

});