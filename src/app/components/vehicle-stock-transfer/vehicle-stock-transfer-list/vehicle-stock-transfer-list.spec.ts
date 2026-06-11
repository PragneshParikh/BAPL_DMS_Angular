import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleStockTransferList } from './vehicle-stock-transfer-list';

describe('VehicleStockTransferList', () => {
  let component: VehicleStockTransferList;
  let fixture: ComponentFixture<VehicleStockTransferList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleStockTransferList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleStockTransferList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
