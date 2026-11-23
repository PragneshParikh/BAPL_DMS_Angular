import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { HistoricalRepairBill } from './historical-repair-bill';

describe('HistoricalRepairBill', () => {
  let component: HistoricalRepairBill;
  let fixture: ComponentFixture<HistoricalRepairBill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalRepairBill],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalRepairBill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});