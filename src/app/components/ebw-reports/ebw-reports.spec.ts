import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EBWReports } from './ebw-reports';

describe('EBWReports', () => {
  let component: EBWReports;
  let fixture: ComponentFixture<EBWReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EBWReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EBWReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
