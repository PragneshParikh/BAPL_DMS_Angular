import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HSRPOrder } from './hsrp-order';

describe('HSRPOrder', () => {
  let component: HSRPOrder;
  let fixture: ComponentFixture<HSRPOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HSRPOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HSRPOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
