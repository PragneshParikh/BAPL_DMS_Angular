import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockSummaryDetail } from './stock-summary-detail';

describe('StockSummaryDetail', () => {
  let component: StockSummaryDetail;
  let fixture: ComponentFixture<StockSummaryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockSummaryDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockSummaryDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
