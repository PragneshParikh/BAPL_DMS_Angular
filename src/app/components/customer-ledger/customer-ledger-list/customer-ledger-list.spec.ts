import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerLedgerList } from './customer-ledger-list';

describe('CustomerLedgerList', () => {
  let component: CustomerLedgerList;
  let fixture: ComponentFixture<CustomerLedgerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerLedgerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerLedgerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
