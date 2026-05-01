import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelwiseServiceSchedule } from './modelwise-service-schedule';

describe('ModelwiseServiceSchedule', () => {
  let component: ModelwiseServiceSchedule;
  let fixture: ComponentFixture<ModelwiseServiceSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelwiseServiceSchedule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelwiseServiceSchedule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
