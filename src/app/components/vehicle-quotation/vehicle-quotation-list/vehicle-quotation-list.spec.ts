import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleQuotationList } from './vehicle-quotation-list';

describe('VehicleQuotationList', () => {
  let component: VehicleQuotationList;
  let fixture: ComponentFixture<VehicleQuotationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleQuotationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleQuotationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
