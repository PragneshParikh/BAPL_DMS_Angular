import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChassisDetail } from './chassis-detail';

describe('ChassisDetail', () => {
  let component: ChassisDetail;
  let fixture: ComponentFixture<ChassisDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChassisDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChassisDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
