import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterBill } from './counter-bill';

describe('CounterBill', () => {
  let component: CounterBill;
  let fixture: ComponentFixture<CounterBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
