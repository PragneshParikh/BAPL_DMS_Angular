import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairBillInvoice } from './repair-bill-invoice';

describe('RepairBillInvoice', () => {
  let component: RepairBillInvoice;
  let fixture: ComponentFixture<RepairBillInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBillInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairBillInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
