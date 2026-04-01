import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVehiclePurchaseOrder } from './add-vehicle-purchase-order';

describe('AddVehiclePurchaseOrder', () => {
  let component: AddVehiclePurchaseOrder;
  let fixture: ComponentFixture<AddVehiclePurchaseOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVehiclePurchaseOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVehiclePurchaseOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
