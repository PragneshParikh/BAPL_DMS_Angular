import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotInspectionDetails } from './lot-inspection-details';

describe('LotInspectionDetails', () => {
  let component: LotInspectionDetails;
  let fixture: ComponentFixture<LotInspectionDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotInspectionDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotInspectionDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
