import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairBillPerforma } from './repair-bill-performa';

describe('RepairBillPerforma', () => {
  let component: RepairBillPerforma;
  let fixture: ComponentFixture<RepairBillPerforma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairBillPerforma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairBillPerforma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
