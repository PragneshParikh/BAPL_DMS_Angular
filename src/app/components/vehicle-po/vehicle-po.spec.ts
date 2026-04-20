import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePO } from './vehicle-po';

describe('VehiclePO', () => {
  let component: VehiclePO;
  let fixture: ComponentFixture<VehiclePO>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclePO]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiclePO);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
