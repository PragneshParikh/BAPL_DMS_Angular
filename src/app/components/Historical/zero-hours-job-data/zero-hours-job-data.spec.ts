import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZeroHoursJobData } from './zero-hours-job-data';

describe('ZeroHoursJobData', () => {
  let component: ZeroHoursJobData;
  let fixture: ComponentFixture<ZeroHoursJobData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZeroHoursJobData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZeroHoursJobData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
