import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleOpenStock } from './vehicle-open-stock';

describe('VehicleOpenStock', () => {
  let component: VehicleOpenStock;
  let fixture: ComponentFixture<VehicleOpenStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleOpenStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleOpenStock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
