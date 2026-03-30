import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptEntry } from './receipt-entry';

describe('ReceiptEntry', () => {
  let component: ReceiptEntry;
  let fixture: ComponentFixture<ReceiptEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
