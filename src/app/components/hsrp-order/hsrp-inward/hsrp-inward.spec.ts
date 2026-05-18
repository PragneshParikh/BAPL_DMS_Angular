import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HsrpInward } from './hsrp-inward';

describe('HsrpInward', () => {
  let component: HsrpInward;
  let fixture: ComponentFixture<HsrpInward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HsrpInward]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HsrpInward);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
