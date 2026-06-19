import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeServiceClaimList } from './free-service-claim-list';

describe('FreeServiceClaimList', () => {
  let component: FreeServiceClaimList;
  let fixture: ComponentFixture<FreeServiceClaimList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeServiceClaimList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeServiceClaimList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
