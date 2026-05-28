import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabourMaster } from './labour-master-import';

describe('LabourMaster', () => {
  let component: LabourMaster;
  let fixture: ComponentFixture<LabourMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabourMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabourMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
