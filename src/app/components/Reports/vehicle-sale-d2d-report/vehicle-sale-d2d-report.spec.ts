import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleSaleD2dReport } from './vehicle-sale-d2d-report';

describe('VehicleSaleD2dReport', () => {
  let component: VehicleSaleD2dReport;
  let fixture: ComponentFixture<VehicleSaleD2dReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleSaleD2dReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleSaleD2dReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
