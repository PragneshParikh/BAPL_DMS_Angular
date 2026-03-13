import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryCapacityMaster } from './battery-capacity-master';

describe('BatteryCapacityMaster', () => {
  let component: BatteryCapacityMaster;
  let fixture: ComponentFixture<BatteryCapacityMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryCapacityMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryCapacityMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
