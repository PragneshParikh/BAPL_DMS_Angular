import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabourRateMaster } from './labour-rate-master';

describe('LabourRateMaster', () => {
  let component: LabourRateMaster;
  let fixture: ComponentFixture<LabourRateMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabourRateMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabourRateMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
