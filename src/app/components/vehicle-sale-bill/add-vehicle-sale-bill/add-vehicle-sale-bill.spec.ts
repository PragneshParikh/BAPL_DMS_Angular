import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVehicleSaleBill } from './add-vehicle-sale-bill';

describe('AddVehicleSaleBill', () => {
  let component: AddVehicleSaleBill;
  let fixture: ComponentFixture<AddVehicleSaleBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVehicleSaleBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVehicleSaleBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
