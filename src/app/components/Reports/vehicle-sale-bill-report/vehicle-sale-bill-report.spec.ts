import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleSaleBillReport } from './vehicle-sale-bill-report';

describe('VehicleSaleBillReport', () => {
  let component: VehicleSaleBillReport;
  let fixture: ComponentFixture<VehicleSaleBillReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleSaleBillReport],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleSaleBillReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});