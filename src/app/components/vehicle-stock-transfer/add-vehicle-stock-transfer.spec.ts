import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVehicleStockTransfer } from './add-vehicle-stock-transfer';

describe('AddVehicleStockTransfer', () => {
  let component: AddVehicleStockTransfer;
  let fixture: ComponentFixture<AddVehicleStockTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVehicleStockTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVehicleStockTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
