import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyInvoice } from './warranty-invoice';

describe('WarrantyInvoice', () => {
  let component: WarrantyInvoice;
  let fixture: ComponentFixture<WarrantyInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
