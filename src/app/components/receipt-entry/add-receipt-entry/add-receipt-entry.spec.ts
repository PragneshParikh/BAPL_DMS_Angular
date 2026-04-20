import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReceiptEntry } from './add-receipt-entry';

describe('AddReceiptEntry', () => {
  let component: AddReceiptEntry;
  let fixture: ComponentFixture<AddReceiptEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddReceiptEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddReceiptEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
