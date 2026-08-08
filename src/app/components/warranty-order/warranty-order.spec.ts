import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyOrder } from './warranty-order';

describe('WarrantyOrder', () => {
  let component: WarrantyOrder;
  let fixture: ComponentFixture<WarrantyOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
