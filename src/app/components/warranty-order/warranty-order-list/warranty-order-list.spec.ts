import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyOrderList } from './warranty-order-list';

describe('WarrantyOrderList', () => {
  let component: WarrantyOrderList;
  let fixture: ComponentFixture<WarrantyOrderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyOrderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyOrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
