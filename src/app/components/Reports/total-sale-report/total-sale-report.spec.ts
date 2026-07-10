import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalSaleReport } from './total-sale-report';

describe('TotalSaleReport', () => {
  let component: TotalSaleReport;
  let fixture: ComponentFixture<TotalSaleReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalSaleReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalSaleReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
