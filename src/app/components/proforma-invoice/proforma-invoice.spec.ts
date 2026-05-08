import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProformaInvoice } from './proforma-invoice';

describe('ProformaInvoice', () => {
  let component: ProformaInvoice;
  let fixture: ComponentFixture<ProformaInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProformaInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProformaInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
