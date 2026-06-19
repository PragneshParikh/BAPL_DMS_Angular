import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSourceMaster } from './job-source-master';

describe('JobSourceMaster', () => {
  let component: JobSourceMaster;
  let fixture: ComponentFixture<JobSourceMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSourceMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobSourceMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
