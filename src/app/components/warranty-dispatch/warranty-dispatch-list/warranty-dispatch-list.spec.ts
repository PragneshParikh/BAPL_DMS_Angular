import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyDispatchList } from './warranty-dispatch-list';

describe('WarrantyDispatchList', () => {
  let component: WarrantyDispatchList;
  let fixture: ComponentFixture<WarrantyDispatchList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyDispatchList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyDispatchList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
