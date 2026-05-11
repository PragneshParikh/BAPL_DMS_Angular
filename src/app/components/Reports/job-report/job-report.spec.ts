import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { JobReportComponent } from './job-report';
import { JobReportService, JobReportPagedResponse, DealerWiseJobReportSummary, JobReportSummaryStats } from '../../../core/services/job-report.service';
import { of } from 'rxjs';

describe('JobReportComponent', () => {
  let component: JobReportComponent;
  let fixture: ComponentFixture<JobReportComponent>;
  let jobReportService: jasmine.SpyObj<JobReportService>;

  beforeEach(async () => {
    const jobReportServiceSpy = jasmine.createSpyObj('JobReportService', [
      'getJobReportAsync',
      'getDealerWiseJobReportAsync',
      'getJobCardReportByDealer',
      'getFilteredJobCardReport',
      'exportJobCardReport',
      'getJobReportSummaryStats'
    ]);

    await TestBed.configureTestingModule({
      declarations: [JobReportComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: JobReportService, useValue: jobReportServiceSpy }
      ]
    }).compileComponents();

    jobReportService = TestBed.inject(JobReportService) as jasmine.SpyObj<JobReportService>;
    fixture = TestBed.createComponent(JobReportComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default dates on ngOnInit', () => {
      fixture.detectChanges();
      
      expect(component.filterForm.get('fromDate')?.value).toBeTruthy();
      expect(component.filterForm.get('toDate')?.value).toBeTruthy();
    });

    it('should load report on component initialization', () => {
      jobReportService.getJobReportAsync.and.returnValue(of({
        data: [],
        totalRecords: 0,
        pageIndex: 1,
        pageSize: 20,
        totalSpares: 0,
        totalAcsr: 0,
        totalOil: 0,
        totalLabour: 0,
        totalOutsideWork: 0,
        totalTaxable: 0,
        totalSGST: 0,
        totalCGST: 0,
        grandTotal: 0
      } as JobReportPagedResponse));

      fixture.detectChanges();

      expect(jobReportService.getJobReportAsync).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as invalid if required fields are empty', () => {
      component.filterForm.patchValue({
        fromDate: '',
        toDate: ''
      });

      expect(component.filterForm.invalid).toBeTruthy();
    });

    it('should mark form as valid with required fields', () => {
      component.filterForm.patchValue({
        fromDate: '2024-01-01',
        toDate: '2024-01-31'
      });

      expect(component.filterForm.valid).toBeTruthy();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load report data correctly', () => {
      const mockResponse: JobReportPagedResponse = {
        data: [
          {
            srNo: 1,
            invoiceNo: 1001,
            invoiceDate: new Date(),
            jobNo: 1,
            partyName: 'Test Party',
            partyMobileNo: '1234567890',
            regNo: 'ABC123',
            mechanicName: 'John',
            invoiceType: 'Deep',
            invoiceMode: 'Cash',
            sparesAmount: 1000,
            acsrAmount: 500,
            oilAmount: 200,
            labourAmount: 300,
            outsideWorkAmount: 0,
            taxableAmount: 2000,
            sgstAmount: 180,
            cgstAmount: 180,
            chassisNo: 'CH123',
            dealerCode: 'D001',
            serviceLocation: 'Mumbai',
            jobType: 'Deep',
            serviceHead: 'Service',
            serviceType: 'Job',
            jobInDate: new Date(),
            estimatedDeliveryDate: new Date()
          }
        ],
        totalRecords: 1,
        pageIndex: 1,
        pageSize: 20,
        totalSpares: 1000,
        totalAcsr: 500,
        totalOil: 200,
        totalLabour: 300,
        totalOutsideWork: 0,
        totalTaxable: 2000,
        totalSGST: 180,
        totalCGST: 180,
        grandTotal: 2360
      };

      jobReportService.getJobReportAsync.and.returnValue(of(mockResponse));

      component.loadReport();

      expect(component.reportData.length).toBe(1);
      expect(component.totalRecords).toBe(1);
      expect(component.grandTotal).toBe(2360);
    });

    it('should load dealer wise report data', () => {
      const mockResponse: DealerWiseJobReportSummary[] = [
        {
          dealerCode: 'D001',
          dealerName: 'Test Dealer',
          totalJobs: 5,
          totalSpares: 5000,
          totalLabour: 1500,
          totalTaxable: 10000,
          totalSGST: 900,
          totalCGST: 900,
          grandTotal: 11800,
          jobDetails: []
        }
      ];

      jobReportService.getDealerWiseJobReportAsync.and.returnValue(of(mockResponse));

      component.loadDealerWiseReport();

      expect(component.dealerWiseData.length).toBe(1);
      expect(component.isDealerWiseView).toBeTruthy();
    });

    it('should load summary stats', () => {
      const mockStats: JobReportSummaryStats = {
        totalJobs: 10,
        totalRevenue: 50000,
        totalTaxes: 9000,
        completedJobs: 10,
        pendingJobs: 0,
        averageJobValue: 5000
      };

      jobReportService.getJobReportSummaryStats.and.returnValue(of(mockStats));

      component.loadSummaryStats();

      expect(component.summaryStats?.totalJobs).toBe(10);
      expect(component.summaryStats?.totalRevenue).toBe(50000);
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset pagination on search', () => {
      component.pageIndex = 5;
      jobReportService.getJobReportAsync.and.returnValue(of({
        data: [],
        totalRecords: 0,
        pageIndex: 1,
        pageSize: 20,
        totalSpares: 0,
        totalAcsr: 0,
        totalOil: 0,
        totalLabour: 0,
        totalOutsideWork: 0,
        totalTaxable: 0,
        totalSGST: 0,
        totalCGST: 0,
        grandTotal: 0
      } as JobReportPagedResponse));

      component.onSearch();

      expect(component.pageIndex).toBe(1);
    });

    it('should reset form values on reset', () => {
      component.filterForm.patchValue({
        dealerCode: 'D001',
        partyName: 'Test'
      });

      component.onReset();

      expect(component.filterForm.get('dealerCode')?.value).toBeFalsy();
      expect(component.filterForm.get('partyName')?.value).toBeFalsy();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.reportData = [
        {
          srNo: 2,
          invoiceNo: 1002,
          invoiceDate: new Date('2024-02-01'),
          jobNo: 2,
          partyName: 'Party B',
          partyMobileNo: '9876543210',
          regNo: 'XYZ789',
          mechanicName: 'Jane',
          invoiceType: 'Deep',
          invoiceMode: 'Cash',
          sparesAmount: 1500,
          acsrAmount: 600,
          oilAmount: 250,
          labourAmount: 350,
          outsideWorkAmount: 0,
          taxableAmount: 2700,
          sgstAmount: 243,
          cgstAmount: 243,
          chassisNo: 'CH456',
          dealerCode: 'D002',
          serviceLocation: 'Delhi',
          jobType: 'Deep',
          serviceHead: 'Service',
          serviceType: 'Job',
          jobInDate: new Date(),
          estimatedDeliveryDate: new Date()
        },
        {
          srNo: 1,
          invoiceNo: 1001,
          invoiceDate: new Date('2024-01-01'),
          jobNo: 1,
          partyName: 'Party A',
          partyMobileNo: '1234567890',
          regNo: 'ABC123',
          mechanicName: 'John',
          invoiceType: 'Deep',
          invoiceMode: 'Cash',
          sparesAmount: 1000,
          acsrAmount: 500,
          oilAmount: 200,
          labourAmount: 300,
          outsideWorkAmount: 0,
          taxableAmount: 2000,
          sgstAmount: 180,
          cgstAmount: 180,
          chassisNo: 'CH123',
          dealerCode: 'D001',
          serviceLocation: 'Mumbai',
          jobType: 'Deep',
          serviceHead: 'Service',
          serviceType: 'Job',
          jobInDate: new Date(),
          estimatedDeliveryDate: new Date()
        }
      ];
    });

    it('should sort by column in ascending order', () => {
      component.onSort('srNo');

      expect(component.sortColumn).toBe('srNo');
      expect(component.sortDirection).toBe('asc');
    });

    it('should toggle sort direction on same column click', () => {
      component.onSort('srNo');
      expect(component.sortDirection).toBe('asc');

      component.onSort('srNo');
      expect(component.sortDirection).toBe('desc');
    });
  });

  describe('View Modes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle between table and dealer wise view', () => {
      expect(component.isDealerWiseView).toBeFalsy();

      jobReportService.getDealerWiseJobReportAsync.and.returnValue(of([]));

      component.toggleDealerWiseView();

      expect(component.isDealerWiseView).toBeTruthy();
    });

    it('should expand/collapse dealer details', () => {
      const dealerCode = 'D001';

      expect(component.expandedDealerCode).toBeNull();

      component.expandDealer(dealerCode);
      expect(component.expandedDealerCode).toBe(dealerCode);

      component.expandDealer(dealerCode);
      expect(component.expandedDealerCode).toBeNull();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should export data to Excel', () => {
      const mockData = [];
      jobReportService.exportJobCardReport.and.returnValue(of(mockData));

      component.filterForm.patchValue({
        dealerCode: 'D001'
      });

      spyOn(component as any, 'generateExcel');

      component.exportToExcel();

      expect(jobReportService.exportJobCardReport).toHaveBeenCalled();
    });

    it('should not export if dealer code is empty', () => {
      component.filterForm.patchValue({
        dealerCode: ''
      });

      spyOn(console, 'error');

      component.exportToExcel();

      expect(console.error).toHaveBeenCalledWith('Please select a dealer');
    });
  });

  describe('Formatting Utilities', () => {
    it('should format currency correctly', () => {
      const result = component.formatCurrency(1000);
      
      expect(result).toContain('₹');
      expect(result).toContain('1,000');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const result = component.formatDate(date);

      expect(result).toContain('2024');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update page index on page change', () => {
      jobReportService.getJobReportAsync.and.returnValue(of({
        data: [],
        totalRecords: 100,
        pageIndex: 2,
        pageSize: 20,
        totalSpares: 0,
        totalAcsr: 0,
        totalOil: 0,
        totalLabour: 0,
        totalOutsideWork: 0,
        totalTaxable: 0,
        totalSGST: 0,
        totalCGST: 0,
        grandTotal: 0
      } as JobReportPagedResponse));

      component.onPageChange({ pageIndex: 1, pageSize: 20 });

      expect(component.pageIndex).toBe(2);
    });

    it('should update page size on page size change', () => {
      jobReportService.getJobReportAsync.and.returnValue(of({
        data: [],
        totalRecords: 100,
        pageIndex: 1,
        pageSize: 50,
        totalSpares: 0,
        totalAcsr: 0,
        totalOil: 0,
        totalLabour: 0,
        totalOutsideWork: 0,
        totalTaxable: 0,
        totalSGST: 0,
        totalCGST: 0,
        grandTotal: 0
      } as JobReportPagedResponse));

      component.pageSize = 50;
      component.onPageChange({ pageIndex: 0, pageSize: 50 });

      expect(component.pageSize).toBe(50);
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on component destroy', () => {
      fixture.detectChanges();

      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});