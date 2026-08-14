import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyPackagingList } from './warranty-packaging-list';

describe('WarrantyPackagingList', () => {
  let component: WarrantyPackagingList;
  let fixture: ComponentFixture<WarrantyPackagingList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyPackagingList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyPackagingList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
