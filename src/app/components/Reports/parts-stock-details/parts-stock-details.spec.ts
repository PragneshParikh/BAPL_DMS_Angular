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
import { PartsStockDetails } from './parts-stock-details';

describe('PartsStockDetails', () => {
  let component: PartsStockDetails;
  let fixture: ComponentFixture<PartsStockDetails>;
  let getPartsStockDetailsByDealer: jasmine.Spy;

  const reportRow = {
    srNo: 1,
    itemtype: 1,
    itemname: 'Part',
    itemcode: 'P-1',
    itemdesc: 'Part description',
    hsncode: '1234',
    dlrprice: 10,
    custprice: 12,
    gst: 18,
    grpidno: 1,
    batchClosingQty: 4,
    vendorCode: 'D-1',
    dealerLocation: 'L-1',
    dealerName: 'Dealer One',
    locname: 'Workshop',
    groupType: 'Parts',
    saleCount: 2,
    purchaseCount: 3,
    stockAdjustmentQty: 1,
    mrp: 11
  };

  beforeEach(async () => {
    getPartsStockDetailsByDealer = jasmine.createSpy('getPartsStockDetailsByDealer')
      .and.returnValue(of([reportRow]));

    await TestBed.configureTestingModule({
      imports: [PartsStockDetails],
      providers: [
        { provide: StorageService, useValue: { getRole: () => 'superadmin', getDealerCode: () => '' } },
        { provide: LoaderService, useValue: { show: jasmine.createSpy(), hide: jasmine.createSpy() } },
        { provide: ReportService, useValue: { getPartsStockDetailsByDealer } },
        { provide: ToastService, useValue: { show: jasmine.createSpy() } },
        { provide: DealerService, useValue: { getDealerDropdown: () => of({ data: [] }) } },
        { provide: LocationMasterService, useValue: { getLocationDropdownByDealerCode: () => of([]) } },
        { provide: MenuAccessService, useValue: { canDownload: () => false } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsStockDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters by location code and returns dealer and location names', () => {
    component.stockReportFilterFormData = {
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

    component.getPartsStockDetails();

    expect(getPartsStockDetailsByDealer).toHaveBeenCalledWith(
      1,
      jasmine.any(Date),
      jasmine.any(Date),
      null,
      'L-1',
      'D-1'
    );
    expect(component.partsStockData[0].dealerName).toBe('Dealer One');
    expect(component.partsStockData[0].locname).toBe('Workshop');
  });
});
