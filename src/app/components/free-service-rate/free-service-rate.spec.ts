import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeServiceRate } from './free-service-rate';

describe('FreeServiceRate', () => {
  let component: FreeServiceRate;
  let fixture: ComponentFixture<FreeServiceRate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeServiceRate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeServiceRate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
