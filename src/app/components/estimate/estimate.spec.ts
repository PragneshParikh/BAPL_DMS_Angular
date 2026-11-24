import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { EstimateService } from '../../core/services/estimate.service';
import { LedgerMasterService } from '../../core/services/ledger-master';
import { MenuAccessService } from '../../core/services/menu-access.service';
import { ReportService } from '../../core/services/report.service';
import { Estimate } from './estimate';

describe('Estimate', () => {
  let component: Estimate;
  let fixture: ComponentFixture<Estimate>;
  let estimateService: jasmine.SpyObj<EstimateService>;
  let httpGet: jasmine.Spy;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    estimateService = jasmine.createSpyObj<EstimateService>('EstimateService', [
      'getNextEstimationNo',
      'getJobTypes',
      'getById',
      'create',
      'update',
      'searchParts',
      'searchLabour',
      'downloadPdf',
      'emailEstimate'
    ]);
    estimateService.getNextEstimationNo.and.returnValue(of('EST003'));
    estimateService.getJobTypes.and.returnValue(of([]));
    estimateService.create.and.returnValue(of(42));
    estimateService.emailEstimate.and.returnValue(of(new Blob(['estimate'], { type: 'application/pdf' })));

    const reportService = jasmine.createSpyObj<ReportService>('ReportService', ['getChassisList']);
    reportService.getChassisList.and.returnValue(of([]));
    const ledgerMasterService = jasmine.createSpyObj<LedgerMasterService>(
      'LedgerMasterService',
      ['getInsuranceLedgers']
    );
    ledgerMasterService.getInsuranceLedgers.and.returnValue(of([]));
    const menuAccess = jasmine.createSpyObj<MenuAccessService>(
      'MenuAccessService',
      ['canCreate', 'canEdit', 'canDownload']
    );
    menuAccess.canCreate.and.returnValue(true);
    menuAccess.canEdit.and.returnValue(true);
    menuAccess.canDownload.and.returnValue(true);
    const httpClient = { get: jasmine.createSpy('get').and.returnValue(of({})) };
    httpGet = httpClient.get;
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Estimate],
      providers: [
        { provide: EstimateService, useValue: estimateService },
        { provide: ReportService, useValue: reportService },
        { provide: LedgerMasterService, useValue: ledgerMasterService },
        { provide: MenuAccessService, useValue: menuAccess },
        { provide: HttpClient, useValue: httpClient },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Estimate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('binds customer and vehicle details after chassis search', () => {
    httpGet.and.returnValue(of({
      partyDetails: {
        partyName: 'Asha Customer',
        partyMobile: '9876543210',
        address1: 'Main Road',
        address2: 'Near Park',
        pin: '400001',
        email: 'asha@example.com',
        city: 'Mumbai',
        state: 'Maharashtra'
      },
      vehicleDetails: {
        chassisNo: 'CHASSIS-42',
        batteries: [],
        motors: [],
        chargers: []
      }
    }));
    component.form.get('searchNo')?.setValue('CHASSIS-42');

    component.searchVehicle();

    expect(component.customerFound).toBeTrue();
    expect(component.form.get('customerName')?.value).toBe('Asha Customer');
    expect(component.form.get('customerEmail')?.value).toBe('asha@example.com');
    expect(component.form.get('chassisNo')?.value).toBe('CHASSIS-42');
  });

  it('keeps a newly saved estimate open for emailing', () => {
    component.customerFound = true;
    component.form.patchValue({
      chassisNo: 'CHASSIS-42',
      customerName: 'Asha Customer',
      customerEmail: 'asha@example.com'
    });

    component.onSave();

    expect(estimateService.create).toHaveBeenCalled();
    expect(component.estimateId).toBe(42);
    expect(component.isEditMode).toBeTrue();
    expect(component.form.get('estimateEmail')?.value).toBe('asha@example.com');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('emails the saved PDF to the entered address', () => {
    const openedWindow = {
      location: { href: '' },
      close: jasmine.createSpy('close')
    } as unknown as Window;
    spyOn(window, 'open').and.returnValue(openedWindow);
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:estimate');
    component.estimateId = 42;
    component.form.get('estimateEmail')?.setValue('recipient@example.com');

    component.onEmailEstimate();

    expect(estimateService.emailEstimate).toHaveBeenCalledWith(42, 'recipient@example.com');
    expect(openedWindow.location.href).toBe('blob:estimate');
    expect(component.emailSuccess).toContain('recipient@example.com');
  });
});
