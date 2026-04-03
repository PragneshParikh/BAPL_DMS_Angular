import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleSaleBill } from './vehicle-sale-bill';

describe('VehicleSaleBill', () => {
  let component: VehicleSaleBill;
  let fixture: ComponentFixture<VehicleSaleBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleSaleBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleSaleBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
