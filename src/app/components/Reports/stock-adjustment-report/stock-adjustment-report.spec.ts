import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockAdjustmentReport } from './stock-adjustment-report';

describe('StockAdjustmentReport', () => {
  let component: StockAdjustmentReport;
  let fixture: ComponentFixture<StockAdjustmentReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAdjustmentReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAdjustmentReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
