import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyJobCardClaim } from './warranty-job-card-claim';

describe('WarrantyJobCardClaim', () => {
  let component: WarrantyJobCardClaim;
  let fixture: ComponentFixture<WarrantyJobCardClaim>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyJobCardClaim]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyJobCardClaim);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
