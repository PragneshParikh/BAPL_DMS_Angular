import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedBatteryWarranty } from './extended-battery-warranty';

describe('ExtendedBatteryWarranty', () => {
  let component: ExtendedBatteryWarranty;
  let fixture: ComponentFixture<ExtendedBatteryWarranty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedBatteryWarranty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtendedBatteryWarranty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
