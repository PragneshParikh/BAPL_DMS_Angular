import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewZeroHours } from './new-zero-hours';

describe('NewZeroHours', () => {
  let component: NewZeroHours;
  let fixture: ComponentFixture<NewZeroHours>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewZeroHours]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewZeroHours);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
