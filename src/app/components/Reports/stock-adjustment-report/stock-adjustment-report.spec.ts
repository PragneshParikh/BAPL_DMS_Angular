import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StorageService } from '../../../core/services/storage';
import { LoaderService } from '../../../core/services/loader';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../shared/toaster/toast-service';
import { DealerService } from '../../../core/services/dealer-service';
import { LocationMasterService } from '../../../core/services/location-master-service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { Router } from '@angular/router';
import { StockAdjustmentReport } from './stock-adjustment-report';

describe('StockAdjustmentReport', () => {
  let component: StockAdjustmentReport;
  let fixture: ComponentFixture<StockAdjustmentReport>;
  let getStockAdjustmentReport: jasmine.Spy;

  const reportRow = {
    prefixNo: 'SA/1',
    adjustmentDate: '2026-10-15',
    dealerCode: 'D-1',
    dealerName: 'Dealer One',
    locationCode: 'L-1',
    locationName: 'Workshop',
    partNo: 'P-1',
    description: 'Part description',
    rateStock: 10,
    currentStock: 2,
    updateStock: 3,
    upQuantityStg: 1,
    finalQty: 3,
    remarks: null,
    locareaidno: 2
  };

  beforeEach(async () => {
    getStockAdjustmentReport = jasmine.createSpy('getStockAdjustmentReport')
      .and.returnValue(of([reportRow]));

    await TestBed.configureTestingModule({
      imports: [StockAdjustmentReport],
      providers: [
        { provide: StorageService, useValue: { getRole: () => 'superadmin', getDealerCode: () => '' } },
        { provide: LoaderService, useValue: { show: jasmine.createSpy(), hide: jasmine.createSpy() } },
        { provide: ReportService, useValue: { getStockAdjustmentReport } },
        { provide: ToastService, useValue: { show: jasmine.createSpy() } },
        { provide: DealerService, useValue: { getDealerDropdown: () => of({ data: [] }) } },
        { provide: LocationMasterService, useValue: { getLocationDropdownByDealerCode: () => of([]) } },
        { provide: MenuAccessService, useValue: { canDownload: () => false } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAdjustmentReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters by location code and returns dealer and location names', () => {
    component.reportFilterFormData = {
      selectedDealerCode: 'ALL',
      selectedLocation: {
        loccode: 'L-1',
        locname: 'Workshop',
        dealercode: 'D-1',
        locareaidno: 2,
        dealerName: 'Dealer One'
      },
      fromDate: '2026-10-01',
      toDate: '2026-10-31'
    };

    component.getStockAdjustmentReport();

    expect(getStockAdjustmentReport).toHaveBeenCalledWith(
      jasmine.any(Date),
      jasmine.any(Date),
      null,
      'L-1',
      'D-1'
    );
    expect(component.stockAdjustmentData[0].dealerName).toBe('Dealer One');
    expect(component.stockAdjustmentData[0].locationName).toBe('Workshop');
  });
});
