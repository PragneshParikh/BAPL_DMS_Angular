import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobTypeMaster } from './job-type-master';

describe('JobTypeMaster', () => {
  let component: JobTypeMaster;
  let fixture: ComponentFixture<JobTypeMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobTypeMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobTypeMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
