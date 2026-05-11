import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkInProgress } from './work-in-progress';

describe('WorkInProgress', () => {
  let component: WorkInProgress;
  let fixture: ComponentFixture<WorkInProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkInProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkInProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
