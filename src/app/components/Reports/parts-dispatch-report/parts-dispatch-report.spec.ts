import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsDispatchReport } from './parts-dispatch-report';

describe('PartsDispatchReport', () => {
  let component: PartsDispatchReport;
  let fixture: ComponentFixture<PartsDispatchReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsDispatchReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsDispatchReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
