import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialTransferDetail } from './material-transfer-detail';

describe('MaterialTransferDetail', () => {
  let component: MaterialTransferDetail;
  let fixture: ComponentFixture<MaterialTransferDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialTransferDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialTransferDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
