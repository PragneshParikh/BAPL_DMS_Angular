import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyClaimList } from './warranty-claim-list';

describe('WarrantyClaimList', () => {
  let component: WarrantyClaimList;
  let fixture: ComponentFixture<WarrantyClaimList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyClaimList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyClaimList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
