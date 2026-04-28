import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedBatteryWarrantyList } from './extended-battery-warranty-list';

describe('ExtendedBatteryWarrantyList', () => {
  let component: ExtendedBatteryWarrantyList;
  let fixture: ComponentFixture<ExtendedBatteryWarrantyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedBatteryWarrantyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtendedBatteryWarrantyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
