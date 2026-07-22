import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisionReport } from './comparision-report';

describe('ComparisionReport', () => {
  let component: ComparisionReport;
  let fixture: ComponentFixture<ComparisionReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisionReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisionReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
