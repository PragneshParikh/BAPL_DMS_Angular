import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeServiceClaim } from './free-service-claim';

describe('FreeServiceClaim', () => {
  let component: FreeServiceClaim;
  let fixture: ComponentFixture<FreeServiceClaim>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeServiceClaim]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeServiceClaim);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
