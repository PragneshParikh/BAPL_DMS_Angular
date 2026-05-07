import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverySlip } from './delivery-slip';

describe('DeliverySlip', () => {
  let component: DeliverySlip;
  let fixture: ComponentFixture<DeliverySlip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliverySlip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverySlip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
