import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyInvoiceList } from './warranty-invoice-list';

describe('WarrantyInvoiceList', () => {
  let component: WarrantyInvoiceList;
  let fixture: ComponentFixture<WarrantyInvoiceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyInvoiceList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyInvoiceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
