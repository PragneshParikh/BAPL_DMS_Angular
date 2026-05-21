import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HSRPOrderList } from './hsrporder-list';

describe('HSRPOrderList', () => {
  let component: HSRPOrderList;
  let fixture: ComponentFixture<HSRPOrderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HSRPOrderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HSRPOrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
