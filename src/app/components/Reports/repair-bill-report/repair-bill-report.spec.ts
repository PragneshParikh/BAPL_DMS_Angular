import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairBillReport } from './repair-bill-report';

describe('RepairBillReport', () => {
  let component: RepairBillReport;
  let fixture: ComponentFixture<RepairBillReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBillReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairBillReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
