import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiTracking } from './api-tracking';

describe('ApiTracking', () => {
  let component: ApiTracking;
  let fixture: ComponentFixture<ApiTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiTracking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
