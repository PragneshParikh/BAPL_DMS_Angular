import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EBWInvoice } from './ebw-invoice';

describe('EBWInvoice', () => {
  let component: EBWInvoice;
  let fixture: ComponentFixture<EBWInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EBWInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EBWInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
