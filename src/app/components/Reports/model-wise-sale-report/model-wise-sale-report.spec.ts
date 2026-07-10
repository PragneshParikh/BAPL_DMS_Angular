import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelWiseSaleReport } from './model-wise-sale-report';

describe('ModelWiseSaleReport', () => {
  let component: ModelWiseSaleReport;
  let fixture: ComponentFixture<ModelWiseSaleReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelWiseSaleReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelWiseSaleReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
