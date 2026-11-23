import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HistoricalJobReport } from './historical-job-report';

describe('HistoricalJobReport', () => {
  let component: HistoricalJobReport;
  let fixture: ComponentFixture<HistoricalJobReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalJobReport],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalJobReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});