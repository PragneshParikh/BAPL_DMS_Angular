import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleInvoiceDispatch } from './vehicle-invoice-dispatch';

describe('VehicleInvoiceDispatch', () => {
  let component: VehicleInvoiceDispatch;
  let fixture: ComponentFixture<VehicleInvoiceDispatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleInvoiceDispatch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleInvoiceDispatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
