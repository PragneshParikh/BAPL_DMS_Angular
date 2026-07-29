import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeServiceRateList } from './free-service-rate-list';

describe('FreeServiceRateList', () => {
  let component: FreeServiceRateList;
  let fixture: ComponentFixture<FreeServiceRateList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeServiceRateList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeServiceRateList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
