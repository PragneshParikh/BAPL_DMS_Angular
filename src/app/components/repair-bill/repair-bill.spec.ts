import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairBill } from './repair-bill';

describe('RepairBill', () => {
  let component: RepairBill;
  let fixture: ComponentFixture<RepairBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
