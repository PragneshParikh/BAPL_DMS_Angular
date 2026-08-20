//src\app\components\prefix-master\prefix-master-details\prefix-master-details.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrefixMasterDetails } from './prefix-master-details';

describe('PrefixMasterDetails', () => {
  let component: PrefixMasterDetails;
  let fixture: ComponentFixture<PrefixMasterDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrefixMasterDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrefixMasterDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
