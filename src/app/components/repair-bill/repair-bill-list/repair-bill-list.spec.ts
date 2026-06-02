import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairBillList } from './repair-bill-list';

describe('RepairBillList', () => {
  let component: RepairBillList;
  let fixture: ComponentFixture<RepairBillList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBillList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairBillList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
