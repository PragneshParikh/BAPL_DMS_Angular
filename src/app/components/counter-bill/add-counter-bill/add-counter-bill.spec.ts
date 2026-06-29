import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCounterBill } from './add-counter-bill';

describe('AddCounterBill', () => {
  let component: AddCounterBill;
  let fixture: ComponentFixture<AddCounterBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCounterBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCounterBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
