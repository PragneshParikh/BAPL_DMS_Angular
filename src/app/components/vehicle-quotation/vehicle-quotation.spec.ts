import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleQuotation } from './vehicle-quotation';

describe('VehicleQuotation', () => {
  let component: VehicleQuotation;
  let fixture: ComponentFixture<VehicleQuotation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleQuotation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleQuotation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
