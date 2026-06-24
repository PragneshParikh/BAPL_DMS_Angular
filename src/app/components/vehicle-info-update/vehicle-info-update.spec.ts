import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleInfoUpdate } from './vehicle-info-update';

describe('VehicleInfoUpdate', () => {
  let component: VehicleInfoUpdate;
  let fixture: ComponentFixture<VehicleInfoUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleInfoUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleInfoUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
