import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformaInvoice } from './performa-invoice';

describe('PerformaInvoice', () => {
  let component: PerformaInvoice;
  let fixture: ComponentFixture<PerformaInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformaInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerformaInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
