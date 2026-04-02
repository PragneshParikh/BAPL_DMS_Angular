import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobCardAddForm } from './job-card-add-form';

describe('JobCardAddForm', () => {
  let component: JobCardAddForm;
  let fixture: ComponentFixture<JobCardAddForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardAddForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobCardAddForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
