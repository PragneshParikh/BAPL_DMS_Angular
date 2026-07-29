import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterBillPrint } from './counter-bill-print';

describe('CounterBillPrint', () => {
  let component: CounterBillPrint;
  let fixture: ComponentFixture<CounterBillPrint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterBillPrint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterBillPrint);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
