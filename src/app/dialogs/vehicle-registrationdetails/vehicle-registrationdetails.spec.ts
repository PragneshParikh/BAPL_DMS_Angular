import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRegistrationdetails } from './vehicle-registrationdetails';

describe('VehicleRegistrationdetails', () => {
  let component: VehicleRegistrationdetails;
  let fixture: ComponentFixture<VehicleRegistrationdetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRegistrationdetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRegistrationdetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
