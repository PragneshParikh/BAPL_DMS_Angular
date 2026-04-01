import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePurchaseOrder } from './vehicle-purchase-order';

describe('VehiclePurchaseOrder', () => {
  let component: VehiclePurchaseOrder;
  let fixture: ComponentFixture<VehiclePurchaseOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclePurchaseOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiclePurchaseOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
