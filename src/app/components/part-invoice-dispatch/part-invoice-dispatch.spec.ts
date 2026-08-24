import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartInvoiceDispatch } from './part-invoice-dispatch';

describe('PartInvoiceDispatch', () => {
  let component: PartInvoiceDispatch;
  let fixture: ComponentFixture<PartInvoiceDispatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartInvoiceDispatch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartInvoiceDispatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
