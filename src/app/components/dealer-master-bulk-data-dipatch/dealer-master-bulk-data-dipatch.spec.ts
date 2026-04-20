import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerMasterBulkDataDipatch } from './dealer-master-bulk-data-dipatch';

describe('DealerMasterBulkDataDipatch', () => {
  let component: DealerMasterBulkDataDipatch;
  let fixture: ComponentFixture<DealerMasterBulkDataDipatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerMasterBulkDataDipatch]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DealerMasterBulkDataDipatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
